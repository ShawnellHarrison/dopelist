import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useExpiringPosts() {
  const [expiringCount, setExpiringCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExpiringPosts();
    const interval = setInterval(checkExpiringPosts, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkExpiringPosts = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setExpiringCount(0);
        setLoading(false);
        return;
      }

      const now = new Date();
      const twoDaysFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('posts')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', now.toISOString())
        .lt('expires_at', twoDaysFromNow.toISOString());

      if (error) throw error;
      setExpiringCount(data?.length || 0);
    } catch (err) {
      console.error('Error checking expiring posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return { expiringCount, loading };
}
