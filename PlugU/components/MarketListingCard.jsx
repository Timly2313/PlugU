import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Bookmark, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';

function resolveFirstImage(images) {
  if (!images) return null;
  if (Array.isArray(images) && images.length > 0) return images[0];
  if (typeof images === 'object') return Object.values(images)[0] ?? null;
  return null;
}

export default function MarketListingCard({ listing, isSaved, onSave }) {
  const imageUri = resolveFirstImage(listing.images);

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.88}
      onPress={() => router.push({ pathname: '/ListingDetailsScreen', params: { listingId: listing.id } })}
    >
      {/* Image */}
      <View style={s.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={s.imageFallback} />
        )}

        {/* Save button */}
        <TouchableOpacity
          style={s.saveBtn}
          onPress={(e) => { e.stopPropagation?.(); onSave(listing.id); }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Bookmark
            size={wp(4)}
            color={isSaved ? '#3F51B5' : '#fff'}
            fill={isSaved ? '#3F51B5' : 'none'}
          />
        </TouchableOpacity>

      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.title} numberOfLines={1}>{listing.title}</Text>
        <Text style={s.price}>R{Number(listing.price).toLocaleString()}</Text>
        {listing.location ? (
          <View style={s.locationRow}>
            <MapPin size={wp(2.8)} color="#9CA3AF" />
            <Text style={s.location} numberOfLines={1}>{listing.location}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: wp(4),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap:    { width: '100%', aspectRatio: 1, backgroundColor: '#F3F4F6' },
  image:        { width: '100%', height: '100%' },
  imageFallback:{ width: '100%', height: '100%', backgroundColor: '#E5E7EB' },
  saveBtn: {
    position: 'absolute', top: wp(2), right: wp(2),
    width: wp(8), height: wp(8), borderRadius: wp(4),
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  categoryPill: {
    position: 'absolute', bottom: wp(2), left: wp(2),
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: wp(2.5), paddingVertical: hp(0.4),
    borderRadius: wp(50),
  },
  categoryText: { color: '#fff', fontSize: wp(2.5), fontWeight: '600', textTransform: 'capitalize' },
  info:         { padding: wp(3), gap: hp(0.4) },
  title:        { fontSize: wp(3.5), fontWeight: '600', color: '#111827' },
  price:        { fontSize: wp(4), fontWeight: '800', color: '#3F51B5' },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
  location:     { fontSize: wp(3), color: '#9CA3AF', flex: 1 },
});