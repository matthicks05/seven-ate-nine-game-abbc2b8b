import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const awardPoints = async (points: number = 1) => {
    if (!user) return { error: new Error('User not authenticated') };
    
    const { error } = await supabase.rpc('award_points', {
      p_user_id: user.id,
      p_points: points
    });
    
    return { error };
  };

  const recordGamePlayed = async () => {
    if (!user) return { error: new Error('User not authenticated') };
    
    const { error } = await supabase.rpc('record_game_played', {
      p_user_id: user.id
    });
    
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    awardPoints,
    recordGamePlayed
  };
};