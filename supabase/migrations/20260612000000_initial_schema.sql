-- One Line Frames
-- Initial database schema

begin;

create extension if not exists pgcrypto;

-- Shared updated_at trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

-- One private profile row per Supabase Auth user.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text
    check (
      display_name is null
      or char_length(trim(display_name)) between 1 and 80
    ),
  username text unique
    check (
      username is null
      or (
        char_length(username) between 3 and 40
        and username = lower(trim(username))
        and username ~ '^[a-z0-9_]+$'
      )
    ),
  role text not null default 'user'
    check (role in ('user', 'admin')),
  accepted_terms boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- RLS-safe admin helper. The optional argument is retained for compatibility
-- with the draft SQL, but authorization always uses the current user.
create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

-- Automatically create a profile after signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 80)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Preset submission categories.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (char_length(trim(name)) between 1 and 80),
  slug text not null unique
    check (
      char_length(slug) between 1 and 80
      and slug = lower(trim(slug))
      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
  description text
    check (
      description is null
      or char_length(trim(description)) between 1 and 300
    ),
  theme_key text
    check (
      theme_key is null
      or char_length(trim(theme_key)) between 1 and 80
    ),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

-- Admin-selectable visual frame styles.
create table if not exists public.frames (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (char_length(trim(name)) between 1 and 80),
  slug text not null unique
    check (
      char_length(slug) between 1 and 80
      and slug = lower(trim(slug))
      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
  description text
    check (
      description is null
      or char_length(trim(description)) between 1 and 300
    ),
  orientation text not null default 'any'
    check (orientation in ('landscape', 'portrait', 'square', 'any')),
  css_class text
    check (
      css_class is null
      or char_length(trim(css_class)) between 1 and 120
    ),
  image_path text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_frames_updated_at on public.frames;
create trigger set_frames_updated_at
before update on public.frames
for each row
execute function public.set_updated_at();

-- Anonymous publicly, but always privately linked to an owner.
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  original_image_path text not null,
  display_image_path text,
  original_filename text,
  image_mime_type text
    check (
      image_mime_type is null
      or image_mime_type in (
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif'
      )
    ),
  image_size_bytes integer
    check (
      image_size_bytes is null
      or image_size_bytes between 1 and 26214400
    ),
  image_width integer check (image_width is null or image_width > 0),
  image_height integer check (image_height is null or image_height > 0),
  orientation text not null
    check (orientation in ('landscape', 'portrait', 'square')),
  one_line text not null
    check (
      char_length(trim(one_line)) between 1 and 120
    ),
  edited_one_line text
    check (
      edited_one_line is null
      or char_length(trim(edited_one_line)) between 1 and 120
    ),
  display_name_snapshot text
    check (
      display_name_snapshot is null
      or char_length(trim(display_name_snapshot)) between 1 and 80
    ),
  is_anonymous boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'removed')),
  category_id uuid not null references public.categories(id),
  frame_id uuid references public.frames(id),
  is_photo_of_week boolean not null default false,
  is_category_featured boolean not null default false,
  rejection_reason text
    check (
      rejection_reason is null
      or char_length(trim(rejection_reason)) between 1 and 1000
    ),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  rejected_by uuid references public.profiles(id),
  rejected_at timestamptz,
  removed_by uuid references public.profiles(id),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'approved' and approved_by is not null and approved_at is not null)
    or status <> 'approved'
  ),
  check (
    (status = 'rejected' and rejection_reason is not null
      and rejected_by is not null and rejected_at is not null)
    or status <> 'rejected'
  ),
  check (
    (status = 'removed' and removed_by is not null and removed_at is not null)
    or status <> 'removed'
  )
);

drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at
before update on public.submissions
for each row
execute function public.set_updated_at();

-- Protect every field that identifies the uploaded original.
create or replace function public.prevent_original_image_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.original_image_path is distinct from new.original_image_path
    or old.original_filename is distinct from new.original_filename
    or old.image_mime_type is distinct from new.image_mime_type
    or old.image_size_bytes is distinct from new.image_size_bytes
    or old.image_width is distinct from new.image_width
    or old.image_height is distinct from new.image_height
  then
    raise exception 'The original submitted image cannot be changed after upload.';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_original_image_change()
