import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Package } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

export default function MarketEmptyState({ hasActiveFilters, onClearFilters }) {
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Package size={wp(14)} color="#C7D2FE" />
      </View>
      <Text style={s.title}>No listings found</Text>
      <Text style={s.sub}>
        {hasActiveFilters
          ? 'Try adjusting your filters or search term'
          : 'Pull down to refresh'}
      </Text>
      {hasActiveFilters && (
        <TouchableOpacity style={s.clearBtn} onPress={onClearFilters}>
          <Text style={s.clearBtnText}>Clear filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: hp(10), paddingTop: hp(4) },
  iconWrap: { width: wp(24), height: wp(24), borderRadius: wp(12), backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: hp(2) },
  title:    { fontSize: wp(4.5), fontWeight: '700', color: '#374151', marginBottom: hp(0.8) },
  sub:      { fontSize: wp(3.5), color: '#9CA3AF', textAlign: 'center', paddingHorizontal: wp(10), lineHeight: wp(5.5) },
  clearBtn: { marginTop: hp(2), backgroundColor: '#EEF2FF', paddingHorizontal: wp(6), paddingVertical: hp(1.2), borderRadius: wp(50) },
  clearBtnText: { color: '#3F51B5', fontWeight: '600', fontSize: wp(3.5) },
});