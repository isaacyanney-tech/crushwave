-- Run this in the Supabase SQL Editor before launch to remove every demo profile,
-- including their matches, messages and photos.
delete from storage.objects where bucket_id = 'photos' and name like '0000000d-e300-4000-8000-%';
delete from auth.users where id in (select id from public.profiles where is_demo);
delete from public.email_exceptions where email like '%@demo.crushwave.invalid';
