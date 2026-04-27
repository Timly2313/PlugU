// PlugU - Listings Module (React Native / Expo)
import { supabase } from './auth';

// Create a listing
export async function createListing(listingData) {
  const { data, error } = await supabase.functions.invoke('create_listing', {
    body: listingData,
  });

  if (error) throw error;
  return data;
}

// Search listings
export async function searchListings(params = {}) {
  const { data, error } = await supabase.functions.invoke('search_listings', {
    body: params,
  });

  if (error) throw error;
  return data;
}

// Get nearby listings
export async function getNearbyListings(latitude, longitude, radiusKm = 10, limit = 20) {
  const { data, error } = await supabase.rpc('get_nearby_listings', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_km: radiusKm,
    p_limit: limit,
  });

  if (error) throw error;
  return data;
}

// Get user's listings
export async function getUserListings(userId, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

// Track listing view
export async function trackListingView(listingId) {
  const { data, error } = await supabase.functions.invoke('track_listing_view', {
    body: { listing_id: listingId },
  });

  if (error) throw error;
  return data;
}

// Get listing reviews
export async function getListingReviews(listingId, limit = 20, offset = 0) {
  const { data, error } = await supabase.rpc('get_listing_reviews', {
    p_listing_id: listingId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;
  return data;
}

// Create review
export async function createReview(reviewData) {
  const { data, error } = await supabase.functions.invoke('review_listing', {
    body: reviewData,
  });

  if (error) throw error;
  return data;
}

// Subscribe to new listings
export function subscribeToListings(callback) {
  return supabase
    .channel('public:listings')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, callback)
    .subscribe();
}
