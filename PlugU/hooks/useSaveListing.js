import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { listingService } from '../services/listingService';

export function useSaveListing(userId, listingId, showToast, initialSaved = false) {
  const [saved,       setSaved]       = useState(initialSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  const saveAnim     = useRef(new Animated.Value(1)).current;
  const initialised  = useRef(false);

  // ── Sync when listing loads (initialSaved comes from RPC) ──────────────────
  useEffect(() => {
    if (!initialised.current) {
      setSaved(initialSaved);
    }
  }, [initialSaved]);

  // ── Confirm from DB once after mount ───────────────────────────────────────
  useEffect(() => {
    if (!userId || !listingId || initialised.current) return;
    initialised.current = true;

    listingService
      .checkSaved(userId, listingId)
      .then((isSaved) => {
        console.log('[useSaveListing] DB confirmed saved:', isSaved);
        setSaved(isSaved);
      })
      .catch((err) => console.error('[useSaveListing] checkSaved error:', err));
  }, [userId, listingId]);

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const toggle = useCallback(async () => {
    if (!userId) {
      showToast('Sign in to save listings', 'error');
      return;
    }
    if (saveLoading) return;

    Animated.sequence([
      Animated.timing(saveAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.spring(saveAnim, { toValue: 1,   useNativeDriver: true }),
    ]).start();

    const newSaved = !saved;
    setSaved(newSaved); // optimistic
    setSaveLoading(true);

    try {
      if (newSaved) {
        await listingService.saveListing(userId, listingId);
        showToast('Listing saved');
      } else {
        await listingService.unsaveListing(userId, listingId);
        showToast('Listing removed');
      }
    } catch (err) {
      console.error('[useSaveListing] toggle error:', err);
      setSaved(!newSaved); // revert on failure
      showToast('Something went wrong', 'error');
    } finally {
      setSaveLoading(false);
    }
  }, [userId, listingId, saved, saveLoading, showToast]);

  return { saved, saveLoading, saveAnim, toggle };
}