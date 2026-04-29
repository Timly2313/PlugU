import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const LIMIT = 20;

export function useMarketListings({ userId, query, category, minPrice, maxPrice, radiusKm }) {
  return useInfiniteQuery({
    // Every unique filter combo gets its own cache entry
    queryKey: ["market", { userId, query, category, minPrice, maxPrice, radiusKm }],

    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc("get_market_feed", {
        p_user_id: userId,
        p_query: query || null,
        p_category: category || null,
        p_min_price: minPrice ? parseFloat(minPrice) : null,
        p_max_price: maxPrice ? parseFloat(maxPrice) : null,
        p_latitude: null,
        p_longitude: null,
        p_radius_km: radiusKm || null,
        p_limit: LIMIT,
        p_offset: pageParam,
      });

      if (error) throw error;
      return data ?? [];
    },

    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === LIMIT ? allPages.flat().length : undefined,

    enabled: !!userId,
    staleTime: 5 * 60 * 1000,  // use cached data for 5 min without hitting DB
    gcTime: 24 * 60 * 60 * 1000,
  });
}