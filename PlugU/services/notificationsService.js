import { supabase } from '../lib/supabase';

const PAGE_SIZE = 20;

export const notificationsService = {

  getNotifications: async ({ page = 1, unreadOnly = false } = {}) => {
    let query = supabase
      .from('notifications')
      .select(`
        id, type, title, body, data,
        is_read, read_at, created_at,
        target_type, target_id,
        actor:actor_id (
          id, username, display_name, avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (unreadOnly) query = query.eq('is_read', false);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  getUnreadCount: async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    if (error) throw error;
    return count ?? 0;
  },

  markAsRead: async (notificationIds) => {
    const { data, error } = await supabase.functions.invoke('mark_notifications_read', {
      body: { notification_ids: notificationIds },
    });
    if (error) throw error;
    return data;
  },

  markAllAsRead: async () => {
    const { data, error } = await supabase.functions.invoke('mark_notifications_read', {
      body: { mark_all: true },
    });
    if (error) throw error;
    return data;
  },

  PAGE_SIZE,
};