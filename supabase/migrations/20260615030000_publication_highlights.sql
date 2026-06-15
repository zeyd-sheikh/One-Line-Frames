begin;

with ranked_weekly_photos as (
  select
    id,
    row_number() over (
      order by approved_at desc nulls last, created_at desc
    ) as weekly_rank
  from public.submissions
  where is_photo_of_week = true
)
update public.submissions as submissions
set is_photo_of_week = false
from ranked_weekly_photos
where submissions.id = ranked_weekly_photos.id
  and ranked_weekly_photos.weekly_rank > 1;

create unique index if not exists submissions_single_photo_of_week_idx
on public.submissions (is_photo_of_week)
where is_photo_of_week = true;

create or replace function public.set_submission_highlight(
  p_submission_id uuid,
  p_highlight text,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_user_id uuid := auth.uid();
  submission public.submissions%rowtype;
  previous_week public.submissions%rowtype;
  old_value boolean;
  changed_field_name text;
  audit_reason text;
begin
  if admin_user_id is null or not public.is_admin() then
    raise exception 'Only admins can manage publication highlights.';
  end if;

  if p_highlight not in ('featured', 'photo_of_week') then
    raise exception 'Choose a valid publication highlight.';
  end if;

  if p_highlight = 'photo_of_week' then
    perform pg_advisory_xact_lock(
      hashtextextended('one-line-frames-photo-of-week', 0)
    );
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
    raise exception 'Only published submissions can be highlighted.';
  end if;

  if p_highlight = 'featured' then
    old_value := submission.is_category_featured;
    changed_field_name := 'is_category_featured';
    audit_reason := case
      when p_enabled then 'Added to featured moments.'
      else 'Removed from featured moments.'
    end;

    if old_value = p_enabled then
      return;
    end if;

    update public.submissions
    set is_category_featured = p_enabled
    where id = submission.id;
  else
    old_value := submission.is_photo_of_week;
    changed_field_name := 'is_photo_of_week';
    audit_reason := case
      when p_enabled then 'Selected as photo of the week.'
      else 'Cleared as photo of the week.'
    end;

    if p_enabled then
      select *
      into previous_week
      from public.submissions
      where is_photo_of_week = true
        and id <> submission.id
      for update;

      if found then
        update public.submissions
        set is_photo_of_week = false
        where id = previous_week.id;

        insert into public.admin_edits (
          submission_id,
          admin_id,
          changed_field,
          old_value,
          new_value,
          reason
        )
        values (
          previous_week.id,
          admin_user_id,
          'is_photo_of_week',
          to_jsonb(true),
          to_jsonb(false),
          'Replaced by a newly selected photo of the week.'
        );
      end if;
    end if;

    if old_value = p_enabled then
      return;
    end if;

    update public.submissions
    set is_photo_of_week = p_enabled
    where id = submission.id;
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
    changed_field_name,
    to_jsonb(old_value),
    to_jsonb(p_enabled),
    audit_reason
  );
end;
$$;

revoke all on function public.set_submission_highlight(uuid, text, boolean)
from public, anon, authenticated;

grant execute on function public.set_submission_highlight(uuid, text, boolean)
to authenticated;

commit;