from public, anon, authenticated;

drop trigger if exists prevent_original_image_change_trigger
on public.submissions;
create trigger prevent_original_image_change_trigger
before update on public.submissions
for each row
execute function public.prevent_original_image_change();

-- Manual mood tags.
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
    check (
      char_length(name) between 1 and 50
      and name = lower(trim(name))
    ),
  slug text not null unique
    check (
      char_length(slug) between 1 and 60
      and slug = lower(trim(slug))
      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
  created_at timestamptz not null default now()
);

create table if not exists public.submission_tags (
  submission_id uuid not null
    references public.submissions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (submission_id, tag_id)
);

-- Append-only audit records for admin metadata edits.
create table if not exists public.admin_edits (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null
    references public.submissions(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  changed_field text not null
    check (char_length(trim(changed_field)) between 1 and 80),
  old_value jsonb,
  new_value jsonb,
  reason text not null
    check (char_length(trim(reason)) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- One appeal per rejected submission.
create table if not exists public.appeals (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null
    references public.submissions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  appeal_text text not null
    check (char_length(trim(appeal_text)) between 1 and 2000),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  admin_response text
    check (
      admin_response is null
      or char_length(trim(admin_response)) between 1 and 1000
    ),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id),
  check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (status <> 'pending' and reviewed_by is not null
      and reviewed_at is not null and admin_response is not null)
  )
);

drop trigger if exists set_appeals_updated_at on public.appeals;
create trigger set_appeals_updated_at
before update on public.appeals
for each row
execute function public.set_updated_at();

-- Users request removal instead of deleting submissions directly.
create table if not exists public.removal_requests (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null
    references public.submissions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null
    check (char_length(trim(reason)) between 1 and 2000),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  admin_response text
    check (
      admin_response is null
      or char_length(trim(admin_response)) between 1 and 1000
    ),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (status <> 'pending' and reviewed_by is not null
      and reviewed_at is not null and admin_response is not null)
  )
);

drop trigger if exists set_removal_requests_updated_at
on public.removal_requests;
create trigger set_removal_requests_updated_at
before update on public.removal_requests
for each row
execute function public.set_updated_at();

create unique index if not exists one_pending_removal_request_per_submission
on public.removal_requests (submission_id)
where status = 'pending';

-- Query indexes.
create index if not exists profiles_role_idx
on public.profiles (role);
create index if not exists categories_slug_idx
on public.categories (slug);
create index if not exists frames_slug_idx
on public.frames (slug);
create index if not exists submissions_user_id_idx
on public.submissions (user_id);
create index if not exists submissions_status_idx
on public.submissions (status);
create index if not exists submissions_category_id_idx
on public.submissions (category_id);
create index if not exists submissions_created_at_idx
on public.submissions (created_at desc);
create index if not exists tags_slug_idx
on public.tags (slug);
create index if not exists admin_edits_submission_id_idx
on public.admin_edits (submission_id);
create index if not exists appeals_submission_id_idx
on public.appeals (submission_id);
create index if not exists removal_requests_submission_id_idx
on public.removal_requests (submission_id);

