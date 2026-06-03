import { supabase } from '../lib/supabase';

export const userProfileService = {

  getProfile: async (userId) => {
    const { data, error } = await supabase
      .rpc('get_user_profile_with_stats', { p_user_id: userId });
    if (error) throw error;
    return data?.[0] ?? null;
  },

  getListings: async (userId) => {
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, price, location, images, category, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  trackProfileView: async (viewedUserId) => {
    const { error } = await supabase.functions.invoke('track_profile_view', {
      body: { viewed_id: viewedUserId }, 
    });
    if (error) console.warn('[trackProfileView] failed silently:', error.message);
  },
  
  follow: async (followerId, followingId) => {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  },

  unfollow: async (followerId, followingId) => {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw error;
  },
};