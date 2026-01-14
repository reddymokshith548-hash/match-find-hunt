import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearSupabaseAuthStorage() {
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      // supabase-js stores session in a key like: sb-<project-ref>-auth-token
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const initializedRef = useRef(false);

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    setUser(next?.user ?? null);
  }, []);

  const signOut = useCallback(async () => {
    // Clear local state first (so UI reacts immediately)
    applySession(null);

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Only clear Supabase auth token storage (don’t wipe the whole app storage)
    clearSupabaseAuthStorage();

    // Clear transient UI state
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;

    // Listen for auth changes (after initialization)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      // Avoid rendering protected screens from a stale INITIAL_SESSION before we validate it.
      if (!initializedRef.current && event === 'INITIAL_SESSION') return;

      // If we ever get an invalid token later, Supabase will usually emit SIGNED_OUT.
      if (cancelled) return;
      applySession(nextSession);
      setLoading(false);
    });

    (async () => {
      // 1) Load whatever is in storage
      const { data: { session: storedSession }, error: sessionError } = await supabase.auth.getSession();

      if (cancelled) return;

      if (sessionError || !storedSession) {
        applySession(null);
        initializedRef.current = true;
        setLoading(false);
        return;
      }

      // 2) Validate session against Supabase (prevents 401 spam when token is stale)
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !userData?.user) {
        await supabase.auth.signOut();
        clearSupabaseAuthStorage();
        applySession(null);
      } else {
        applySession(storedSession);
      }

      initializedRef.current = true;
      setLoading(false);
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applySession]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