-- Public-safe gallery function. Private owner and original-image fields are
-- never returned.
create or replace function public.get_public_submissions()
returns table (
  id uuid,
  display_image_path text,
  line text,
  display_name text,
  is_anonymous boolean,
  category_name text,
  category_slug text,
  frame_slug text,
  frame_css_class text,
  tags text[],
  orientation text,
  is_photo_of_week boolean,
  is_category_featured boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.display_image_path,
    coalesce(nullif(s.edited_one_line, ''), s.one_line) as line,
    case
      when s.is_anonymous then 'anonymous'
      else coalesce(nullif(s.display_name_snapshot, ''), 'anonymous')
    end as display_name,
    s.is_anonymous,
    c.name as category_name,
    c.slug as category_slug,
    f.slug as frame_slug,
    f.css_class as frame_css_class,
    coalesce(
      array_agg(t.name order by t.name)
        filter (where t.name is not null),
      '{}'::text[]
    ) as tags,
    s.orientation,
    s.is_photo_of_week,
    s.is_category_featured,
    s.created_at
  from public.submissions as s
  join public.categories as c on c.id = s.category_id
  left join public.frames as f on f.id = s.frame_id
  left join public.submission_tags as st on st.submission_id = s.id
  left join public.tags as t on t.id = st.tag_id
  where s.status = 'approved'
  group by
    s.id,
    s.display_image_path,
    s.edited_one_line,
    s.one_line,
    s.display_name_snapshot,
    s.is_anonymous,
    c.name,
    c.slug,
    f.slug,
    f.css_class,
    s.orientation,
    s.is_photo_of_week,
    s.is_category_featured,
    s.created_at
  order by
    s.is_photo_of_week desc,
    s.is_category_featured desc,
    s.created_at desc;
$$;

revoke all on function public.get_public_submissions()
from public, anon, authenticated;
grant execute on function public.get_public_submissions()
to anon, authenticated;

-- Row Level Security.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.frames enable row level security;
alter table public.submissions enable row level security;
alter table public.tags enable row level security;
alter table public.submission_tags enable row level security;
alter table public.admin_edits enable row level security;
alter table public.appeals enable row level security;
alter table public.removal_requests enable row level security;

-- Explicit Data API privileges. RLS still decides which rows are accessible.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.frames, public.tags to anon;
grant all on public.profiles, public.categories, public.frames,
  public.submissions, public.tags, public.submission_tags,
  public.admin_edits, public.appeals, public.removal_requests
to authenticated;

-- Profiles.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_user_profile" on public.profiles;
create policy "profiles_update_own_user_profile"
on public.profiles
for update
to authenticated
using (id = auth.uid() and role = 'user')
with check (id = auth.uid() and role = 'user');

drop policy if exists "profiles_admin_manage" on public.profiles;
create policy "profiles_admin_manage"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Categories.
drop policy if exists "categories_public_read_active" on public.categories;
create policy "categories_public_read_active"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "categories_admin_manage" on public.categories;
create policy "categories_admin_manage"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Frames.
drop policy if exists "frames_public_read_active" on public.frames;
create policy "frames_public_read_active"
on public.frames
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "frames_admin_manage" on public.frames;
create policy "frames_admin_manage"
on public.frames
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Submissions. Public reads must use get_public_submissions().
drop policy if exists "submissions_users_read_own" on public.submissions;
create policy "submissions_users_read_own"
on public.submissions
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "submissions_users_insert_own_pending"
on public.submissions;
create policy "submissions_users_insert_own_pending"
on public.submissions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and edited_one_line is null
  and frame_id is null
  and is_photo_of_week = false
  and is_category_featured = false
  and rejection_reason is null
  and approved_by is null
  and approved_at is null
  and rejected_by is null
  and rejected_at is null
  and removed_by is null
  and removed_at is null
  and exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid()
      and p.accepted_terms = true
  )
  and exists (
    select 1
    from public.categories as c
    where c.id = category_id
      and c.is_active = true
  )
);

drop policy if exists "submissions_admin_manage" on public.submissions;
create policy "submissions_admin_manage"
on public.submissions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Tags are readable publicly. Creation remains admin-only until the custom tag
-- submission RPC and final tag limit are defined.
drop policy if exists "tags_public_read" on public.tags;
create policy "tags_public_read"
on public.tags
for select
to anon, authenticated
using (true);

drop policy if exists "tags_authenticated_insert" on public.tags;
drop policy if exists "tags_admin_manage" on public.tags;
create policy "tags_admin_manage"
on public.tags
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Submission tags.
drop policy if exists "submission_tags_users_read_own"
on public.submission_tags;
create policy "submission_tags_users_read_own"
on public.submission_tags
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.submissions as s
    where s.id = submission_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "submission_tags_users_insert_own_pending"
on public.submission_tags;
create policy "submission_tags_users_insert_own_pending"
on public.submission_tags
for insert
to authenticated
with check (
  exists (
    select 1
    from public.submissions as s
    where s.id = submission_id
      and s.user_id = auth.uid()
      and s.status = 'pending'
  )
);

