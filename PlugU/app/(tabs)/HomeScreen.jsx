// MarketScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  StatusBar
} from 'react-native';
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react-native';
import { useRouter } from "expo-router";
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp, wp } from '../../utilities/dimensions';
import ListingCard from '../../components/ListingCard'

const mockListings = [
  {
    id: '1',
    title: 'Modern Sofa Set',
    price: 7500,
    location: 'Johannesburg, GP',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    category: 'Furniture',
  },
  {
    id: '2',
    title: 'iPhone 14 Pro',
    price: 15999,
    location: 'Cape Town, WC',
    image: 'https://images.unsplash.com/photo-1592286927505-c1f03fdedc1b?w=400&h=300&fit=crop',
    category: 'Electronics',
  },
  {
    id: '3',
    title: 'Vintage Bicycle',
    price: 3200,
    location: 'Pretoria, GP',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop',
    category: 'Sports',
  },
  {
    id: '4',
    title: 'Gaming Laptop',
    price: 18500,
    location: 'Durban, KZN',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop',
    category: 'Electronics',
  },
  {
    id: '5',
    title: 'Designer Handbag',
    price: 5800,
    location: 'Sandton, GP',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=300&fit=crop',
    category: 'Fashion',
  },
  {
    id: '6',
    title: 'Wooden Dining Table',
    price: 6200,
    location: 'Port Elizabeth, EC',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=300&fit=crop',
    category: 'Furniture',
  },
];

export default function MarketScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [likedListings, setLikedListings] = useState(new Set());
  const router = useRouter();

  const toggleLike = (listingId) => {
    setLikedListings((prev) => {
      const newLikes = new Set(prev);
      if (newLikes.has(listingId)) {
        newLikes.delete(listingId);
      } else {
        newLikes.add(listingId);
      }
      return newLikes;
    });
  };

  const handleViewListing = (listingId) => {
    router.push({
      pathname: "/ListingDetailsScreen",
      params: { listingId }
    });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScreenWrapper bg="white">
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hi Timly</Text>
              <Text style={styles.subtitle}>
                Let's get you what you're looking for.
              </Text>
            </View>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1531299983330-093763e1d963?w=200&h=200&fit=crop",
                }}
                style={styles.avatar}
              />
            </View>
          </View>

          {/* Deal Card */}
          <View style={styles.dealCard}>
            <View style={styles.dealContent}>
              <View style={styles.dealTextContainer}>
                <Text style={styles.dealSubtitle}>Today's Deal</Text>
                <Text style={styles.dealTitle}>50% OFF</Text>
                <Text style={styles.dealDescription} numberOfLines={3}>
                  Et provident eos est dolore. Illum libero adipisci molestias
                  aut et quisquam aspernatur.
                </Text>
                <TouchableOpacity style={styles.dealButton}>
                  <Text style={styles.dealButtonText}>BUY IT NOW</Text>
                  <ArrowRight size={wp(4)} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.dealImageContainer}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1706099347777-002ab5e8190c?w=400&h=300&fit=crop",
                  }}
                  style={styles.dealImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Marketplace Header */}
        <View style={styles.marketplaceHeader}>
          <View style={styles.marketplaceTitleContainer}>
            <Text style={styles.marketplaceTitle}>Marketplace</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <Search size={wp(4)} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={wp(4)} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Listings Grid */}
        <View style={styles.listingsContainer}>
          <FlatList
            data={mockListings}
            renderItem={({ item }) => (
              <View style={styles.listingItem}>
                <ListingCard
                  listing={item}
                  onViewListing={handleViewListing}
                  liked={likedListings.has(item.id)}
                  onLikeClick={() => toggleLike(item.id)}
                />
              </View>
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.listingsGrid}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    marginBottom: hp(7.5),
  },
  heroSection: {
    backgroundColor: 'white',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  greeting: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  avatarContainer: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  dealCard: {
    backgroundColor: '#E0E7FF',
    borderRadius: wp(8),
    padding: wp(5),
    overflow: 'hidden',
  },
  dealContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  dealTextContainer: {
    flex: 1,
  },
  dealSubtitle: {
    color: '#374151',
    fontSize: wp(3.5),
    marginBottom: hp(0.5),
  },
  dealTitle: {
    color: '#111827',
    fontSize: wp(6),
    fontWeight: 'bold',
    marginBottom: hp(1),
  },
  dealDescription: {
    color: '#6B7280',
    fontSize: wp(3),
    marginBottom: hp(2),
    maxWidth: wp(40),
  },
  dealButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.2),
    borderRadius: wp(3),
    alignSelf: 'flex-start',
  },
  dealButtonText: {
    color: 'white',
    fontSize: wp(3.5),
    fontWeight: '600',
  },
  dealImageContainer: {
    width: wp(32),
    height: hp(16),
    marginRight: wp(-2),
    marginTop: hp(-1),
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  marketplaceHeader: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  marketplaceTitleContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
  },
  marketplaceTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#111827',
  },
  searchContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.5),
  },
  searchRow: {
    flexDirection: 'row',
    gap: wp(2),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: wp(50),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: wp(4),
  },
  searchIcon: {
    marginRight: wp(2),
  },
  searchInput: {
    flex: 1,
    paddingVertical: hp(1.2),
    fontSize: wp(3.5),
    color: '#111827',
  },
  filterButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(5),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  listingsContainer: {
    flex: 1,
    paddingBottom: hp(2),
  },
  listingsGrid: {
    paddingHorizontal: wp(4),
    gap: hp(1.5),
  },
  listingItem: {
    flex: 1,
    margin: wp(0.75),
  },
});