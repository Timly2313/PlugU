import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { MapPin, Clock, Trash2 } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import {  getStatusColor,  getStatusLabel,  resolveFirstImage,  timeAgoSaved,} from '../utilities/savedListingsUtils';

export default function SavedListingCard({ listing, onPress, onRemove }) {
  const imageUri    = resolveFirstImage(listing.images);
  const statusColor = getStatusColor(listing.status);
  const statusLabel = getStatusLabel(listing.status);
  const isSold      = listing.status === 'sold';

  return (
    <View style={s.card}>
      <View style={s.row}>

        {/* Thumbnail */}
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <View style={s.imageWrap}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={s.image} resizeMode="cover" />
            ) : (
              <View style={s.imageFallback} />
            )}
            <View style={[s.statusTag, { backgroundColor: statusColor }]}>
              <Text style={s.statusText}>{statusLabel}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Details */}
        <TouchableOpacity style={s.details} onPress={onPress} activeOpacity={0.8}>
          <Text style={s.title} numberOfLines={1}>{listing.title}</Text>

          <Text style={[s.price, isSold && s.priceSold]}>
            {listing.currency}{Number(listing.price).toLocaleString()}
          </Text>

          {listing.location ? (
            <View style={s.metaRow}>
              <MapPin size={wp(3)} color="#6B7280" />
              <Text style={s.metaText} numberOfLines={1}>{listing.location}</Text>
            </View>
          ) : null}

          <View style={s.metaRow}>
            <Clock size={wp(3)} color="#9CA3AF" />
            <Text style={s.metaTime}>Saved {timeAgoSaved(listing.savedAt)}</Text>
          </View>

          <Text style={s.seller} numberOfLines={1}>Seller: {listing.seller}</Text>
        </TouchableOpacity>

        {/* Remove */}
        <TouchableOpacity style={s.removeBtn} onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash2 size={wp(4)} color="#9CA3AF" />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  row:       { flexDirection: 'row', padding: wp(3), gap: wp(3), alignItems: 'flex-start' },
  imageWrap: { width: wp(24), height: wp(24), borderRadius: wp(2), overflow: 'hidden' },
  image:     { width: '100%', height: '100%' },
  imageFallback: { width: '100%', height: '100%', backgroundColor: '#E5E7EB' },
  statusTag: {
    position: 'absolute', top: wp(1), left: wp(1),
    paddingHorizontal: wp(2), paddingVertical: hp(0.3),
    borderRadius: wp(1),
  },
  statusText: { color: '#fff', fontSize: wp(2.2), fontWeight: '600' },
  details:    { flex: 1, minWidth: 0, gap: hp(0.4) },
  title:      { fontSize: wp(4), fontWeight: '600', color: '#111827' },
  price:      { fontSize: wp(3.5), color: '#3F51B5', fontWeight: '600' },
  priceSold:  { color: '#EF4444', textDecorationLine: 'line-through' },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
  metaText:   { fontSize: wp(3), color: '#6B7280', flex: 1 },
  metaTime:   { fontSize: wp(2.5), color: '#9CA3AF' },
  seller:     { fontSize: wp(2.8), color: '#6B7280', fontStyle: 'italic' },
  removeBtn:  { padding: wp(1), alignSelf: 'flex-start' },
});