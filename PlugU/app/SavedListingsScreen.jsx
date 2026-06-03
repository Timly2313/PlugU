import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { ArrowLeft, Heart, AlertCircle, RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper       from '../components/ScreenWrapper';
import { useAuth }         from '../context/authContext';
import { useSavedListings } from '../hooks/useSavedListings';
import SavedListingCard    from '../components/SavedListingCard';
import EmptyState          from '../components/EmptySavedState';
import { StatusBar } from 'expo-status-bar';

export default function SavedListingsScreen() {
  const { profile } = useAuth();

  const { listings, loading, error, removeListing, refetch } =
    useSavedListings(profile?.id);

  const handlePress = useCallback((listingId) => {
    router.push({
      pathname: '/ListingDetailScreen',
      params:   { listingId },
    });
  }, []);

  const renderItem = useCallback(({ item }) => (
    <SavedListingCard
      listing={item}
      onPress={() => handlePress(item.id)}
      onRemove={() => removeListing(item.id)}
    />
  ), [handlePress, removeListing]);

  return (
    <ScreenWrapper bg="#F9FAFB">
     <StatusBar style="auto" />  
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={wp(5)} color="#374151" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Saved Listings</Text>
        </View>
        <View style={s.headerRight}>
          <Heart size={wp(4)} color="#3F51B5" fill="#3F51B5" />
          <Text style={s.count}>{listings.length}</Text>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#3F51B5" />
        </View>
      )}

      {/* Error */}
      {!loading && error && (
        <View style={s.centered}>
          <AlertCircle size={wp(12)} color="#EF4444" />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={refetch}>
            <RefreshCw size={wp(4)} color="#fff" />
            <Text style={s.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {!loading && !error && (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.savedId}
          renderItem={renderItem}
          contentContainerStyle={[
            s.listContent,
            listings.length === 0 && s.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: hp(1.5) }} />}
          ListEmptyComponent={<EmptyState onBrowse={() => router.back()} />}
        />
      )}
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    paddingHorizontal: wp(4), paddingVertical: hp(1.5),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
  backBtn:     { width: wp(9), height: wp(9), borderRadius: wp(4.5), alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  headerTitle: { fontSize: wp(5), fontWeight: 'bold', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: wp(1) },
  count:       { fontSize: wp(3.5), color: '#374151', fontWeight: '500' },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: hp(2) },
  errorText:   { fontSize: wp(3.8), color: '#374151', textAlign: 'center', paddingHorizontal: wp(8) },
  retryBtn:    { flexDirection: 'row', alignItems: 'center', gap: wp(2), backgroundColor: '#3F51B5', paddingHorizontal: wp(5), paddingVertical: hp(1.2), borderRadius: wp(2) },
  retryText:   { color: '#fff', fontSize: wp(3.5), fontWeight: '600' },
  listContent: { padding: wp(4), paddingBottom: hp(4) },
  listContentEmpty: { flexGrow: 1 },
});