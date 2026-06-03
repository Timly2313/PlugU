import React, { useState, useRef, useCallback } from 'react';
import {
  ScrollView, Modal, Image, TouchableOpacity,
  Animated, StyleSheet, Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { hp, wp } from '../../utilities/dimensions';
import ScreenWrapper          from '../../components/ScreenWrapper';
import { useAuth }            from '../../context/authContext';
import { useProfile }         from '../../hooks/useProfile';
import ProfileBanner          from '../../components/ProfileBanner';
import ProfileCard            from '../../components/ProfileCard';
import StatsCards             from '../../components/StatsCards';
import MyListings             from '../../components/MyListings';
import ListingActionSheet     from '../../components/ListingActionSheet';
import StatusSheet            from '../../components/StatusSheet';
import ImageViewer            from '../../components/ImageViewer';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  const {
    stats, listings, loading,
    fadeAnim, slideAnim,
    deleteListing, updateStatus,
  } = useProfile(profile?.id);

  const [selectedListing,   setSelectedListing]   = useState(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);

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

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { await signOut(); router.replace('/LoginScreen'); },
      },
    ]);
  }, [signOut]);

  return (
    <ScreenWrapper bg="#F8F9FB">
      <StatusBar style="auto" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(12) }}
      >
        <ProfileBanner
          coverUrl={profile?.cover_image_url}
          onImagePress={openViewer}
          onLogout={handleLogout}
        />

        <ProfileCard
          profile={profile}
          stats={stats}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          onAvatarPress={openViewer}
        />

        <StatsCards
          stats={stats}
          listingCount={listings.filter((l) => l.status === 'active').length}
          fadeAnim={fadeAnim}
        />

        <Animated.View style={{ opacity: fadeAnim }}>
          <MyListings
            listings={listings}
            onMenuPress={(item) => { setSelectedListing(item); setActionSheetVisible(true); }}
          />
        </Animated.View>
      </ScrollView>

      {/* Modals */}
      <ListingActionSheet
        visible={actionSheetVisible}
        listing={selectedListing}
        onClose={() => setActionSheetVisible(false)}
        onDelete={deleteListing}
        onStatusPress={() => setStatusSheetVisible(true)}
      />

      <StatusSheet
        visible={statusSheetVisible}
        listing={selectedListing}
        onClose={() => setStatusSheetVisible(false)}
        onSelect={(status) => {
          setStatusSheetVisible(false);
          updateStatus(selectedListing.id, status);
        }}
      />

      <ImageViewer
        visible={viewerVisible}
        uri={viewerUri}
        animValue={viewerAnim}
        onClose={closeViewer}
      />
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({});