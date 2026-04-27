// PlugU - Notifications Module (React Native / Expo)
import { supabase } from './auth';

// Fetch notifications
export async function fetchNotifications(limit = 20, offset = 0, unreadOnly = false) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const { data, error } = await supabase.rpc('get_user_notifications', {
    p_user_id: user.id,
    p_limit: limit,
    p_offset: offset,
    p_unread_only: unreadOnly,
  });

  if (error) throw error;
  return data;
}

// Mark notifications as read
export async function markNotificationsRead(notificationIds = [], markAll = false) {
  const { data, error } = await supabase.functions.invoke('mark_notifications_read', {
    body: { notification_ids: notificationIds, mark_all: markAll },
  });

  if (error) throw error;
  return data;
}

// Get unread count
export async function getUnreadNotificationCount() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

// Subscribe to notifications
export function subscribeToNotifications(callback) {
  const user = supabase.auth.getUser();

  return supabase
    .channel('public:notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, callback)
    .subscribe();
}
