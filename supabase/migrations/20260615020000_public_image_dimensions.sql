begin;

drop function if exists public.get_public_submissions();

create function public.get_public_submissions()
returns table (
  id uuid,
  display_image_path text,
  image_width integer,
  image_height integer,
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
    s.image_width,
    s.image_height,
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
    s.image_width,
    s.image_height,
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

commit;
