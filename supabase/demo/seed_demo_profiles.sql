-- Demo profiles for testing Discover, matching and chat before launch:
-- 9 men and 10 women. Liking one matches straight away and they send the
-- first message (see migration 20261115000004_demo_profiles.sql).
-- Photos are AI-generated (not real people) and live in supabase/demo/photos
-- (manN.jpg / womanN.jpg). They are uploaded to storage at <id>/main.jpg.
-- Ids: men 0000000d-e300-4000-8000-0000000001NN, women ...-0000000002NN.
-- Safe to run more than once. Remove before launch with remove_demo_profiles.sql.

create temporary table demo_seed (
  sex text, n int, first_name text, birthdate date, looking_for public.looking_for,
  bio text, programme text, level smallint, hall text, interests text[], prompts jsonb
);

insert into demo_seed values
-- Men
('m', 1, 'Kwame', '2004-02-11', 'dating', 'Guitar on the weekends, Business Admin on the weekdays. I''ll learn your favourite song if you ask nicely.',
 'BSc Business Administration', 300, 'Off campus', array['Afrobeats','Gospel','Karaoke','Reading'],
 '[{"q":"The song I can’t stop playing…","a":"Kuami Eugene, but on my own guitar."},{"q":"The way to my heart is…","a":"Sit with me while I play and sing along off-key."}]'),
('m', 2, 'Yaw', '2003-08-27', 'friendship', 'Weekend hikes to Aburi and Shai Hills. Looking for people who don''t mind an early start.',
 'BSc Logistics and Transport', 400, 'Off campus', array['Travel','Football','Photography','Podcasts'],
 '[{"q":"After exams, you’ll find me…","a":"Halfway up a hill with too little water."},{"q":"A perfect Saturday on campus looks like…","a":"Leave campus at 5am, back by sunset."}]'),
('m', 3, 'Kofi', '2004-11-03', 'dating', 'Accounting, coffee, and people-watching in Osu. Ask me about my café rankings.',
 'BSc Accounting', 300, 'UPSA Hostel', array['Foodie','Business','Investing','Movies'],
 '[{"q":"My go-to Osu spot is…","a":"A quiet café on Oxford Street. I''ll show you."},{"q":"I’m looking for someone who…","a":"Has opinions about food and isn''t shy to share them."}]'),
('m', 4, 'Nii', '2005-05-19', 'dating', 'Born and raised in Teshie, so the beach is basically home. I laugh at my own jokes.',
 'BA Communication Studies', 200, 'Off campus', array['Beach','Amapiano','Football','Dancing'],
 '[{"q":"Jollof or waakye, and why…","a":"Waakye. Early morning, from the corner auntie."},{"q":"My hidden talent is…","a":"I can tell you the tide times without checking."}]'),
('m', 5, 'Abdul', '2003-12-08', 'study_partner', 'From Tamale, studying Banking and Finance. Happy to help with maths if you help me stay awake.',
 'BSc Banking and Finance', 400, 'UPSA Hostel', array['Mosque','Investing','Debate','Football'],
 '[{"q":"Best lecturer story…","a":"Got called out for answering a question before it was asked."},{"q":"I’m looking for someone who…","a":"Wants a serious study partner for final year."}]'),
('m', 6, 'Kojo', '2005-01-24', 'friendship', 'Dog person. If you meet me, you''ll probably meet Bruno too.',
 'BSc Information Technology Management', 200, 'Off campus', array['Tech','Gaming','Photography','Volunteering'],
 '[{"q":"Two truths and a lie…","a":"My dog has more followers than me, I build apps, I hate kelewele."}]'),
('m', 7, 'Kwabena', '2004-06-30', 'dating', 'Rooftops, sunsets and good conversation. Marketing student with too many ideas.',
 'BSc Marketing', 300, 'Off campus', array['Afrobeats','Fashion','Business','Travel'],
 '[{"q":"The way to my heart is…","a":"A sunset and an honest conversation."},{"q":"My go-to Osu spot is…","a":"Any rooftop with a view of the city."}]'),
('m', 8, 'Fiifi', '2005-09-14', 'dating', 'I cook better than your mum (don''t tell her). Public Relations, from Cape Coast.',
 'BA Public Relations Management', 200, 'UPSA Hostel', array['Cooking','Foodie','Hiplife','Series'],
 '[{"q":"Jollof or waakye, and why…","a":"Jollof, and I''ll cook it for you to prove it."},{"q":"My hidden talent is…","a":"Fante kenkey and fried fish, done right."}]'),
('m', 9, 'Selorm', '2003-04-02', 'dating', 'Law student. Calm, a bit of a homebody, but I''ll always say yes to a good party.',
 'LLB Law', 400, 'Off campus', array['Reading','Church','Movies','Debate'],
 '[{"q":"I’m looking for someone who…","a":"Is kind, ambitious, and can make me laugh."},{"q":"A perfect Saturday on campus looks like…","a":"Library in the morning, friends and food at night."}]'),
-- Women
('w', 1, 'Ama', '2005-03-14', 'dating', 'Makola market expert. I know where to get the best fabric and the best price.',
 'BSc Accounting', 300, 'Off campus', array['Fashion','Foodie','Afrobeats','Church'],
 '[{"q":"The way to my heart is…","a":"Kelewele and a walk through the market."},{"q":"Jollof or waakye, and why…","a":"Waakye with extra shito. No debate."}]'),
