import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadingTimer = window.setTimeout(() => {
      if (mounted) {
        setAuthError('The classroom session took too long to load. Sign in again, or check your Supabase environment variables in Netlify.');
        setLoading(false);
      }
    }, 8000);

    async function load() {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          6000,
          'Supabase session check timed out.',
        );
        if (error) throw error;
        if (!mounted) return;
        setSession(data.session);
        if (data.session?.user) {
          await loadProfile(data.session.user.id);
        }
      } catch (error) {
        if (mounted) {
          setAuthError(error.message || 'Could not load your classroom session.');
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
        window.clearTimeout(loadingTimer);
      }
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        setAuthError('');
        setSession(nextSession);
        if (nextSession?.user) {
          await loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        setAuthError(error.message || 'Could not load your classroom profile.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(loadingTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId = session?.user?.id) {
    if (!userId) return null;
    const { data, error } = await withTimeout(
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      6000,
      'Supabase profile lookup timed out.',
    );
    if (error) throw error;
    setProfile(data);
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setAuthError('');
  }

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, profile, loading, authError, loadProfile, signOut }),
    [session, profile, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}
