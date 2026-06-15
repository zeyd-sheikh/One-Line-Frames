-- Repair hosted projects where the buckets were created manually before the
-- submission workflow migration was applied.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
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
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
    from public.submissions
    where original_image_path = name
  )
);
