import React, { useRef, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, StyleSheet,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import { useAuth }                from '../context/authContext';
import { useUserProfile }         from '../hooks/useUserProfile';
import { useStartConversation }   from '../hooks/useStartConversation';
import ProfileHeader              from '../components/ProfileHeader';
import ProfileStatsBar            from '../components/ProfileStatsBar';
import ProfileActionButtons       from '../components/ProfileActionButtons';
import ProfileListingGrid         from '../components/ProfileListingGrid';
import ImageViewer                from '../components/ImageViewer';
import ScreenWrapper              from '../components/ScreenWrapper';

export default function UserProfileScreen() {
  const { userId }      = useLocalSearchParams();
  const { profile: me } = useAuth();
  const isOwnProfile    = me?.id === userId;

  const {
    profile, listings, loading,
    following, followLoading, followerCount,
    fadeAnim, slideAnim,
    toggleFollow,
  } = useUserProfile(userId, me?.id);

  const { startOrOpenConversation, starting } = useStartConversation(me?.id);

  // ── Image viewer ───────────────────────────────────────────────────────────
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri,     setViewerUri]     = useState(null);
  const viewerAnim = useRef(new Animated.Value(0)).current;

  const openViewer = useCallback((uri) => {
    if (!uri) return;
    setViewerUri(uri);
    setViewerVisible(true);
    Animated.timing(viewerAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, []);

  const closeViewer = useCallback(() => {
    Animated.timing(viewerAnim, { toValue: 0, duration: 180, useNativeDriver: true })
      .start(() => { setViewerVisible(false); setViewerUri(null); });
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#3F51B5" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.centered}>
        <Text style={s.notFound}>User not found</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = profile.display_name ?? profile.username ?? 'User';

  return (
    <ScreenWrapper>
      <StatusBar style="auto" />

      {/* Floating back button */}
      <TouchableOpacity style={s.floatingBack} onPress={() => router.back()}>
        <ArrowLeft size={wp(5)} color="#fff" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>

        {/* Banner + avatar + identity */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ProfileHeader
            profile={profile}
            onAvatarPress={openViewer}
            onBannerPress={openViewer}
          />
        </Animated.View>

        {/* Stats card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <ProfileStatsBar
            profile={profile}
            followerCount={followerCount}
            listingCount={listings.length}
          />

          {/* Action buttons */}
          <ProfileActionButtons
            isOwnProfile={isOwnProfile}
            following={following}
            followLoading={followLoading}
            onFollow={toggleFollow}
            onMessage={() =>
              startOrOpenConversation(
                userId,
                displayName,
                profile.avatar_url ?? ''
              )
            }
            starting={starting}
            userId={userId}
            totalReviews={profile.total_reviews ?? 0}
          />
        </Animated.View>

        {/* Listings */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <ProfileListingGrid
            listings={listings}
            isOwnProfile={isOwnProfile}
          />
        </Animated.View>

        <View style={{ height: hp(6) }} />
      </ScrollView>

      <ImageViewer
        visible={viewerVisible}
        uri={viewerUri}
        animValue={viewerAnim}
        onClose={closeViewer}
      />
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
 
  scroll:      { flex: 1 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: hp(2), backgroundColor: '#F8F9FB' },
  notFound:    { fontSize: wp(4), color: '#6B7280' },
  backBtn:     { backgroundColor: '#3F51B5', paddingHorizontal: wp(6), paddingVertical: hp(1.5), borderRadius: wp(50) },
  backBtnText: { color: '#fff', fontWeight: '600', fontSize: wp(3.5) },
  floatingBack:{ position: 'absolute', top: hp(5), left: wp(4), zIndex: 10, width: wp(10), height: wp(10), borderRadius: wp(5), backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
});