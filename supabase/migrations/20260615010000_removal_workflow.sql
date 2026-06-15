-- One Line Frames
-- User removal requests and admin publication removal workflow

begin;

-- Removal requests are created through the validated RPC below so clients
-- cannot bypass the published-owner and one-pending-request checks.
drop policy if exists "removal_requests_users_insert_own"
on public.removal_requests;

create or replace function public.request_submission_removal(
  p_submission_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  request_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;

  if char_length(trim(coalesce(p_reason, ''))) not between 1 and 2000 then
    raise exception 'Provide a removal reason between 1 and 2000 characters.';
  end if;

  if not exists (
    select 1
    from public.submissions
    where id = p_submission_id
      and user_id = current_user_id
      and status = 'approved'
  ) then
    raise exception 'Only your published submissions can be removed.';
  end if;

  if exists (
    select 1
    from public.removal_requests
    where submission_id = p_submission_id
      and status = 'pending'
  ) then
    raise exception 'A removal request is already pending for this submission.';
  end if;

  insert into public.removal_requests (
    submission_id,
    user_id,
    reason
  )
  values (
    p_submission_id,
    current_user_id,
    trim(p_reason)
  )
  returning id into request_id;

  return request_id;
end;
$$;

revoke all on function public.request_submission_removal(uuid, text)
from public, anon;
grant execute on function public.request_submission_removal(uuid, text)
to authenticated;

create or replace function public.review_removal_request(
  p_request_id uuid,
  p_decision text,
  p_response text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_user_id uuid := auth.uid();
  removal_request public.removal_requests%rowtype;
  submission public.submissions%rowtype;
begin
  if admin_user_id is null or not public.is_admin() then
    raise exception 'Admin access is required.';
  end if;

  if p_decision not in ('accept', 'reject') then
    raise exception 'Choose accept or reject.';
  end if;

  if char_length(trim(coalesce(p_response, ''))) not between 1 and 1000 then
    raise exception 'Provide an admin response between 1 and 1000 characters.';
  end if;

  select *
  into removal_request
  from public.removal_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Removal request not found.';
  end if;

  if removal_request.status <> 'pending' then
    raise exception 'This removal request is no longer pending.';
  end if;

  select *
  into submission
  from public.submissions
  where id = removal_request.submission_id
  for update;

  if not found then
    raise exception 'The related submission could not be found.';
  end if;

  update public.removal_requests
  set
    status = case when p_decision = 'accept' then 'accepted' else 'rejected' end,
    admin_response = trim(p_response),
    reviewed_by = admin_user_id,
    reviewed_at = now()
  where id = p_request_id;

  if p_decision = 'accept' then
    if submission.status <> 'approved' then
      raise exception 'Only a currently published submission can be removed.';
    end if;

    insert into public.admin_edits (
      submission_id,
      admin_id,
      changed_field,
      old_value,
      new_value,
      reason
    )
    values (
      submission.id,
      admin_user_id,
      'status',
      to_jsonb(submission.status),
      to_jsonb('removed'::text),
      trim(p_response)
    );

    update public.submissions
    set
      status = 'removed',
      is_photo_of_week = false,
      is_category_featured = false,
      removed_by = admin_user_id,
      removed_at = now()
    where id = submission.id;

    return submission.display_image_path;
  end if;

  return null;
end;
$$;

revoke all on function public.review_removal_request(uuid, text, text)
from public, anon;
grant execute on function public.review_removal_request(uuid, text, text)
to authenticated;

create or replace function public.remove_published_submission(
  p_submission_id uuid,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_user_id uuid := auth.uid();
  submission public.submissions%rowtype;
begin
  if admin_user_id is null or not public.is_admin() then
    raise exception 'Admin access is required.';
  end if;

  if char_length(trim(coalesce(p_reason, ''))) not between 1 and 1000 then
    raise exception 'Provide a removal reason between 1 and 1000 characters.';
  end if;

  select *
  into submission
  from public.submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Submission not found.';
  end if;

  if submission.status <> 'approved' then
    raise exception 'Only a currently published submission can be removed.';
  end if;

  insert into public.admin_edits (
    submission_id,
    admin_id,
    changed_field,
    old_value,
    new_value,
    reason
  )
  values (
    submission.id,
    admin_user_id,
    'status',
    to_jsonb(submission.status),
    to_jsonb('removed'::text),
    trim(p_reason)
  );

  update public.submissions
  set
    status = 'removed',
    is_photo_of_week = false,
    is_category_featured = false,
    removed_by = admin_user_id,
    removed_at = now()
  where id = submission.id;

  update public.removal_requests
  set
    status = 'accepted',
    admin_response = trim(p_reason),
    reviewed_by = admin_user_id,
    reviewed_at = now()
  where submission_id = submission.id
    and status = 'pending';

  return submission.display_image_path;
end;
$$;

revoke all on function public.remove_published_submission(uuid, text)
from public, anon;
grant execute on function public.remove_published_submission(uuid, text)
to authenticated;

commit;
