import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

const CATEGORIES = [
  { label: 'All',         value: null },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Clothing',    value: 'clothing' },
  { label: 'Furniture',   value: 'furniture' },
  { label: 'Vehicles',    value: 'vehicles' },
  { label: 'Books',       value: 'books' },
  { label: 'Sports',      value: 'sports' },
  { label: 'Other',       value: 'other' },
];

export default function SearchBar({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  selectedCategory,
  onCategoryChange,
}) {
  return (
    <View style={s.wrap}>
      {/* Section title */}
      <Text style={s.sectionTitle}>Marketplace</Text>

      {/* Search row */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Search size={wp(4)} color="#9CA3AF" />
          <TextInput
            placeholder="Search listings..."
            value={searchQuery}
            onChangeText={onSearchChange}
            style={s.input}
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <X size={wp(4)} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[s.filterBtn, showFilters && s.filterBtnActive]}
          onPress={onToggleFilters}
        >
          <SlidersHorizontal size={wp(4)} color={showFilters ? '#fff' : '#374151'} />
          {hasActiveFilters && !showFilters && <View style={s.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[s.chip, selectedCategory === cat.value && s.chipActive]}
            onPress={() => onCategoryChange(cat.value)}
          >
            <Text style={[s.chipText, selectedCategory === cat.value && s.chipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle:   { fontSize: wp(5.5), fontWeight: '800', color: '#111827', marginBottom: hp(1.2), letterSpacing: -0.3 },
  searchRow:      { flexDirection: 'row', gap: wp(2), marginBottom: hp(1.2) },
  searchBox:      { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: wp(50), paddingHorizontal: wp(4), gap: wp(2) },
  input:          { flex: 1, paddingVertical: hp(1.2), fontSize: wp(3.5), color: '#111827' },
  filterBtn:      { width: wp(11), height: wp(11), justifyContent: 'center', alignItems: 'center', borderRadius: wp(5.5), backgroundColor: '#F3F4F6' },
  filterBtnActive:{ backgroundColor: '#3F51B5' },
  filterDot:      { position: 'absolute', top: wp(1.5), right: wp(1.5), width: wp(2.2), height: wp(2.2), borderRadius: wp(1.1), backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff' },
  chips:          { flexDirection: 'row', gap: wp(2), paddingVertical: hp(0.5) },
  chip:           { paddingHorizontal: wp(4), paddingVertical: hp(0.8), borderRadius: wp(50), backgroundColor: '#F3F4F6' },
  chipActive:     { backgroundColor: '#3F51B5' },
  chipText:       { fontSize: wp(3.2), color: '#6B7280', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});