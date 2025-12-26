import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInAnon: () => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);

        if (!data.session) {
          await supabase.auth.signInAnonymously();
          const { data: newData } = await supabase.auth.getSession();
          if (!mounted) return;
          setSession(newData.session ?? null);
          setUser(newData.session?.user ?? null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    if (!supabase) return;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const api: AuthCtx = useMemo(
    () => ({
      user,
      session,
      loading,
      signInAnon: async () => {
        if (!supabase) throw new Error('Supabase env vars missing');
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      },
      signUpEmail: async (email, password) => {
        if (!supabase) throw new Error('Supabase env vars missing');
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      },
      signInEmail: async (email, password) => {
        if (!supabase) throw new Error('Supabase env vars missing');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signOut: async () => {
        if (!supabase) throw new Error('Supabase env vars missing');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        await supabase.auth.signInAnonymously();
      },
    }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}
