import { supabase } from '../lib/supabase';

export const savedListingsService = {

  getSavedListings: async (userId) => {
    const { data, error } = await supabase
      .from('saved_listings')
      .select(`
        id,
        created_at,
        listing:listing_id (
          id,
          title,
          price,
          currency,
          location,
          status,
          images,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten into a usable shape
    return (data ?? []).map((row) => ({
      savedId:    row.id,
      savedAt:    row.created_at,
      id:         row.listing.id,
      title:      row.listing.title,
      price:      row.listing.price,
      currency:   row.listing.currency ?? 'R',
      location:   row.listing.location,
      status:     row.listing.status,
      images:     row.listing.images,
      seller:     row.listing.profiles?.display_name
                  ?? row.listing.profiles?.username
                  ?? 'Unknown',
    }));
  },

  removeSavedListing: async (userId, listingId) => {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);
    if (error) throw error;
  },
};