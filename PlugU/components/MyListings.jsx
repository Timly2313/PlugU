import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  FlatList, StyleSheet, Alert,
} from 'react-native';
import {
  Package, Eye, Heart, MoreVertical, PlusCircle,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import { resolveFirstImage, STATUS_CONFIG } from '../utilities/profileUtils';

export default function MyListings({
  listings, onMenuPress,
}) {
  return (
    <View>
      <View style={s.header}>
        <Text style={s.title}>My Listings</Text>
        <TouchableOpacity
          style={s.newBtn}
          onPress={() => router.push('/CreateListingScreen')}
        >
          <PlusCircle size={wp(4)} color="#3F51B5" />
          <Text style={s.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {listings.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Package size={wp(12)} color="#C7D2FE" />
          </View>
          <Text style={s.emptyTitle}>No listings yet</Text>
          <Text style={s.emptySub}>Tap "New" to post your first listing</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/CreateListingScreen')}>
            <Text style={s.emptyBtnText}>Create Listing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          renderItem={({ item }) => {
            const uri = resolveFirstImage(item.images);
            const sc  = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.active;

            return (
              <View style={s.card}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/ListingDetailsScreen', params: { listingId: item.id } })}
                >
                  <View style={s.imgWrap}>
                    {uri ? (
                      <Image source={{ uri }} style={s.img} resizeMode="cover" />
                    ) : (
                      <View style={s.imgFallback}>
                        <Package size={wp(8)} color="#D1D5DB" />
                      </View>
                    )}
                    <View style={[s.statusPill, { backgroundColor: sc.bg }]}>
                      <View style={[s.statusDot, { backgroundColor: sc.color }]} />
                      <Text style={[s.statusText, { color: sc.color }]}>{sc.label}</Text>
                    </View>
                  </View>

                  <View style={s.info}>
                    <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={s.price}>R{Number(item.price).toLocaleString()}</Text>
                    <View style={s.meta}>
                      <Eye size={wp(3)} color="#9CA3AF" />
                      <Text style={s.metaText}>{item.view_count ?? 0}</Text>
                      <Heart size={wp(3)} color="#9CA3AF" />
                      <Text style={s.metaText}>{item.like_count ?? 0}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Three-dot menu */}
                <TouchableOpacity
                  style={s.dotsBtn}
                  onPress={() => onMenuPress(item)}
                >
                  <MoreVertical size={wp(4)} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp(5), paddingTop: hp(2.5), paddingBottom: hp(1.5) },
  title:       { fontSize: wp(4.5), fontWeight: '800', color: '#111827' },
  newBtn:      { flexDirection: 'row', alignItems: 'center', gap: wp(1.5), backgroundColor: '#EEF2FF', paddingHorizontal: wp(3.5), paddingVertical: hp(0.8), borderRadius: wp(50) },
  newBtnText:  { color: '#3F51B5', fontWeight: '700', fontSize: wp(3.5) },
  grid:        { paddingHorizontal: wp(4) },
  row:         { gap: wp(3), marginBottom: hp(1.5) },
  card:        { flex: 1, backgroundColor: '#fff', borderRadius: wp(4), overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, position: 'relative' },
  imgWrap:     { width: '100%', aspectRatio: 1, backgroundColor: '#F3F4F6' },
  img:         { width: '100%', height: '100%' },
  imgFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  statusPill:  { position: 'absolute', bottom: wp(2), left: wp(2), flexDirection: 'row', alignItems: 'center', gap: wp(1), paddingHorizontal: wp(2), paddingVertical: hp(0.4), borderRadius: wp(50) },
  statusDot:   { width: wp(1.8), height: wp(1.8), borderRadius: wp(1) },
  statusText:  { fontSize: wp(2.5), fontWeight: '600' },
  dotsBtn:     { position: 'absolute', top: wp(2), right: wp(2), width: wp(8), height: wp(8), borderRadius: wp(4), backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  info:        { padding: wp(3), gap: hp(0.3) },
  cardTitle:   { fontSize: wp(3.5), fontWeight: '600', color: '#111827' },
  price:       { fontSize: wp(4), fontWeight: '800', color: '#3F51B5' },
  meta:        { flexDirection: 'row', alignItems: 'center', gap: wp(1.5), marginTop: hp(0.3) },
  metaText:    { fontSize: wp(2.8), color: '#9CA3AF' },
  empty:       { alignItems: 'center', paddingVertical: hp(6), paddingHorizontal: wp(10) },
  emptyIcon:   { width: wp(22), height: wp(22), borderRadius: wp(11), backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: hp(2) },
  emptyTitle:  { fontSize: wp(4.5), fontWeight: '700', color: '#374151', marginBottom: hp(0.8) },
  emptySub:    { fontSize: wp(3.5), color: '#9CA3AF', textAlign: 'center', lineHeight: hp(2.5), marginBottom: hp(2) },
  emptyBtn:    { backgroundColor: '#3F51B5', paddingHorizontal: wp(6), paddingVertical: hp(1.5), borderRadius: wp(50) },
  emptyBtnText:{ color: '#fff', fontWeight: '700', fontSize: wp(3.8) },
});