-- One Line Frames
-- Submission uploads and moderation workflow

begin;

-- Storage policies cannot query approved submissions directly because public
-- submission reads are intentionally restricted to an RPC.
create or replace function public.is_approved_display_image(image_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.submissions
    where display_image_path = image_path
      and status = 'approved'
  );
$$;

revoke all on function public.is_approved_display_image(text) from public;
grant execute on function public.is_approved_display_image(text)
to anon, authenticated;

-- Keep bucket creation version-controlled as well as configured locally.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'original-images',
    'original-images',
    false,
    26214400,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]
  ),
  (
    'display-images',
    'display-images',
    false,
    26214400,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Original uploads are private. Users can upload into their own UUID folder,
-- and can only remove an orphan that has not become a submission record.
drop policy if exists "original_images_insert_own" on storage.objects;
create policy "original_images_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'original-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "original_images_read_own_or_admin"
on storage.objects;
create policy "original_images_read_own_or_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'original-images'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

drop policy if exists "original_images_delete_orphan"
on storage.objects;
create policy "original_images_delete_orphan"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'original-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not exists (
    select 1
    from public.submissions as s
    where s.original_image_path = name
  )
);

-- Display images remain private until the public image-access policy is
-- finalized. Admins and owners can inspect them when they exist.
drop policy if exists "display_images_read_own_or_admin"
on storage.objects;
create policy "display_images_read_own_or_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'display-images'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

drop policy if exists "display_images_read_approved"
on storage.objects;
create policy "display_images_read_approved"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'display-images'
  and public.is_approved_display_image(name)
);

drop policy if exists "display_images_admin_insert"
on storage.objects;
create policy "display_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'display-images'
  and public.is_admin()
);

drop policy if exists "display_images_admin_update"
on storage.objects;
create policy "display_images_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'display-images'
  and public.is_admin()
)
with check (
  bucket_id = 'display-images'
  and public.is_admin()
);

drop policy if exists "display_images_admin_delete"
on storage.objects;
create policy "display_images_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'display-images'
  and public.is_admin()
);

-- Shared normalization for user and admin tag input. Five is the current
-- configurable application limit and can be revised in a later migration.
create or replace function public.normalize_submission_tags(input_tags text[])
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(tag order by tag), '{}'::text[])
  from (
    select distinct
      regexp_replace(lower(trim(raw_tag)), '\s+', ' ', 'g') as tag
    from unnest(coalesce(input_tags, '{}'::text[])) as raw_tags(raw_tag)
    where trim(raw_tag) <> ''
  ) as normalized;
$$;

revoke all on function public.normalize_submission_tags(text[])
from public, anon, authenticated;

-- Create a pending submission and its tags in one database transaction after
-- the private original has been uploaded.
create unique index if not exists submissions_original_image_path_key
on public.submissions (original_image_path);

create or replace function public.create_submission(
  p_original_image_path text,
  p_original_filename text,
  p_image_mime_type text,
  p_image_size_bytes integer,
  p_image_width integer,
  p_image_height integer,
  p_orientation text,
  p_one_line text,
  p_display_name_snapshot text,
  p_is_anonymous boolean,
  p_category_id uuid,
  p_tags text[],
  p_accept_terms boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_tags text[];
  normalized_tag text;
  tag_slug text;
  tag_id uuid;
  new_submission_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = current_user_id
      and email_confirmed_at is not null
  ) then
    raise exception 'Confirm your email before submitting a moment.';
  end if;

  if p_original_image_path is null
    or p_original_image_path !~ (
      '^' || current_user_id::text
      || '/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]+$'
    )
  then
    raise exception 'The uploaded image path is invalid.';
  end if;

  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'original-images'
      and name = p_original_image_path
  ) then
    raise exception 'The uploaded image could not be found.';
  end if;

  if p_accept_terms then
    update public.profiles
    set accepted_terms = true
    where id = current_user_id;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_user_id
      and accepted_terms = true
  ) then
    raise exception 'Submission terms must be accepted.';
  end if;

  if not exists (
    select 1
    from public.categories
    where id = p_category_id
      and is_active = true
  ) then
    raise exception 'Choose an active category.';
  end if;

  normalized_tags := public.normalize_submission_tags(p_tags);

  if cardinality(normalized_tags) > 5 then
    raise exception 'Use no more than 5 mood tags.';
  end if;

  if exists (
    select 1
    from unnest(normalized_tags) as submitted_tag
    where char_length(submitted_tag) > 30
      or submitted_tag !~ '^[a-z0-9][a-z0-9 ''-]*$'
  ) then
    raise exception 'Mood tags may use letters, numbers, spaces, apostrophes, and hyphens.';
  end if;

  if not p_is_anonymous
    and nullif(trim(p_display_name_snapshot), '') is null
  then
    raise exception 'Choose a public name or post anonymously.';
  end if;

  insert into public.submissions (
    id,
    user_id,
    original_image_path,
    original_filename,
    image_mime_type,
    image_size_bytes,
    image_width,
    image_height,
    orientation,
    one_line,
    display_name_snapshot,
    is_anonymous,
    status,
    category_id
  )
  values (
    gen_random_uuid(),
    current_user_id,
    p_original_image_path,
    nullif(trim(p_original_filename), ''),
    p_image_mime_type,
    p_image_size_bytes,
    p_image_width,
    p_image_height,
    p_orientation,
    trim(p_one_line),
    case
      when p_is_anonymous then null
      else trim(p_display_name_snapshot)
    end,
    p_is_anonymous,
    'pending',
    p_category_id
  )
  returning id into new_submission_id;

  foreach normalized_tag in array normalized_tags
  loop
    tag_slug := trim(
      both '-'
      from regexp_replace(normalized_tag, '[^a-z0-9]+', '-', 'g')
    ) || '-' || substr(md5(normalized_tag), 1, 8);

    insert into public.tags (name, slug)
    values (normalized_tag, tag_slug)
    on conflict (name) do update
    set name = excluded.name
    returning id into tag_id;

    insert into public.submission_tags (submission_id, tag_id)
    values (new_submission_id, tag_id)
    on conflict do nothing;
  end loop;

  return new_submission_id;
