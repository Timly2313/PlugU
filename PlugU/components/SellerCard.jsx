import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import Avatar from '../components/Avatar';
import { memberSince } from '../utilities/listingUtils';

export default function SellerCard({ listing }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '/UserProfileScreen',
          params: { userId: listing.seller_id },
        })
      }
    >
      <View style={s.row}>
        <Avatar
          uri={listing.seller_avatar_url}
          name={listing.seller_username}
          size={wp(14)}
          borderWidth={0}
        />
        <View style={s.details}>
          <Text style={s.name}>{listing.seller_username}</Text>
          <Text style={s.meta}>Member since {memberSince(listing.seller_created_at)}</Text>
          <View style={s.ratingRow}>
            {[1,2,3,4,5].map((i) => (
              <Star key={i} size={wp(3)} color="#3F51B5" fill="#3F51B5" />
            ))}
            <Text style={s.ratingText}>5.0</Text>
          </View>
        </View>
        <ChevronRight size={wp(4.5)} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: wp(4), padding: wp(4),
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 0,
  },
  row:        { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
  details:    { flex: 1, gap: hp(0.5) },
  name:       { fontSize: wp(4), fontWeight: '700', color: '#111827' },
  meta:       { fontSize: wp(3), color: '#9CA3AF' },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
  ratingText: { fontSize: wp(3), color: '#6B7280', marginLeft: wp(1) },
});