begin;

create or replace function public.request_submission_appeal(
  p_submission_id uuid,
  p_appeal_text text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  submission public.submissions%rowtype;
  appeal_id uuid;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to appeal a rejection.';
  end if;

  if p_appeal_text is null
    or char_length(trim(p_appeal_text)) not between 1 and 2000
  then
    raise exception 'Appeal text must be between 1 and 2000 characters.';
  end if;

  select *
  into submission
  from public.submissions
  where id = p_submission_id
    and user_id = current_user_id
    and status = 'rejected';

  if not found then
    raise exception 'Only your own rejected submissions can be appealed.';
  end if;

  insert into public.appeals (
    submission_id,
    user_id,
    appeal_text,
    status
  )
  values (
    submission.id,
    current_user_id,
    trim(p_appeal_text),
    'pending'
  )
  returning id into appeal_id;

  return appeal_id;
exception
  when unique_violation then
    raise exception 'This submission has already been appealed.';
end;
$$;

revoke all on function public.request_submission_appeal(uuid, text)
from public, anon;
grant execute on function public.request_submission_appeal(uuid, text)
to authenticated;

create or replace function public.review_appeal(
  p_appeal_id uuid,
  p_decision text,
  p_response text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_user_id uuid := auth.uid();
  appeal public.appeals%rowtype;
  submission public.submissions%rowtype;
  final_status text;
begin
  if admin_user_id is null or not public.is_admin() then
    raise exception 'Only admins can review appeals.';
  end if;

  if p_decision not in ('accept', 'reject') then
    raise exception 'Choose a valid appeal decision.';
  end if;

  if p_response is null
    or char_length(trim(p_response)) not between 1 and 1000
  then
    raise exception 'Appeal responses must be between 1 and 1000 characters.';
  end if;

  select *
  into appeal
  from public.appeals
  where id = p_appeal_id
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Appeal not found or already reviewed.';
  end if;

  select *
  into submission
  from public.submissions
  where id = appeal.submission_id
  for update;

  if not found then
    raise exception 'Related submission not found.';
  end if;

  final_status := case
    when p_decision = 'accept' then 'accepted'
    else 'rejected'
  end;

  update public.appeals
  set
    status = final_status,
    admin_response = trim(p_response),
    reviewed_by = admin_user_id,
    reviewed_at = now()
  where id = appeal.id;

  if p_decision = 'accept' then
    if submission.status <> 'rejected' then
      raise exception 'Only rejected submissions can return to review.';
    end if;

    update public.submissions
    set
      status = 'pending',
      rejection_reason = null,
      rejected_by = null,
      rejected_at = null
    where id = submission.id;

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
      to_jsonb('rejected'::text),
      to_jsonb('pending'::text),
      trim(p_response)
    );
  end if;
end;
$$;

revoke all on function public.review_appeal(uuid, text, text)
from public, anon;
grant execute on function public.review_appeal(uuid, text, text)
to authenticated;

commit;
