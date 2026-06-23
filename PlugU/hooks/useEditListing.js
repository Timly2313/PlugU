import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { editListingService } from '../services/editListingService';

export function useEditListing(listingId, user, profile) {
  const [title,        setTitle]        = useState('');
  const [price,        setPrice]        = useState('');
  const [category,     setCategory]     = useState('');
  const [condition,    setCondition]    = useState('');
  const [description,  setDescription]  = useState('');
  const [media,        setMedia]        = useState([]);
  const [tags,         setTags]         = useState([]);
  const [tagInput,     setTagInput]     = useState('');
  const [location,     setLocation]     = useState('');
  const [latitude,     setLatitude]     = useState(null);
  const [longitude,    setLongitude]    = useState(null);
  const [isLocating,   setIsLocating]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading,    setIsLoading]    = useState(true);
  const [loadError,    setLoadError]    = useState(null);

  // ── Load existing listing ──────────────────────────────────────────────────
  // Normalise: Expo Router can return params as string | string[]
  const resolvedId = Array.isArray(listingId) ? listingId[0] : listingId;

  useEffect(() => {
    if (!resolvedId) return;

    let cancelled = false;

    (async () => {
      // Keep setIsLoading OUT of the effect body to avoid re-render → re-run loops.
      // State is already initialised to true, so we only flip it to false below.
      setLoadError(null);
      try {
        const listing = await editListingService.fetchListing(resolvedId);
        if (cancelled) return;

        setTitle(listing.title ?? '');
        setPrice(listing.price != null ? String(listing.price) : '');
        setCategory(listing.category ?? '');
        setCondition(
          Array.isArray(listing.condition)
            ? listing.condition[0] ?? ''
            : listing.condition ?? '',
        );
        setDescription(listing.description ?? '');
        setLocation(listing.location ?? '');
        setLatitude(listing.latitude ?? null);
        setLongitude(listing.longitude ?? null);
        setTags(listing.tags ?? []);

        // Map remote image URLs into the same shape the UI expects
        const remoteMedia = (listing.images ?? []).map((url) => ({
          id:    Math.random().toString(36).slice(2),
          type:  'image',
          url,
          asset: null,
        }));
        setMedia(remoteMedia);
      } catch (err) {
        if (!cancelled) {
          console.error('[useEditListing] load error:', err);
          setLoadError(err.message ?? 'Failed to load listing.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [resolvedId]); // stable string — won't re-fire on every render

  // ── Media ──────────────────────────────────────────────────────────────────
  const addMedia = useCallback((assets) => {
    const items = assets.map((a) => ({
      id:    Math.random().toString(36).slice(2),
      type:  'image',
      url:   a.uri,
      asset: a,
    }));
    setMedia((prev) => [...prev, ...items]);
  }, []);

  const removeMedia = useCallback((id) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ── Location ───────────────────────────────────────────────────────────────
  const detectLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is needed to auto-fill your location.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [place] = await Location.reverseGeocodeAsync({
        latitude:  coords.latitude,
        longitude: coords.longitude,
      });
      const str = [place.district, place.city].filter(Boolean).join(', ');
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      setLocation(str || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
    } catch {
      Alert.alert('Error', 'Could not get your location. Please enter it manually.');
    } finally {
      setIsLocating(false);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation('');
    setLatitude(null);
    setLongitude(null);
  }, []);

  // ── Tags ───────────────────────────────────────────────────────────────────
  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags((prev) => [...prev, t]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((t) => {
    setTags((prev) => prev.filter((x) => x !== t));
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    if (!user || !profile) { Alert.alert('Error', 'You must be logged in.'); return; }
    if (!title.trim())       { Alert.alert('Error', 'Title is required.');       return; }
    if (!description.trim()) { Alert.alert('Error', 'Description is required.'); return; }
    if (!category.trim())    { Alert.alert('Error', 'Category is required.');    return; }

    setIsSubmitting(true);
    try {
      const imageUrls = await editListingService.uploadNewImages(media, user.id);

      const payload = {
        title:       title.trim(),
        description: description.trim(),
        price:       price ? Number(price) : undefined,
        currency:    'ZAR',
        category:    category.trim(),
        condition:   condition ? [condition] : null,
        images:      imageUrls,
        location:    location.trim() || profile.location || undefined,
        latitude:    latitude  ?? undefined,
        longitude:   longitude ?? undefined,
        tags,
      };

      const data = await editListingService.updateListing(listingId, payload);

      if (data?.listing?.moderation?.flagged) {
        Alert.alert(
          'Listing Updated',
          'Your listing was updated but is under review. It may be temporarily hidden.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
        return;
      }

      Alert.alert('Success', 'Listing updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('[useEditListing] submit error:', err);
      if (err?.message?.includes('community guidelines')) {
        Alert.alert('Content Rejected', 'Your listing violates community guidelines.');
      } else if (err?.message?.includes('Validation')) {
        Alert.alert('Validation Error', err.message.replace('Validation: ', ''));
      } else {
        Alert.alert('Error', err.message || 'Failed to update listing. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user, profile, listingId,
    title, description, category, condition, price,
    media, location, latitude, longitude, tags,
  ]);

  const canSubmit = !isSubmitting &&
    !isLoading &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    category.trim().length > 0;

  return {
    // field state
    title, setTitle,
    price, setPrice,
    category, setCategory,
    condition, setCondition,
    description, setDescription,
    // media
    media, addMedia, removeMedia,
    // tags
    tags, tagInput, setTagInput, addTag, removeTag,
    // location
    location, setLocation, clearLocation,
    latitude, longitude,
    isLocating, detectLocation,
    // async state
    isLoading, loadError,
    isSubmitting, canSubmit,
    submit,
  };
}