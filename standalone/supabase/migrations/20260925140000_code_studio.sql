-- Run in the dedicated JustInnovate Supabase project.
create table if not exists public.code_studio_banners (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Banner',
  en jsonb not null default '[]'::jsonb,
  fr jsonb,
  us jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint code_studio_title_length check (char_length(title) between 1 and 200),
  constraint code_studio_en_array check (jsonb_typeof(en) = 'array'),
  constraint code_studio_fr_array check (fr is null or jsonb_typeof(fr) = 'array'),
  constraint code_studio_us_array check (us is null or jsonb_typeof(us) = 'array')
);
create index if not exists code_studio_banners_owner_updated_idx
  on public.code_studio_banners (owner_id, updated_at desc);
alter table public.code_studio_banners enable row level security;
grant select, insert, update, delete on public.code_studio_banners to authenticated;
create policy "Banner owners can read" on public.code_studio_banners
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Banner owners can create" on public.code_studio_banners
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Banner owners can update" on public.code_studio_banners
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Banner owners can delete" on public.code_studio_banners
  for delete to authenticated using ((select auth.uid()) = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('code-studio-images', 'code-studio-images', true, 10485760,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;
-- Each object's first path component must match the authenticated owner's ID.
create policy "Owners upload banner images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'code-studio-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners replace banner images" on storage.objects
  for update to authenticated
  using (bucket_id = 'code-studio-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'code-studio-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Owners delete banner images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'code-studio-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text);
