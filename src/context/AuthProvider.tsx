import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session, createClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '../supabase';

type AuthContextValue = {
  session: Session | null;
  sessionChecked: boolean;
  userId: string; // 'local' if not logged in
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const supabase = useMemo(createSupabaseClient, []);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setSessionChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSession(sess ?? null);
      setSessionChecked(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const value: AuthContextValue = {
    session,
    sessionChecked,
    userId: session?.user?.id ?? 'local',
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


