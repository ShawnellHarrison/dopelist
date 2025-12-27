import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAnonymous: boolean;
  signInAnon: () => Promise<void>;
  signInMagicLink: (email: string) => Promise<void>;
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

  const isAnonymous = user?.is_anonymous ?? false;

  useEffect(() => {
    let mounted = true;
    let previousUserId: string | null = null;

    async function init() {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data.session) {
          previousUserId = data.session.user.id;
          setSession(data.session);
          setUser(data.session.user);
        } else {
          const { data: anonData } = await supabase.auth.signInAnonymously();
          if (!mounted) return;
          if (anonData.session) {
            previousUserId = anonData.session.user.id;
            setSession(anonData.session);
            setUser(anonData.session.user);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    if (!supabase) return;

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      (async () => {
        if (event === 'SIGNED_OUT') {
          const { data: anonData } = await supabase.auth.signInAnonymously();
          if (!mounted) return;
          if (anonData.session) {
            previousUserId = anonData.session.user.id;
            setSession(anonData.session);
            setUser(anonData.session.user);
          }
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && newSession?.user && !newSession.user.is_anonymous) {
          const newUserId = newSession.user.id;

          if (previousUserId && previousUserId !== newUserId) {
            try {
              const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/merge-anonymous-account`;
              await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${newSession.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  anonymousUserId: previousUserId,
                  authenticatedUserId: newUserId
                }),
              });
            } catch (e) {
              console.error('Failed to merge anonymous account:', e);
            }
          }
          previousUserId = newUserId;
        }

        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          previousUserId = newSession.user.id;
        } else {
          setSession(null);
          setUser(null);
          previousUserId = null;
        }
        setLoading(false);
      })();
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
      isAnonymous,
      signInAnon: async () => {
        if (!supabase) throw new Error('Supabase env vars missing');
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      },
      signInMagicLink: async (email) => {
        if (!supabase) throw new Error('Supabase env vars missing');
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
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
      },
    }),
    [user, session, loading, isAnonymous]
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}
