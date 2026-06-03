import { supabase } from '../lib/supabase';

export const profileService = {

  getStats: async (userId) => {
    const { data, error } = await supabase
      .rpc('get_user_profile_with_stats', { p_user_id: userId });
    if (error) throw error;
    return data?.[0] ?? null;
  },

  getListings: async (userId) => {
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, price, location, images, category, status, view_count, like_count')
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  getFollowers: async (userId) => {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, profiles:follower_id (id, username, display_name, avatar_url)')
      .eq('following_id', userId);
    if (error) throw error;
    return (data ?? []).map((r) => r.profiles);
  },

  getFollowing: async (userId) => {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id, profiles:following_id (id, username, display_name, avatar_url)')
      .eq('follower_id', userId);
    if (error) throw error;
    return (data ?? []).map((r) => r.profiles);
  },

  deleteListing: async (listingId) => {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);
    if (error) throw error;
  },

  updateListingStatus: async (listingId, status) => {
    const { error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', listingId);
    if (error) throw error;
  },
};