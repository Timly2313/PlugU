import { supabase } from '../lib/supabase';
import { uploadMediaToSupabase } from '../services/imageService';

export const editListingService = {

  /**
   * Fetch an existing listing by ID.
   */
  fetchListing: async (listingId) => {
    const { data, error } = await supabase.functions.invoke('get_listing', {
      body: { id: listingId },
    });
    if (error) throw error;
    return data?.listing ?? data;
  },

  /**
   * Upload only the NEW local images (those without an http/https URL already).
   * Already-uploaded images are returned as-is.
   */
  uploadNewImages: async (mediaItems, userId) => {
    const urls = [];
    for (const item of mediaItems) {
      if (item.url.startsWith('http')) {
        // Already a remote URL – keep it
        urls.push(item.url);
      } else {
        const url = await uploadMediaToSupabase(
          item.url,
          userId,
          'listing-images',
          item.type,
        );
        urls.push(url);
      }
    }
    return urls;
  },

  /**
   * Persist the updated listing via Supabase Edge Function.
   */
  updateListing: async (listingId, payload) => {
    const { data, error } = await supabase.functions.invoke('update_listing', {
      body: { id: listingId, ...payload },
    });
    if (error) throw error;
    return data;
  },
};