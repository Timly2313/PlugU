import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Share, Platform, KeyboardAvoidingView, StyleSheet,
} from 'react-native';
import { ArrowLeft, Share2, Bookmark } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../context/authContext';
import { useListing } from '../hooks/useListing';
import { useSaveListing } from '../hooks/useSaveListing';
import { useSendMessage } from '../hooks/useSendMessage';
import { useToast } from '../hooks/useToast';
import { resolveImages } from '../utilities/listingUtils';
import ImageGallery from '../components/ImageGallery';
import ListingInfo from '../components/ListingInfo';
import MessageSeller from '../components/MessageSeller';
import SellerCard from '../components/SellerCard';
import Toast from '../components/Toast';

export default function ListingDetailScreen() {
  const { listingId } = useLocalSearchParams();
  const { profile } = useAuth();
  const router = useRouter();

  const { toast, showToast } = useToast();

  const { listing, setListing, loading, fadeAnim } =
    useListing(listingId, profile?.id);

  const { saved, saveLoading, saveAnim, toggle: toggleSave } =
  useSaveListing(
    profile?.id,
    listingId,
    showToast,
    listing?.is_saved ?? false,  
  );
  const { message, setMessage, sending, messageSent, send } =
    useSendMessage(profile, listing, setListing, showToast);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = resolveImages(listing);
  const isOwnListing = profile?.id === listing?.seller_id;

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!listing) return;
    const firstImage = images[0] ?? null;
    try {
      const content = {
        title: listing.title,
        message:
          `${listing.title}\nR${Number(listing.price).toLocaleString()}\n` +
          (listing.location ? `${listing.location}\n` : '') +
          (listing.description
            ? `\n${listing.description.slice(0, 120)}${listing.description.length > 120 ? '…' : ''}\n`
            : '') +
          (firstImage ? `\n${firstImage}` : ''),
      };
      if (Platform.OS === 'ios' && firstImage) content.url = firstImage;
      await Share.share(content);
    } catch (err) {
      if (err.message !== 'The user did not share') console.error('Share failed:', err);
    }
  }, [listing, images]);

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading) {
    return (
      <ScreenWrapper bg="#F9FAFB">
        <View style={s.center}>
          <ActivityIndicator size="large" color="#3F51B5" />
          <Text style={s.loadingText}>Loading listing…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!listing) {
    return (
      <ScreenWrapper bg="#F9FAFB">
        <View style={s.center}>
          <Text style={s.loadingText}>Listing not found.</Text>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (

    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="auto" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={wp(5)} color="#374151" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{listing.title}</Text>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn} onPress={handleShare}>
            <Share2 size={wp(4.5)} color="#374151" />
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
            <TouchableOpacity
              style={[s.iconBtn, saved && s.iconBtnActive]}
              onPress={toggleSave}
              disabled={saveLoading}
            >
              {saveLoading
                ? <ActivityIndicator size="small" color={saved ? '#fff' : '#3F51B5'} />
                : <Bookmark size={wp(4.5)} color={saved ? '#fff' : '#374151'} fill={saved ? '#fff' : 'none'} />}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* KeyboardAvoidingView wraps only the scrollable content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: hp(4) }}
        >
          <ImageGallery
            images={images}
            currentIndex={currentImageIndex}
            onPrev={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
            onNext={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
            onDotPress={setCurrentImageIndex}
          />

          <Animated.View style={[s.content, { opacity: fadeAnim }]}>
            <ListingInfo listing={listing} />

            <View style={s.section}>
              <Text style={s.sectionTitle}>Description</Text>
              <Text style={s.descriptionText}>{listing.description}</Text>
            </View>

            {!isOwnListing && (
              <MessageSeller
                message={message}
                onChangeText={setMessage}
                onSend={send}
                sending={sending}
                messageSent={messageSent}
              />
            )}

            <SellerCard listing={listing} />

            <View style={{ height: hp(6) }} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: hp(2) },
  loadingText: { fontSize: wp(4), color: '#6B7280' },
  backBtn: { backgroundColor: '#3F51B5', paddingHorizontal: wp(6), paddingVertical: hp(1.5), borderRadius: wp(50) },
  backBtnText: { color: '#fff', fontWeight: '600', fontSize: wp(3.5) },
  header: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    paddingHorizontal: wp(4), paddingVertical: hp(1.5),
    flexDirection: 'row', alignItems: 'center', gap: wp(3),
  },
  headerTitle: { flex: 1, fontSize: wp(4), fontWeight: '600', color: '#111827' },
  headerRight: { flexDirection: 'row', gap: wp(2) },
  iconBtn: {
    width: wp(9), height: wp(9), borderRadius: wp(4.5),
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6',
  },
  iconBtnActive: { backgroundColor: '#3F51B5' },
  content: { padding: wp(4), gap: hp(2) },
  section: { paddingHorizontal: wp(1) },
  sectionTitle: { fontSize: wp(4), fontWeight: '700', color: '#111827', marginBottom: hp(1.2) },
  descriptionText: { fontSize: wp(3.8), color: '#13161A', lineHeight: hp(3) },
});