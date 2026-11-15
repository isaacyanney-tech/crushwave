-- Helper functions used by the security rules can also be called directly
-- through the API. Make them only answer questions about the signed-in user,
-- so nobody can probe who blocked or matched whom.
-- (Applied to the live project on 2026-11-15.)

create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) in (a, b) and exists (
    select 1 from public.blocks
     where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.can_view_profile(viewer uuid, owner uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select viewer is not null and viewer = (select auth.uid()) and (
    viewer = owner or exists (
      select 1
        from public.profiles v
        join public.profiles o on o.id = owner
       where v.id = viewer
         and v.school_id = o.school_id
         and v.status = 'active'
         and o.status = 'active'
         and not public.is_blocked_pair(viewer, owner)
    )
  );
$$;

create or replace function public.is_active_match_member(p_match uuid, p_user uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_user = (select auth.uid()) and exists (
    select 1 from public.matches m
     where m.id = p_match
       and m.unmatched_at is null
       and p_user in (m.user_a, m.user_b)
  );
$$;

-- The swipe trigger checks blocks for any pair directly.
create or replace function public.swipes_after_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_match uuid;
  v_a uuid := least(new.swiper_id, new.target_id);
  v_b uuid := greatest(new.swiper_id, new.target_id);
  v_name_swiper text;
  v_name_target text;
begin
  if not new.liked then
    return null;
  end if;
  if not exists (select 1 from public.swipes s
                  where s.swiper_id = new.target_id
                    and s.target_id = new.swiper_id
                    and s.liked) then
    return null;
  end if;
  if exists (select 1 from public.blocks b
              where (b.blocker_id = new.swiper_id and b.blocked_id = new.target_id)
                 or (b.blocker_id = new.target_id and b.blocked_id = new.swiper_id)) then
    return null;
  end if;

  insert into public.matches (user_a, user_b)
  values (v_a, v_b)
  on conflict (user_a, user_b) do nothing
  returning id into v_match;

  if v_match is not null then
    select first_name into v_name_swiper from public.profiles where id = new.swiper_id;
    select first_name into v_name_target from public.profiles where id = new.target_id;
    perform public.send_push(new.target_id, 'It''s a match!',
      'You and ' || v_name_swiper || ' liked each other', jsonb_build_object('match_id', v_match));
    perform public.send_push(new.swiper_id, 'It''s a match!',
      'You and ' || v_name_target || ' liked each other', jsonb_build_object('match_id', v_match));
  end if;
  return null;
end;
$$;
