import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { userProfileService } from '../services/userProfileService';

export function useUserProfile(userId, currentUserId) {
  const [profile,       setProfile]       = useState(null);
  const [listings,      setListings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [following,     setFollowing]     = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [profileData, listingData] = await Promise.all([
        userProfileService.getProfile(userId),
        userProfileService.getListings(userId),
      ]);

      if (profileData) {
        setProfile(profileData);
        setFollowing(profileData.is_following ?? false);
        setFollowerCount(profileData.follower_count ?? 0);
      }
      setListings(listingData);

      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      console.error('[useUserProfile] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || followLoading) return;
    setFollowLoading(true);
    const wasFollowing = following;
    // Optimistic
    setFollowing(!wasFollowing);
    setFollowerCount((c) => wasFollowing ? Math.max(0, c - 1) : c + 1);
    try {
      if (wasFollowing) {
        await userProfileService.unfollow(currentUserId, userId);
      } else {
        await userProfileService.follow(currentUserId, userId);
      }
    } catch (err) {
      console.error('[useUserProfile] follow error:', err);
      // Revert
      setFollowing(wasFollowing);
      setFollowerCount((c) => wasFollowing ? c + 1 : Math.max(0, c - 1));
    } finally {
      setFollowLoading(false);
    }
  }, [currentUserId, userId, following, followLoading]);

  return {
    profile, listings, loading,
    following, followLoading, followerCount,
    fadeAnim, slideAnim,
    toggleFollow,
  };
}