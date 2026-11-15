-- Five demo women for testing Discover, matching and chat before launch.
-- Photos are AI-generated (not real people) and live in supabase/demo/photos.
-- Safe to run more than once.

insert into public.email_exceptions (email, school_id, note)
select 'demo' || n || '@demo.crushwave.invalid', s.id, 'Demo profile for testing. Remove before launch.'
  from generate_series(1, 5) n
 cross join (select id from public.schools where short_name = 'UPSA') s
on conflict (email) do nothing;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                        created_at, updated_at, confirmation_token, recovery_token,
                        email_change_token_new, email_change, email_change_token_current,
                        phone_change, phone_change_token, reauthentication_token)
select '00000000-0000-0000-0000-000000000000',
       ('0000000d-e300-4000-8000-00000000000' || n)::uuid,
       'authenticated', 'authenticated', 'demo' || n || '@demo.crushwave.invalid', '',
       now(), '{"provider":"email","providers":["email"],"demo":true}'::jsonb, '{}'::jsonb,
       now(), now(), '', '', '', '', '', '', '', ''
  from generate_series(1, 5) n
on conflict (id) do nothing;

insert into public.profiles (id, first_name, birthdate, gender, show_me, looking_for, bio,
                             programme, level, hall, interests, prompts, photos,
                             min_age, max_age, is_demo)
select ('0000000d-e300-4000-8000-00000000000' || d.n)::uuid, d.first_name, d.birthdate,
       'woman', '{man,woman,nonbinary}', d.looking_for, d.bio, d.programme, d.level, d.hall,
       d.interests, d.prompts,
       array[('0000000d-e300-4000-8000-00000000000' || d.n) || '/main.jpg'],
       18, 99, true
  from (values
  (1, 'Ama', date '2005-03-14', 'dating'::public.looking_for,
   'Accounting girl who still can''t balance her own MoMo 😅 Love good food and better music. (Demo profile for testing)',
   'BSc Accounting', 300::smallint, 'Off campus',
   array['Afrobeats','Foodie','Movies','Church'],
   '[{"q":"Jollof or waakye, and why…","a":"Waakye with extra shito. No debate."},{"q":"The way to my heart is…","a":"Kelewele and a long walk at Labadi."}]'::jsonb),
  (2, 'Efua', date '2006-07-02', 'friendship'::public.looking_for,
   'Marketing student, part-time content creator, full-time Amapiano dancer. Looking for new friends on campus. (Demo profile for testing)',
   'BSc Marketing', 200::smallint, 'UPSA Hostel',
   array['Amapiano','Dancing','Fashion','Photography'],
   '[{"q":"A perfect Saturday on campus looks like…","a":"Brunch, a photoshoot, then dancing till late."},{"q":"My hidden talent is…","a":"I can learn any TikTok dance in 5 minutes."}]'::jsonb),
  (3, 'Akosua', date '2004-01-21', 'dating'::public.looking_for,
   'IT Management, final year. Into tech, books and long conversations. (Demo profile for testing)',
   'BSc Information Technology Management', 400::smallint, 'Off campus',
   array['Tech','Reading','Podcasts','Business'],
   '[{"q":"I''m looking for someone who…","a":"Can hold a conversation and make me laugh."},{"q":"The song I can''t stop playing…","a":"Anything by Black Sherif."}]'::jsonb),
  (4, 'Lisa', date '2007-05-09', 'study_partner'::public.looking_for,
   'First year in Public Relations. Need a study buddy for stats, will pay in snacks. (Demo profile for testing)',
   'BA Public Relations Management', 100::smallint, 'UPSA Hostel',
   array['Reading','Travel','Art','Volunteering'],
   '[{"q":"After exams, you''ll find me…","a":"At the beach with a good book."}]'::jsonb),
  (5, 'Adjoa', date '2003-10-30', 'dating'::public.looking_for,
   'Banking and Finance. Gym in the morning, series at night. (Demo profile for testing)',
   'BSc Banking and Finance', 400::smallint, 'Off campus',
   array['Gym','Series','Investing','Hiplife'],
   '[{"q":"Two truths and a lie…","a":"I''ve run a half marathon, I hate pizza, I speak 3 languages."}]'::jsonb)
  ) as d(n, first_name, birthdate, looking_for, bio, programme, level, hall, interests, prompts)
on conflict (id) do update
  set first_name = excluded.first_name, bio = excluded.bio, prompts = excluded.prompts,
      interests = excluded.interests, photos = excluded.photos, is_demo = true;