end;
$$;

revoke all on function public.create_submission(
  text,
  text,
  text,
  integer,
  integer,
  integer,
  text,
  text,
  text,
  boolean,
  uuid,
  text[],
  boolean
) from public, anon;

grant execute on function public.create_submission(
  text,
  text,
  text,
  integer,
  integer,
  integer,
  text,
  text,
  text,
  boolean,
  uuid,
  text[],
  boolean
) to authenticated;

-- Save metadata or make an approval/rejection decision atomically. Every
-- changed field and every status decision receives the required reason.
create or replace function public.review_submission(
  p_submission_id uuid,
  p_decision text,
  p_one_line text,
  p_display_name_snapshot text,
  p_is_anonymous boolean,
  p_category_id uuid,
  p_frame_id uuid,
  p_tags text[],
  p_display_image_path text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_user_id uuid := auth.uid();
  existing_submission public.submissions%rowtype;
  current_line text;
  next_line text := trim(p_one_line);
  next_display_name text;
  normalized_tags text[];
  old_tags text[];
  normalized_tag text;
  tag_slug text;
  tag_id uuid;
  changed_anything boolean := false;
begin
  if admin_user_id is null or not public.is_admin() then
    raise exception 'Admin access is required.';
  end if;

  if p_decision not in ('save', 'approve', 'reject') then
    raise exception 'Choose a valid review action.';
  end if;

  if nullif(trim(p_reason), '') is null then
    raise exception 'A reason is required for every moderation action.';
  end if;

  if char_length(trim(p_reason)) > 1000 then
    raise exception 'The moderation reason is too long.';
  end if;

  select *
  into existing_submission
  from public.submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found.';
  end if;

  if existing_submission.status = 'removed' then
    raise exception 'Removed submissions cannot be reviewed here.';
  end if;

  if char_length(next_line) not between 1 and 120 then
    raise exception 'The one line must be between 1 and 120 characters.';
  end if;

  if not exists (
    select 1
    from public.categories
    where id = p_category_id
      and is_active = true
  ) then
    raise exception 'Choose an active category.';
  end if;

  if p_frame_id is not null and not exists (
    select 1
    from public.frames
    where id = p_frame_id
      and is_active = true
      and (
        orientation = 'any'
        or orientation = existing_submission.orientation
      )
  ) then
    raise exception 'Choose a frame that supports this image orientation.';
  end if;

  if p_decision = 'approve' then
    if p_display_image_path is null
      or p_display_image_path !~ (
        '^' || existing_submission.user_id::text
        || '/' || existing_submission.id::text
        || '\.(jpg|png|webp)$'
      )
    then
      raise exception 'A valid display image is required before approval.';
    end if;

    if not exists (
      select 1
      from storage.objects
      where bucket_id = 'display-images'
        and name = p_display_image_path
    ) then
      raise exception 'The display image could not be found.';
    end if;
  end if;

  normalized_tags := public.normalize_submission_tags(p_tags);

  if cardinality(normalized_tags) > 5 then
    raise exception 'Use no more than 5 mood tags.';
  end if;

  if exists (
    select 1
    from unnest(normalized_tags) as submitted_tag
    where char_length(submitted_tag) > 30
      or submitted_tag !~ '^[a-z0-9][a-z0-9 ''-]*$'
  ) then
    raise exception 'Mood tags contain unsupported characters.';
  end if;

  next_display_name := case
    when p_is_anonymous then null
    else nullif(trim(p_display_name_snapshot), '')
  end;

  if not p_is_anonymous and next_display_name is null then
    raise exception 'Named posts need a public display name.';
  end if;

  current_line := coalesce(
    nullif(existing_submission.edited_one_line, ''),
    existing_submission.one_line
  );

  if current_line is distinct from next_line then
    insert into public.admin_edits (
      submission_id,
      admin_id,
      changed_field,
      old_value,
      new_value,
      reason
    )
    values (
      p_submission_id,
      admin_user_id,
      'one_line',
      to_jsonb(current_line),
      to_jsonb(next_line),
      trim(p_reason)
    );
    changed_anything := true;
  end if;

  if existing_submission.display_name_snapshot
    is distinct from next_display_name
  then
    insert into public.admin_edits (
      submission_id,
      admin_id,
      changed_field,
      old_value,
      new_value,
      reason
    )
    values (
      p_submission_id,
      admin_user_id,
      'display_name_snapshot',
      to_jsonb(existing_submission.display_name_snapshot),
      to_jsonb(next_display_name),
      trim(p_reason)
    );
    changed_anything := true;
  end if;

  if existing_submission.is_anonymous is distinct from p_is_anonymous then
    insert into public.admin_edits (
      submission_id,
      admin_id,
      changed_field,
      old_value,
      new_value,
      reason
    )
    values (
      p_submission_id,
      admin_user_id,
      'is_anonymous',
      to_jsonb(existing_submission.is_anonymous),
      to_jsonb(p_is_anonymous),
      trim(p_reason)
    );
    changed_anything := true;
  end if;

  if existing_submission.category_id is distinct from p_category_id then
    insert into public.admin_edits (
      submission_id,
      admin_id,
      changed_field,
      old_value,
      new_value,
      reason
    )
    values (
      p_submission_id,
      admin_user_id,
      'category_id',
      to_jsonb(existing_submission.category_id),
      to_jsonb(p_category_id),
      trim(p_reason)
    );
    changed_anything := true;
  end if;

  if existing_submission.frame_id is distinct from p_frame_id then
    insert into public.admin_edits (
      submission_id,
      admin_id,
      changed_field,
      old_value,
      new_value,
      reason
    )
    values (
      p_submission_id,
      admin_user_id,
      'frame_id',
      to_jsonb(existing_submission.frame_id),
      to_jsonb(p_frame_id),
      trim(p_reason)
    );
    changed_anything := true;
  end if;

  select coalesce(array_agg(t.name order by t.name), '{}'::text[])
  into old_tags
  from public.submission_tags as st
  join public.tags as t on t.id = st.tag_id
  where st.submission_id = p_submission_id;

  if old_tags is distinct from normalized_tags then
    insert into public.admin_edits (
      submission_id,
      admin_id,
      changed_field,
      old_value,
      new_value,
      reason
    )
    values (
      p_submission_id,
      admin_user_id,
      'tags',
      to_jsonb(old_tags),
      to_jsonb(normalized_tags),
      trim(p_reason)
    );
    changed_anything := true;
  end if;

  update public.submissions
  set
    edited_one_line = case
      when next_line = one_line then null
      else next_line
    end,
    display_name_snapshot = next_display_name,
    is_anonymous = p_is_anonymous,
    category_id = p_category_id,
    frame_id = p_frame_id
  where id = p_submission_id;

  delete from public.submission_tags
  where submission_id = p_submission_id;

  foreach normalized_tag in array normalized_tags
  loop
    tag_slug := trim(
      both '-'
      from regexp_replace(normalized_tag, '[^a-z0-9]+', '-', 'g')
    ) || '-' || substr(md5(normalized_tag), 1, 8);

    insert into public.tags (name, slug)
    values (normalized_tag, tag_slug)
    on conflict (name) do update
    set name = excluded.name
    returning id into tag_id;

    insert into public.submission_tags (submission_id, tag_id)
    values (p_submission_id, tag_id)
    on conflict do nothing;
  end loop;

  if p_decision = 'approve' then
    insert into public.admin_edits (
      submission_id,
      admin_id,
      changed_field,
      old_value,
      new_value,
      reason
    )
    values (
      p_submission_id,
      admin_user_id,
      'status',
      to_jsonb(existing_submission.status),
      to_jsonb('approved'::text),
      trim(p_reason)
    );

    update public.submissions
    set
      status = 'approved',
      display_image_path = p_display_image_path,
      approved_by = admin_user_id,
      approved_at = now(),
      rejection_reason = null,
      rejected_by = null,
      rejected_at = null
    where id = p_submission_id;
  elsif p_decision = 'reject' then
    insert into public.admin_edits (
      submission_id,
      admin_id,
      changed_field,
      old_value,
      new_value,
      reason
    )
    values (
      p_submission_id,
      admin_user_id,
      'status',
      to_jsonb(existing_submission.status),
      to_jsonb('rejected'::text),
      trim(p_reason)
    );

    update public.submissions
    set
      status = 'rejected',
      rejection_reason = trim(p_reason),
      rejected_by = admin_user_id,
      rejected_at = now(),
      approved_by = null,
      approved_at = null
    where id = p_submission_id;
  elsif not changed_anything then
    raise exception 'No metadata changes were found to save.';
  end if;
end;
$$;

revoke all on function public.review_submission(
  uuid,
  text,
  text,
  text,
  boolean,
  uuid,
  uuid,
  text[],
  text,
  text
) from public, anon;

grant execute on function public.review_submission(
  uuid,
  text,
  text,
  text,
  boolean,
  uuid,
  uuid,
  text[],
  text,
  text
) to authenticated;

commit;
