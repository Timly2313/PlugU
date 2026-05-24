import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Calendar, Eye, Heart, MessageCircle, Tag, ShieldCheck } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import { timeAgo } from '../utilities/listingUtils';

export default function ListingInfo({ listing }) {
  return (
    <View style={s.card}>
      {/* Title + price */}
      <View style={s.titleRow}>
        <Text style={s.title} numberOfLines={2}>{listing.title}</Text>
        <Text style={s.price}>R{Number(listing.price).toLocaleString()}</Text>
      </View>

      {/* Location + date */}
      <View style={s.metaRow}>
        {listing.location ? (
          <View style={s.metaItem}>
            <MapPin size={wp(3.5)} color="#6B7280" />
            <Text style={s.metaText}>{listing.location}</Text>
          </View>
        ) : null}
        <View style={s.metaItem}>
          <Calendar size={wp(3.5)} color="#6B7280" />
          <Text style={s.metaText}>{timeAgo(listing.created_at)}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Eye size={wp(3.5)} color="#9CA3AF" />
          <Text style={s.statText}>{listing.view_count ?? 0} views</Text>
        </View>
        <View style={s.statItem}>
          <Heart size={wp(3.5)} color="#9CA3AF" />
          <Text style={s.statText}>{listing.like_count ?? 0} likes</Text>
        </View>
        <View style={s.statItem}>
          <MessageCircle size={wp(3.5)} color="#9CA3AF" />
          <Text style={s.statText}>{listing.inquiry_count ?? 0} inquiries</Text>
        </View>
      </View>

      {/* Tags */}
      <View style={s.tagsRow}>
        {listing.category ? (
          <View style={s.tag}>
            <Tag size={wp(3)} color="#3F51B5" />
            <Text style={s.tagText}>{listing.category}</Text>
          </View>
        ) : null}
        {Array.isArray(listing.condition) &&
          listing.condition.map((c, i) => (
            <View key={i} style={s.tagGreen}>
              <ShieldCheck size={wp(3)} color="#10B981" />
              <Text style={s.tagTextGreen}>{c}</Text>
            </View>
          ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: wp(4), padding: wp(4),
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 0,
  },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: wp(3), marginBottom: hp(1.2),
  },
  title:   { flex: 1, fontSize: wp(5), fontWeight: '700', color: '#111827', lineHeight: wp(7) },
  price:   { fontSize: wp(5.5), fontWeight: '800', color: '#3F51B5' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(4), marginBottom: hp(1.2) },
  metaItem:{ flexDirection: 'row', alignItems: 'center', gap: wp(1) },
  metaText:{ fontSize: wp(3.3), color: '#6B7280' },
  statsRow: {
    flexDirection: 'row', gap: wp(5),
    paddingTop: hp(1.2), borderTopWidth: 1, borderTopColor: '#F3F4F6', marginBottom: hp(1.2),
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
  statText: { fontSize: wp(3), color: '#9CA3AF' },
  tagsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2) },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: wp(1),
    backgroundColor: '#EEF2FF', paddingHorizontal: wp(3),
    paddingVertical: hp(0.6), borderRadius: wp(50),
  },
  tagText:      { fontSize: wp(3), color: '#3F51B5', fontWeight: '500', textTransform: 'capitalize' },
  tagGreen: {
    flexDirection: 'row', alignItems: 'center', gap: wp(1),
    backgroundColor: '#ECFDF5', paddingHorizontal: wp(3),
    paddingVertical: hp(0.6), borderRadius: wp(50),
  },
  tagTextGreen: { fontSize: wp(3), color: '#10B981', fontWeight: '500', textTransform: 'capitalize' },
});