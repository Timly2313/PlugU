import React from 'react';
import {
  View, Text, TouchableOpacity,
  Animated, StyleSheet,
} from 'react-native';
import { Package, MessageSquare, Eye, Star, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import { formatCount } from '../utilities/profileUtils';

export default function StatsCards({ stats, listingCount, fadeAnim }) {
  const cards = [
    {
      label: 'Active\nListings',
      value: formatCount(listingCount),
      icon:  Package,
      color: '#3F51B5',
      bg:    '#EEF2FF',
      onPress: null,
    },
    {
      label: 'Posts',
      value: formatCount(stats?.post_count ?? 0),
      icon:  MessageSquare,
      color: '#3F51B5',
      bg:    '#EEF2FF',
      onPress: null,
    },
    {
      label: 'Views',
      value: formatCount(stats?.total_profile_views ?? 0),
      icon:  Eye,
      color: '#3F51B5',
      bg:    '#EEF2FF',
      onPress: () => router.push('/AnalyticsScreen'),
    },
    {
      label: 'Rating',
      value: stats?.avg_rating ? stats.avg_rating.toFixed(1) : '—',
      icon:  Star,
      color: '#3F51B5',
      bg:    '#EEF2FF',
      onPress: () => router.push('/ReviewsScreen'),
    },
  ];

  return (
    <Animated.View style={[s.row, { opacity: fadeAnim }]}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <TouchableOpacity
            key={card.label}
            style={[s.card, { backgroundColor: card.bg }]}
            onPress={card.onPress}
            disabled={!card.onPress}
            activeOpacity={card.onPress ? 0.75 : 1}
          >
            {card.onPress && (
              <ChevronRight size={wp(3)} color={card.color} style={s.chevron} />
            )}
            <View style={[s.iconWrap, { backgroundColor: card.color + '20' }]}>
              <Icon size={wp(4)} color={card.color} />
            </View>
            <Text style={[s.value, { color: card.color }]}>{card.value}</Text>
            <Text style={s.label}>{card.label}</Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  row:      { flexDirection: 'row', paddingHorizontal: wp(4), gap: wp(2), marginTop: hp(2) },
  card:     { flex: 1, borderRadius: wp(4), padding: wp(2.5), alignItems: 'center', gap: hp(0.4), position: 'relative' },
  chevron:  { position: 'absolute', top: wp(2), right: wp(2) },
  iconWrap: { width: wp(9), height: wp(9), borderRadius: wp(4.5), alignItems: 'center', justifyContent: 'center', marginBottom: hp(0.2) },
  value:    { fontSize: wp(4.5), fontWeight: '800' },
  label:    { fontSize: wp(2.6), color: '#6B7280', fontWeight: '500', textAlign: 'center' },
});