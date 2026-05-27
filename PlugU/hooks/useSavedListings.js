import { useState, useEffect, useCallback } from 'react';
import { savedListingsService } from '../services/savedListingsService';

export function useSavedListings(userId) {
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await savedListingsService.getSavedListings(userId);
      setListings(data);
    } catch (err) {
      console.error('[useSavedListings] fetch error:', err);
      setError(err.message ?? 'Failed to load saved listings');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // ── Remove — optimistic ────────────────────────────────────────────────────
  const removeListing = useCallback(async (listingId) => {
    // Snapshot for rollback
    const snapshot = listings;
    setListings((prev) => prev.filter((l) => l.id !== listingId));

    try {
      await savedListingsService.removeSavedListing(userId, listingId);
    } catch (err) {
      console.error('[useSavedListings] remove error:', err);
      setListings(snapshot); // revert
    }
  }, [userId, listings]);

  return { listings, loading, error, removeListing, refetch: fetchListings };
}