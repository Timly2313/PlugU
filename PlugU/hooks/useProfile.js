import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, Alert } from 'react-native';
import { profileService } from '../services/profileService';

export function useProfile(userId) {
  const [stats,        setStats]        = useState(null);
  const [listings,     setListings]     = useState([]);
  const [loading,      setLoading]      = useState(true);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [statsData, listingData] = await Promise.all([
        profileService.getStats(userId),
        profileService.getListings(userId),
      ]);
      setStats(statsData);
      setListings(listingData);

      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      console.error('[useProfile] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // ── Delete listing — optimistic ────────────────────────────────────────────
  const deleteListing = useCallback(async (listing) => {
    setListings((prev) => prev.filter((l) => l.id !== listing.id));
    try {
      await profileService.deleteListing(listing.id);
    } catch {
      setListings((prev) => [listing, ...prev]);
      Alert.alert('Error', 'Failed to delete listing');
    }
  }, []);

  // ── Update status — optimistic ─────────────────────────────────────────────
  const updateStatus = useCallback(async (listingId, newStatus) => {
    setListings((prev) =>
      prev.map((l) => l.id === listingId ? { ...l, status: newStatus } : l)
    );
    try {
      await profileService.updateListingStatus(listingId, newStatus);
    } catch {
      Alert.alert('Error', 'Failed to update status');
      load();
    }
  }, [load]);

  return {
    stats, listings, loading,
    fadeAnim, slideAnim,
    reload: load,
    deleteListing, updateStatus,
  };
}