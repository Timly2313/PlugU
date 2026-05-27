import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  FlatList, StyleSheet,
} from 'react-native';
import { MapPin, Package } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import { resolveFirstImage, getStatusDotColor } from '../utilities/userProfileUtils';

function ListingCard({ item }) {
  const imageUri = resolveFirstImage(item.images);

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.88}
      onPress={() => router.push({ pathname: '/ListingDetailScreen', params: { listingId: item.id } })}
    >
      <View style={s.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={s.imageFallback}>
            <Package size={wp(7)} color="#D1D5DB" />
          </View>
        )}
        <View style={s.statusPill}>
          <View style={[s.dot, { backgroundColor: getStatusDotColor(item.status) }]} />
          <Text style={s.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={s.info}>
        <Text style={s.title} numberOfLines={1}>{item.title}</Text>
        <Text style={s.price}>R{Number(item.price).toLocaleString()}</Text>
        {item.location ? (
          <View style={s.locationRow}>
            <MapPin size={wp(2.8)} color="#9CA3AF" />
            <Text style={s.location} numberOfLines={1}>{item.location}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileListingGrid({ listings, isOwnProfile }) {
  return (
    <View style={s.section}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Listings</Text>
        {listings.length > 0 && (
          <View style={s.pill}>
            <Text style={s.pillText}>{listings.length}</Text>
          </View>
        )}
      </View>

      {listings.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconWrap}>
            <Package size={wp(10)} color="#C7D2FE" />
          </View>
          <Text style={s.emptyTitle}>No listings yet</Text>
          <Text style={s.emptySub}>
            {isOwnProfile
              ? 'Post your first listing to get started'
              : "This user hasn't posted any listings yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          renderItem={({ item }) => <ListingCard item={item} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginTop: hp(1) },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: wp(2),
    paddingHorizontal: wp(4), paddingVertical: hp(1.8),
  },
  headerTitle:   { fontSize: wp(4.5), fontWeight: '700', color: '#111827', flex: 1 },
  pill:          { backgroundColor: '#EEF2FF', paddingHorizontal: wp(3), paddingVertical: hp(0.4), borderRadius: wp(50) },
  pillText:      { fontSize: wp(3), color: '#3F51B5', fontWeight: '700' },
  grid:          { paddingHorizontal: wp(4), paddingBottom: hp(2) },
  row:           { gap: wp(3), marginBottom: hp(1.5) },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: wp(4), overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  imageWrap:     { width: '100%', aspectRatio: 1, backgroundColor: '#F3F4F6' },
  image:         { width: '100%', height: '100%' },
  imageFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  statusPill:    { position: 'absolute', top: wp(2), left: wp(2), flexDirection: 'row', alignItems: 'center', gap: wp(1), backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: wp(2), paddingVertical: hp(0.4), borderRadius: wp(50) },
  dot:           { width: wp(1.8), height: wp(1.8), borderRadius: wp(1) },
  statusText:    { fontSize: wp(2.5), color: '#374151', fontWeight: '600', textTransform: 'capitalize' },
  info:          { padding: wp(3), gap: hp(0.4) },
  title:         { fontSize: wp(3.5), fontWeight: '600', color: '#111827' },
  price:         { fontSize: wp(4), fontWeight: '800', color: '#3F51B5' },
  locationRow:   { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
  location:      { fontSize: wp(3), color: '#9CA3AF', flex: 1 },
  empty:         { alignItems: 'center', paddingVertical: hp(6), paddingHorizontal: wp(10) },
  emptyIconWrap: { width: wp(20), height: wp(20), borderRadius: wp(10), backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: hp(2) },
  emptyTitle:    { fontSize: wp(4.2), fontWeight: '700', color: '#374151', marginBottom: hp(0.8), textAlign: 'center' },
  emptySub:      { fontSize: wp(3.4), color: '#9CA3AF', textAlign: 'center', lineHeight: hp(2.5) },
});