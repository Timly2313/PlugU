import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  TextInput, ScrollView, StyleSheet,
} from 'react-native';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import NotificationBell from '../components/NotificationBell';

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

export default function MarketHeader({
  profile,
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
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.greetingWrap}>
          <Text style={s.greeting}>Hi, {profile?.username ?? 'there'} </Text>
          <Text style={s.subtitle}>What are you looking for?</Text>
        </View>

        <View style={s.topRight}>
          {/* Notification bell */} 
          <NotificationBell color="#374151" />

          {/* Avatar */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/ProfileScreen')}
            activeOpacity={0.8}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitial}>
                  {(profile?.username?.[0] ?? 'U').toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search row */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Search size={wp(4)} color="#9CA3AF" />
          <TextInput
            placeholder="Search listings..."
            value={searchQuery}
            onChangeText={onSearchChange}
            style={s.searchInput}
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
  wrap:           { backgroundColor: '#FAFAFA', paddingHorizontal: wp(4), paddingTop: hp(1.5), paddingBottom: hp(1), borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  topBar:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1.5) },
  greetingWrap:   { flex: 1 },
  greeting:       { fontSize: wp(5), fontWeight: '700', color: '#111827' },
  subtitle:       { fontSize: wp(3.5), color: '#6B7280', marginTop: hp(0.3) },
  topRight:       { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
  avatar:         { width: wp(11), height: wp(11), borderRadius: wp(5.5), borderWidth: 2, borderColor: '#E0E7FF' },
  avatarFallback: { width: wp(11), height: wp(11), borderRadius: wp(5.5), backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#C7D2FE' },
  avatarInitial:  { fontSize: wp(5), fontWeight: '700', color: '#3F51B5' },
  searchRow:      { flexDirection: 'row', gap: wp(2), marginBottom: hp(1.2) },
  searchBox:      { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: wp(50), borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: wp(4), gap: wp(2) },
  searchInput:    { flex: 1, paddingVertical: hp(1.2), fontSize: wp(3.5), color: '#111827' },
  filterBtn:      { width: wp(11), height: wp(11), justifyContent: 'center', alignItems: 'center', borderRadius: wp(5.5), borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  filterBtnActive:{ backgroundColor: '#3F51B5', borderColor: '#3F51B5' },
  filterDot:      { position: 'absolute', top: wp(1.5), right: wp(1.5), width: wp(2.2), height: wp(2.2), borderRadius: wp(1.1), backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff' },
  chips:          { flexDirection: 'row', gap: wp(2), paddingVertical: hp(0.5) },
  chip:           { paddingHorizontal: wp(4), paddingVertical: hp(0.8), borderRadius: wp(50), backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive:     { backgroundColor: '#3F51B5', borderColor: '#3F51B5' },
  chipText:       { fontSize: wp(3.2), color: '#6B7280', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
});