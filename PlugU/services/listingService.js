import { supabase } from '../lib/supabase';

const cleanId = (id) => (id ? String(id).trim() : null);

export const listingService = {

  getListingById: async (listingId, userId = null) => {
    const { data, error } = await supabase.rpc('get_listing_by_id', {
      p_listing_id: cleanId(listingId),
      p_user_id:    userId ?? null,
    });
    if (error) throw error;
    if (!data || data.length === 0) return null;

    const raw = data[0];
    return {
      id:                raw.r_id,
      user_id:           raw.r_user_id,
      title:             raw.r_title,
      description:       raw.r_description,
      price:             raw.r_price,
      currency:          raw.r_currency,
      category:          raw.r_category,
      condition:         raw.r_condition,
      images:            raw.r_images,
      location:          raw.r_location,
      status:            raw.r_status,
      view_count:        raw.r_view_count,
      like_count:        raw.r_like_count,
      inquiry_count:     raw.r_inquiry_count,
      created_at:        raw.r_created_at,
      seller_id:         raw.r_seller_id,
      seller_username:   raw.r_seller_username,
      seller_avatar_url: raw.r_seller_avatar_url,
      seller_created_at: raw.r_seller_created_at,
      is_saved:          raw.r_is_saved ?? false,  // ← from RPC
    };
  },

  checkSaved: async (userId, listingId) => {
    const id = cleanId(listingId);
    if (!userId || !id) return false;

    const { data, error } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', id)
      .maybeSingle();

    if (error) {
      console.error('[checkSaved] error:', error);
      return false;
    }
    return !!data;
  },

  saveListing: async (userId, listingId) => {
    const id = cleanId(listingId);

    const { error } = await supabase
      .from('saved_listings')
      .upsert(
        { user_id: userId, listing_id: id },
        { onConflict: 'user_id,listing_id', ignoreDuplicates: true }
      );
    if (error) throw error;
  },

  unsaveListing: async (userId, listingId) => {
    const id = cleanId(listingId);
    console.log('[unsaveListing] attempting delete:', { userId, id });

    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', id);

    if (error) {
      console.error('[unsaveListing] error:', error);
      throw error;
    }

    // Verify it was actually deleted
    const { data: check } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', id)
      .maybeSingle();

    if (check) {
      console.error('[unsaveListing] row still exists after delete — RLS may be blocking');
      throw new Error('Failed to unsave listing');
    }

    console.log('[unsaveListing] deleted successfully');
  },

  trackView: async (listingId) => {
    const { error } = await supabase.functions.invoke('track_listing_view', {
      body: { listing_id: cleanId(listingId) },
    });
    if (error) console.warn('[trackView] failed:', error);
  },

  sendMessage: async (recipientId, content, listingId, listingTitle) => {
    const { data, error } = await supabase.functions.invoke('send_message', {
      body: {
        recipient_id:  recipientId,
        content,
        listing_id:    cleanId(listingId),
        listing_title: listingTitle,
      },
    });
    if (error) {
      const detail = await error.context?.json().catch(() => null);
      console.error('[sendMessage] raw error:', JSON.stringify(detail));
      throw error;
    }
    return data;
  },
};