import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Fetches a single listing via the get_listing_by_id RPC.
//
// Cache behaviour:
//  • staleTime 10 min  → no DB call if you revisit within 10 min
//  • gcTime 24 hr      → survives app restarts via the AsyncStorage persister
//  • placeholderData   → if the listing was already loaded in the market feed
//    cache, it renders instantly from there while the full RPC runs in the bg.
// ─────────────────────────────────────────────────────────────────────────────

function mapRaw(raw) {
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
  };
}

export function useListingDetails(listingId, userId) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["listing", listingId],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_listing_by_id", {
        p_listing_id: listingId,
        p_user_id: userId ?? null,
      });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Listing not found");

      return mapRaw(data[0]);
    },

    enabled: !!listingId,
    staleTime: 10 * 60 * 1000,    // serve from cache for 10 min
    gcTime:    24 * 60 * 60 * 1000,

    // If this listing exists in the market feed cache, use it as instant
    // placeholder while the full RPC result loads in the background.
    placeholderData: () => {
      const allPages = queryClient
        .getQueriesData({ queryKey: ["market"] })
        .flatMap(([, d]) => d?.pages?.flat() ?? []);

      const match = allPages.find((l) => l?.id === listingId);
      if (!match) return undefined;

      // Market feed items have different field names — remap to detail shape
      return {
        id:                match.id,
        user_id:           match.user_id,
        title:             match.title,
        description:       match.description,
        price:             match.price,
        currency:          match.currency,
        category:          match.category,
        condition:         match.condition,
        images:            match.images ?? [],
        location:          match.location,
        status:            match.status,
        view_count:        match.view_count,
        like_count:        match.like_count,
        inquiry_count:     match.inquiry_count,
        created_at:        match.created_at,
        seller_id:         match.seller_id ?? match.user_id,
        seller_username:   match.seller_username ?? null,
        seller_avatar_url: match.seller_avatar_url ?? null,
        seller_created_at: match.seller_created_at ?? null,
      };
    },
  });
}

// Call this whenever you need to force a fresh fetch
// e.g. after sending an inquiry or if the seller edits the listing
export function useInvalidateListing() {
  const queryClient = useQueryClient();
  return (listingId) =>
    queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
}