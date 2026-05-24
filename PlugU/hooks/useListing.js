import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { listingService } from '../services/listingService';

export function useListing(listingId, userId) {
  const [listing,  setListing]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!listingId) return;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await listingService.getListingById(listingId, userId);
        if (cancelled) return;
        setListing(data);
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }).start();
      } catch (err) {
        console.error('[useListing] load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [listingId, userId]);

  // Track view once listing is loaded
  useEffect(() => {
    if (!listing?.id) return;
    listingService.trackView(listing.id).catch(() => {});
    setListing((prev) =>
      prev ? { ...prev, view_count: (prev.view_count ?? 0) + 1 } : prev
    );
  }, [listing?.id]);

  return { listing, setListing, loading, fadeAnim };
}