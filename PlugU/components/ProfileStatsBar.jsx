import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { hp, wp } from '../utilities/dimensions';
import { formatCount } from '../utilities/userProfileUtils';

export default function ProfileStatsBar({ profile, followerCount, listingCount }) {
  const stats = [
    { label: 'Listings',  value: formatCount(listingCount ?? profile.listing_count ?? 0) },
    { label: 'Followers', value: formatCount(followerCount) },
    { label: 'Following', value: formatCount(profile.following_count ?? 0) },
    { label: 'Posts',     value: formatCount(profile.post_count ?? 0) },
  ];

  return (
    <View style={s.card}>
      {stats.map((stat, i) => (
        <React.Fragment key={stat.label}>
          {i > 0 && <View style={s.divider} />}
          <View style={s.item}>
            <Text style={s.value}>{stat.value}</Text>
            <Text style={s.label}>{stat.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    borderRadius: wp(4),
    paddingVertical: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: hp(1.5),
  },
  item:    { flex: 1, alignItems: 'center', gap: hp(0.3) },
  divider: { width: 1, height: hp(4), backgroundColor: '#F3F4F6', alignSelf: 'center' },
  value:   { fontSize: wp(4.8), fontWeight: '800', color: '#111827' },
  label:   { fontSize: wp(2.8), color: '#9CA3AF', fontWeight: '500' },
});