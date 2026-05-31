import { useState, useEffect } from 'react';
import {
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { marketService } from '../services/marketService';

export function useBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketService.getBanners()
      .then(setBanners)
      .catch((err) => console.error('[useBanners] error:', err))
      .finally(() => setLoading(false));
  }, []);

  return { banners, loading };
}

export function resolveCta(banner) {
  switch (banner.cta_type) {
    case 'listing':
      return () => router.push({ pathname: '/ListingDetailsScreen', params: { listingId: banner.cta_value } });
    case 'profile':
      return () => router.push({ pathname: '/UserProfileScreen', params: { userId: banner.cta_value } });
    case 'url':
      return () => Linking.openURL(banner.cta_value).catch(() => {});
    default:
      return null;
  }
}