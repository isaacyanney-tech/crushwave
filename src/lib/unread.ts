import { useCallback, useEffect, useState } from 'react';

import { supabase } from './supabase';

/** Total unread messages across all chats, kept live. Used for the tab badge. */
export function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('get_my_matches');
    const rows = (data ?? []) as { unread: number; last_message: string | null }[];
    // New matches with no messages yet also count, so people notice them.
    setCount(rows.reduce((n, r) => n + (r.unread || 0) + (r.last_message ? 0 : 1), 0));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
    const ch = supabase
      .channel('unread-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [enabled, load]);

  return count;
}