drop policy if exists "submission_tags_admin_manage"
on public.submission_tags;
create policy "submission_tags_admin_manage"
on public.submission_tags
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin edits are append-only and must identify the current admin.
drop policy if exists "admin_edits_users_read_own_submission_edits"
on public.admin_edits;
create policy "admin_edits_users_read_own_submission_edits"
on public.admin_edits
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.submissions as s
    where s.id = submission_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists "admin_edits_admin_insert" on public.admin_edits;
drop policy if exists "admin_edits_admin_read_all" on public.admin_edits;
create policy "admin_edits_admin_insert"
on public.admin_edits
for insert
to authenticated
with check (
  public.is_admin()
  and admin_id = auth.uid()
);

-- Appeals.
drop policy if exists "appeals_users_read_own" on public.appeals;
create policy "appeals_users_read_own"
on public.appeals
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "appeals_users_insert_once_for_rejected_submission"
on public.appeals;
create policy "appeals_users_insert_once_for_rejected_submission"
on public.appeals
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and admin_response is null
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1
    from public.submissions as s
    where s.id = submission_id
      and s.user_id = auth.uid()
      and s.status = 'rejected'
  )
);

drop policy if exists "appeals_admin_update" on public.appeals;
drop policy if exists "appeals_admin_read_all" on public.appeals;
create policy "appeals_admin_update"
on public.appeals
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Removal requests.
drop policy if exists "removal_requests_users_read_own"
on public.removal_requests;
create policy "removal_requests_users_read_own"
on public.removal_requests
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "removal_requests_users_insert_own"
on public.removal_requests;
create policy "removal_requests_users_insert_own"
on public.removal_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and admin_response is null
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1
    from public.submissions as s
    where s.id = submission_id
      and s.user_id = auth.uid()
      and s.status <> 'removed'
  )
);

drop policy if exists "removal_requests_admin_update"
on public.removal_requests;
drop policy if exists "removal_requests_admin_read_all"
on public.removal_requests;
create policy "removal_requests_admin_update"
on public.removal_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Starter categories. These remain editable by admins.
insert into public.categories (
  name,
  slug,
  description,
  theme_key,
  sort_order
)
values
  (
    'Quiet Moments',
    'quiet-moments',
    'Small calm moments from daily student life.',
    'quiet',
    10
  ),
  (
    'Campus Life',
    'campus-life',
    'Photos from around school, classes, buildings, and routines.',
    'campus',
    20
  ),
  (
    'Library / Studying',
    'library-studying',
    'Studying, books, desks, notes, and academic quiet.',
    'library',
    30
  ),
  (
    'Nature',
    'nature',
    'Trees, sky, rain, snow, flowers, trails, and outdoor details.',
    'nature',
    40
  ),
  (
    'Sunset / Sunrise',
    'sunset-sunrise',
    'Morning and evening light.',
    'sunset',
    50
  ),
  (
    'City at Night',
    'city-at-night',
    'Night streets, lights, transit, and city scenes.',
    'city-night',
    60
  ),
  (
    'Food / Cafe',
    'food-cafe',
    'Coffee, snacks, meals, and cafe moments.',
    'food',
    70
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  theme_key = excluded.theme_key,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Starter frames. These are placeholders until frame design is finalized.
insert into public.frames (
  name,
  slug,
  description,
  orientation,
  css_class,
  sort_order
)
values
  (
    'Soft Paper Frame',
    'soft-paper',
    'A simple soft paper-style frame.',
    'any',
    'frame-soft-paper',
    10
  ),
  (
    'Clean Landscape Frame',
    'clean-landscape',
    'A clean frame for landscape photos.',
    'landscape',
    'frame-clean-landscape',
    20
  ),
  (
    'Clean Portrait Frame',
    'clean-portrait',
    'A clean frame for portrait photos.',
    'portrait',
    'frame-clean-portrait',
    30
  ),
  (
    'Clean Square Frame',
    'clean-square',
    'A clean frame for square photos.',
    'square',
    'frame-clean-square',
    40
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  orientation = excluded.orientation,
  css_class = excluded.css_class,
  sort_order = excluded.sort_order,
  updated_at = now();

commit;
