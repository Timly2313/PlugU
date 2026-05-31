import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { listingService } from '../services/listingService';

export function useMarketSave(userId, listingIds = []) {
  const [savedIds,    setSavedIds]    = useState(new Set());
  const [loadingIds,  setLoadingIds]  = useState(new Set());

  // ── Pre-load saved state for all visible listings ──────────────────────────
  // Fires once when listingIds are available, checks which ones the user saved
  useEffect(() => {
    if (!userId || listingIds.length === 0) return;

    supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', userId)
      .in('listing_id', listingIds)
      .then(({ data, error }) => {
        if (error) {
          console.error('[useMarketSave] preload error:', error);
          return;
        }
        const ids = new Set((data ?? []).map((r) => r.listing_id));
        setSavedIds(ids);
      });
  }, [userId, listingIds.join(',')]); // stable dep — only re-runs when the id list changes

  // ── Toggle — optimistic with revert ───────────────────────────────────────
  const toggleSave = useCallback(async (listingId) => {
    if (!userId) return;

    // Prevent double-tap
    if (loadingIds.has(listingId)) return;

    const isSaved = savedIds.has(listingId);

    // Optimistic
    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(listingId) : next.add(listingId);
      return next;
    });
    setLoadingIds((prev) => new Set(prev).add(listingId));

    try {
      if (isSaved) {
        await listingService.unsaveListing(userId, listingId);
      } else {
        await listingService.saveListing(userId, listingId);
      }
    } catch (err) {
      console.error('[useMarketSave] toggle error:', err);
      // Revert
      setSavedIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(listingId) : next.delete(listingId);
        return next;
      });
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    }
  }, [userId, savedIds, loadingIds]);

  return { savedIds, loadingIds, toggleSave };
}