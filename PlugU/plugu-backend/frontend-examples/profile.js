// PlugU - Profile Module (React Native / Expo)
import { supabase } from './auth';

// Get user profile with stats
export async function getUserProfile(userId) {
  const { data, error } = await supabase.rpc('get_user_profile_with_stats', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data?.[0];
}

// Update profile
export async function updateProfile(updates) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Follow/unfollow user
export async function followUser(userId, action = 'follow') {
  const currentUser = (await supabase.auth.getUser()).data.user;
  if (!currentUser) throw new Error('Not authenticated');

  if (action === 'unfollow') {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('following_id', userId);

    if (error) throw error;
    return { success: true };
  }

  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: currentUser.id, following_id: userId })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { success: true, message: 'Already following' };
    throw error;
  }

  // Create notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'follow',
    title: 'New Follower',
    body: 'Someone started following you',
    actor_id: currentUser.id,
  });

  return data;
}

// Get nearby users
export async function getNearbyUsers(latitude, longitude, radiusKm = 10, limit = 20) {
  const { data, error } = await supabase.rpc('get_nearby_users', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_km: radiusKm,
    p_limit: limit,
  });

  if (error) throw error;
  return data;
}

// Track profile view
export async function trackProfileView(viewedId) {
  const { data, error } = await supabase.functions.invoke('track_profile_view', {
    body: { viewed_id: viewedId },
  });

  if (error) throw error;
  return data;
}

// Upload avatar
export async function uploadAvatar(fileUri, fileName) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const filePath = `${user.id}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, { uri: fileUri }, { contentType: 'image/jpeg' });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

  // Update profile
  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

  return publicUrl;
}
