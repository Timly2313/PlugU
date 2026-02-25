import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Search, SlidersHorizontal, ArrowRight, Package } from "lucide-react-native";
import { useRouter } from "expo-router";
import ScreenWrapper from "../../components/ScreenWrapper";
import { hp, wp } from "../../utilities/dimensions";
import ListingCard from "../../components/ListingCard";
import { useAuth } from "../../context/authContext";

export default function MarketScreen() {
  const { profile } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [likedListings, setLikedListings] = useState(new Set());
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: null,
    minPrice: null,
    maxPrice: null,
    radiusKm: null, // Radius filter
  });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (profile?.id) queryParams.append("userId", profile.id);
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
      if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);
      if (filters.radiusKm) queryParams.append("radiusKm", filters.radiusKm);
      if (searchQuery) queryParams.append("search", searchQuery);

      const response = await fetch(
        `https://your-edge-function-url/getUserListings?${queryParams.toString()}`
      );
      const data = await response.json();

      if (response.ok) {
        setListings(data.listings || []);
      } else {
        Alert.alert("Error", data.message || "Failed to load listings");
      }
    } catch (err) {
      console.error("Failed to load marketplace listings:", err);
      Alert.alert("Error", "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [searchQuery, filters]);

  const toggleLike = (listingId) => {
    setLikedListings((prev) => {
      const newLikes = new Set(prev);
      if (newLikes.has(listingId)) newLikes.delete(listingId);
      else newLikes.add(listingId);
      return newLikes;
    });
  };

  const handleViewListing = (listingId) => {
    router.push({
      pathname: "/ListingDetailsScreen",
      params: { listingId },
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
                <Text style={styles.greeting}>
                  Hi {profile?.username || "User"}
                </Text>
                <Text style={styles.subtitle}>
                  Find listings that match your preferences
                </Text>
              </View>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: profile?.avatar_url }}
                  style={styles.avatar}
                />
              </View>
            </View>
          </View>

          {/* Marketplace Header & Search */}
          <View style={styles.marketplaceHeader}>
            <View style={styles.marketplaceTitleContainer}>
              <Text style={styles.marketplaceTitle}>Marketplace</Text>
            </View>
            <View style={styles.searchContainer}>
              <View style={styles.searchRow}>
                <View style={styles.searchInputContainer}>
                  <Search size={wp(4)} color="#9CA3AF" />
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

          {/* Listings */}
          <View style={styles.listingsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3F51B5" />
              </View>
            ) : listings.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={wp(14)} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No listings found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your filters or search
                </Text>
              </View>
            ) : (
              <FlatList
                data={listings}
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
            )}
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

  loadingContainer: {
  paddingVertical: hp(6),
  alignItems: "center",
},

emptyState: {
  paddingVertical: hp(8),
  alignItems: "center",
  justifyContent: "center",
},

emptyTitle: {
  marginTop: hp(2),
  fontSize: wp(4.5),
  fontWeight: "600",
  color: "#6B7280",
},

emptySubtitle: {
  marginTop: hp(1),
  fontSize: wp(3.5),
  color: "#9CA3AF",
  textAlign: "center",
  paddingHorizontal: wp(10),
},

});