('w', 2, 'Efua', '2004-07-02', 'friendship', 'Beach girl from Cape Coast. Always laughing, usually at myself.',
 'BA Communication Studies', 400, 'Off campus', array['Beach','Dancing','Amapiano','Travel'],
 '[{"q":"After exams, you’ll find me…","a":"Feet in the sand at Labadi."},{"q":"My hidden talent is…","a":"I can learn any dance in 5 minutes."}]'),
('w', 3, 'Akosua', '2004-01-21', 'dating', 'Kente lover, plant mum, final year IT Management. Long conversations please.',
 'BSc Information Technology Management', 400, 'Off campus', array['Tech','Fashion','Podcasts','Art'],
 '[{"q":"I’m looking for someone who…","a":"Can hold a conversation and make me laugh."},{"q":"The song I can’t stop playing…","a":"Anything by Black Sherif."}]'),
('w', 4, 'Esi', '2005-10-05', 'study_partner', 'Café regular, coffee addict, Banking and Finance. Let''s revise together and share a pastry.',
 'BSc Banking and Finance', 300, 'UPSA Hostel', array['Reading','Investing','Foodie','Series'],
 '[{"q":"My go-to Osu spot is…","a":"The café with the big window seat."},{"q":"I’m looking for someone who…","a":"Wants to actually study, not just chat. Okay, chat a little."}]'),
('w', 5, 'Adwoa', '2003-10-30', 'friendship', 'You''ll find me in a bookstore or talking about the last book I read.',
 'BA Public Relations Management', 400, 'Off campus', array['Reading','Writing','Podcasts','Volunteering'],
 '[{"q":"Two truths and a lie…","a":"I read 50 books this year, I write poetry, I don''t like jollof."}]'),
('w', 6, 'Abena', '2006-02-17', 'dating', 'Sunshine, yellow dresses and picnics. Marketing student who loves a good playlist.',
 'BSc Marketing', 200, 'UPSA Hostel', array['Afrobeats','Photography','Movies','Beach'],
 '[{"q":"A perfect Saturday on campus looks like…","a":"A picnic on the grass with good music."},{"q":"The way to my heart is…","a":"Make me a playlist."}]'),
('w', 7, 'Yaa', '2004-09-09', 'dating', 'Rooftop sunsets and big laughs. Business Admin, future CEO.',
 'BSc Business Administration', 300, 'Off campus', array['Business','Fashion','Travel','Amapiano'],
 '[{"q":"I’m looking for someone who…","a":"Has big dreams and isn''t scared of mine."},{"q":"My go-to Osu spot is…","a":"Any rooftop for sunset."}]'),
('w', 8, 'Dzifa', '2003-06-12', 'friendship', 'Art gallery weekends. I sketch everyone I meet, so watch out.',
 'BA Communication Studies', 400, 'Off campus', array['Art','Photography','Writing','Gospel'],
 '[{"q":"My hidden talent is…","a":"I can draw you in under 2 minutes."},{"q":"After exams, you’ll find me…","a":"At a gallery opening in Osu."}]'),
('w', 9, 'Akua', '2005-12-01', 'dating', 'Jamestown street art and denim jackets. Law student with a soft spot for Hiplife.',
 'LLB Law', 200, 'UPSA Hostel', array['Hiplife','Art','Debate','Football'],
 '[{"q":"Best lecturer story…","a":"Debated my lecturer and won. Still talking about it."},{"q":"Jollof or waakye, and why…","a":"Jollof. Ghana jollof, obviously."}]'),
('w', 10, 'Afua', '2004-04-26', 'dating', 'My jollof will make you forget your ex. Logistics student who lives in the kitchen.',
 'BSc Logistics and Transport', 300, 'Off campus', array['Cooking','Foodie','Church','Series'],
 '[{"q":"The way to my heart is…","a":"Eat my food and say it''s the best you''ve had."},{"q":"Jollof or waakye, and why…","a":"Jollof, and I''ll cook it to prove it."}]');

create temporary view demo_ids as
select *, ('0000000d-e300-4000-8000-000000000' || case sex when 'm' then '1' else '2' end
           || lpad(n::text, 2, '0'))::uuid as id,
       'demo-' || sex || n || '@demo.crushwave.invalid' as email
  from demo_seed;

insert into public.email_exceptions (email, school_id, note)
select d.email, s.id, 'Demo profile for testing. Remove before launch.'
  from demo_ids d cross join (select id from public.schools where short_name = 'UPSA') s
on conflict (email) do nothing;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                        created_at, updated_at, confirmation_token, recovery_token,
                        email_change_token_new, email_change, email_change_token_current,
                        phone_change, phone_change_token, reauthentication_token)
select '00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated', d.email, '',
       now(), '{"provider":"email","providers":["email"],"demo":true}'::jsonb, '{}'::jsonb,
       now(), now(), '', '', '', '', '', '', '', ''
  from demo_ids d
on conflict (id) do nothing;

insert into public.profiles (id, first_name, birthdate, gender, show_me, looking_for, bio,
                             programme, level, hall, interests, prompts, photos,
                             min_age, max_age, is_demo)
select d.id, d.first_name, d.birthdate,
       case d.sex when 'm' then 'man' else 'woman' end::public.gender,
       '{man,woman,nonbinary}', d.looking_for, d.bio || ' (Demo profile for testing)',
       d.programme, d.level, d.hall, d.interests, d.prompts,
       array[d.id::text || '/main.jpg'], 18, 99, true
  from demo_ids d
on conflict (id) do update
  set first_name = excluded.first_name, bio = excluded.bio, prompts = excluded.prompts,
      interests = excluded.interests, photos = excluded.photos, is_demo = true;

