import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Animated, StyleSheet,
} from 'react-native';
import { hp, wp } from '../utilities/dimensions';


export default function FilterPanel({
  visible,
  animValue,
  filters,
  onFilterChange,
  onClear,
  hasActiveFilters,
}) {
  const height = animValue.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, hp(12)],
  });

  return (
    <Animated.View style={[s.wrap, { height }]}>
      <View style={s.inner}>
        {/* Price range */}
        <Text style={s.label}>Price Range (R)</Text>
        <View style={s.priceRow}>
          <TextInput
            style={s.priceInput}
            placeholder="Min"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={filters.minPrice}
            onChangeText={(v) => onFilterChange('minPrice', v)}
          />
          <View style={s.priceDivider} />
          <TextInput
            style={s.priceInput}
            placeholder="Max"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={filters.maxPrice}
            onChangeText={(v) => onFilterChange('maxPrice', v)}
          />
        </View>

        {hasActiveFilters && (
          <TouchableOpacity style={s.clearBtn} onPress={onClear}>
            <Text style={s.clearText}>Clear all filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap:         { overflow: 'hidden', backgroundColor: '#FAFAFA', paddingHorizontal: wp(4) },
  inner:        { paddingTop: hp(1.5) },
  label:        { fontSize: wp(3.5), fontWeight: '600', color: '#374151', marginBottom: hp(1) },
  priceRow:     { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(1) },
  priceInput:   { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: wp(3), paddingHorizontal: wp(3), paddingVertical: hp(1), fontSize: wp(3.5), color: '#111827' },
  priceDivider: { width: wp(4), height: 1, backgroundColor: '#D1D5DB' },
  clearBtn:     { marginBottom: hp(0.2), alignSelf: 'flex-start' },
  clearText:    { fontSize: wp(3.5), color: '#EF4444', fontWeight: '500' },
});