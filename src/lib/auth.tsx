import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Gender, LookingFor } from './constants';
import { supabase } from './supabase';

export type Prompt = { q: string; a: string };

export type MyProfile = {
  id: string;
  school_id: string;
  first_name: string;
  birthdate: string;
  gender: Gender;
  show_me: Gender[];
  looking_for: LookingFor;
  bio: string;
  programme: string | null;
  level: number | null;
  hall: string | null;
  interests: string[];
  prompts: Prompt[];
  photos: string[];
  min_age: number;
  max_age: number;
  is_paused: boolean;
  hide_from_my_programme: boolean;
  hide_from_my_level: boolean;
  is_verified: boolean;
  status: 'active' | 'suspended' | 'banned';
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  profile: MyProfile | null;
  schoolName: string | null;
  refreshProfile: () => Promise<MyProfile | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<MyProfile>();
    setProfile(data ?? null);
    if (data) {
      const { data: school } = await supabase
        .from('schools')
        .select('short_name')
        .eq('id', data.school_id)
        .maybeSingle<{ short_name: string }>();
      setSchoolName(school?.short_name ?? null);
      // Light "last seen" signal used to sort the swipe deck.
      supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId)
        .then(() => undefined);
    }
    return data ?? null;
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (mounted) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Defer so we never call Supabase inside the auth callback itself.
        setTimeout(() => {
          loadProfile(next?.user.id);
        }, 0);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      profile,
      schoolName,
      refreshProfile: () => loadProfile(session?.user.id),
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
    }),
    [loading, session, profile, schoolName, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
