import { supabase } from '../lib/supabase';
import { uploadMediaToSupabase } from '../services/imageService';

export const createListingService = {

  uploadImages: async (mediaItems, userId) => {
    const urls = [];
    for (const item of mediaItems) {
      const url = await uploadMediaToSupabase(item.url, userId, 'listing-images', item.type);
      urls.push(url);
    }
    return urls;
  },

  createListing: async (payload) => {
    const { data, error } = await supabase.functions.invoke('create_listing', { body: payload });
    if (error) throw error;
    return data;
  },
};