import React, { useState, useEffect, useCallback, useRef } from "react";
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
  RefreshControl,
  Animated,
} from "react-native";
import { Search, SlidersHorizontal, Package, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import ScreenWrapper from "../../components/ScreenWrapper";
import { hp, wp } from "../../utilities/dimensions";
import ListingCard from "../../components/ListingCard";
import { useAuth } from "../../context/authContext";
import { supabase } from "../../lib/supabase";

const LIMIT = 20;

const CATEGORIES = [
  { label: "All", value: null },
  { label: "Electronics", value: "electronics" },
  { label: "Clothing", value: "clothing" },
  { label: "Furniture", value: "furniture" },
  { label: "Vehicles", value: "vehicles" },
  { label: "Books", value: "books" },
  { label: "Sports", value: "sports" },
  { label: "Other", value: "other" },
];

export default function MarketScreen() {
  const { profile } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [likedListings, setLikedListings] = useState(new Set());
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    category: null,
    minPrice: "",
    maxPrice: "",
    radiusKm: null,
  });

  const filterAnim = useRef(new Animated.Value(0)).current;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Animate filter panel
  useEffect(() => {
    Animated.timing(filterAnim, {
      toValue: showFilters ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [showFilters]);

  const fetchListings = useCallback(
    async (isRefresh = false) => {
      if (!profile?.id) return;

      const currentOffset = isRefresh ? 0 : offset;

      if (isRefresh) {
        setRefreshing(true);
      } else if (currentOffset === 0) {
        setLoading(true);
      }

      try {
        const { data, error } = await supabase.rpc("get_market_feed", {
          p_user_id: profile.id,
          p_query: debouncedQuery || null,
          p_category: filters.category || null,
          p_min_price: filters.minPrice ? parseFloat(filters.minPrice) : null,
          p_max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : null,
          p_latitude: null,
          p_longitude: null,
          p_radius_km: filters.radiusKm || null,
          p_limit: LIMIT,
          p_offset: currentOffset,
        });

        if (error) throw error;

        const results = data || [];

        if (isRefresh || currentOffset === 0) {
          setListings(results);
        } else {
          setListings((prev) => [...prev, ...results]);
        }

        setHasMore(results.length === LIMIT);
      } catch (err) {
        console.error("Failed to load listings:", err);
        if (isRefresh || currentOffset === 0) setListings([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profile?.id, debouncedQuery, filters, offset]
  );

  // Reset and refetch when filters or search change
  useEffect(() => {
    setOffset(0);
    setListings([]);
    fetchListings(true);
  }, [debouncedQuery, filters]);

  // Fetch more when offset increases
  useEffect(() => {
    if (offset > 0) fetchListings(false);
  }, [offset]);

  const loadMore = () => {
    if (!hasMore || loading || refreshing) return;
    setOffset((prev) => prev + LIMIT);
  };

  const toggleLike = (listingId) => {
    setLikedListings((prev) => {
      const next = new Set(prev);
      next.has(listingId) ? next.delete(listingId) : next.add(listingId);
      return next;
    });
  };

  const handleViewListing = (listingId) => {
    router.push({ pathname: "/ListingDetailsScreen", params: { listingId } });
  };

  const clearFilters = () => {
    setFilters({ category: null, minPrice: "", maxPrice: "", radiusKm: null });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filters.category || filters.minPrice || filters.maxPrice ||
    filters.radiusKm || debouncedQuery;

  const filterHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, hp(30)],
  });

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <ScreenWrapper bg="#FAFAFA">

        {/* ── Sticky Header ── */}
        <View style={styles.stickyHeader}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greeting}>
                Hi, {profile?.username || "there"} 👋
              </Text>
              <Text style={styles.subtitle}>What are you looking for?</Text>
            </View>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {(profile?.username?.[0] || "U").toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Search size={wp(4)} color="#9CA3AF" />
              <TextInput
                placeholder="Search listings..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor="#9CA3AF"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={wp(4)} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.filterButton, showFilters && styles.filterButtonActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal
                size={wp(4)}
                color={showFilters ? "white" : "#374151"}
              />
            </TouchableOpacity>
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChips}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={[styles.chip, filters.category === cat.value && styles.chipActive]}
                onPress={() => setFilters((prev) => ({ ...prev, category: cat.value }))}
              >
                <Text
                  style={[styles.chipText, filters.category === cat.value && styles.chipTextActive]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Expandable filter panel */}
          <Animated.View style={[styles.filterPanel, { height: filterHeight }]}>
            <View style={styles.filterPanelInner}>
              <Text style={styles.filterLabel}>Price Range (R)</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={filters.minPrice}
                  onChangeText={(v) => setFilters((prev) => ({ ...prev, minPrice: v }))}
                />
                <View style={styles.priceDivider} />
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={filters.maxPrice}
                  onChangeText={(v) => setFilters((prev) => ({ ...prev, maxPrice: v }))}
                />
              </View>

              <Text style={[styles.filterLabel, { marginTop: hp(1.5) }]}>Radius (km)</Text>
              <TextInput
                style={[styles.priceInput, { width: "50%" }]}
                placeholder="e.g. 10"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={filters.radiusKm ? String(filters.radiusKm) : ""}
                onChangeText={(v) =>
                  setFilters((prev) => ({ ...prev, radiusKm: v ? parseFloat(v) : null }))
                }
              />

              {hasActiveFilters && (
                <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                  <Text style={styles.clearBtnText}>Clear all filters</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>

        {/* ── Content ── */}
        {loading && listings.length === 0 ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color="#3F51B5" />
            <Text style={styles.stateText}>Finding listings...</Text>
          </View>
        ) : listings.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.centeredState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchListings(true)}
                tintColor="#3F51B5"
              />
            }
          >
            <View style={styles.emptyIconWrap}>
              <Package size={wp(14)} color="#C7D2FE" />
            </View>
            <Text style={styles.emptyTitle}>No listings found</Text>
            <Text style={styles.emptySubtitle}>
              {hasActiveFilters
                ? "Try adjusting your filters or search term"
                : "No listings available right now"}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
                <Text style={styles.clearFiltersBtnText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchListings(true)}
                tintColor="#3F51B5"
              />
            }
            ListFooterComponent={
              hasMore && !refreshing ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#3F51B5" />
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <ListingCard
                  listing={item}
                  onViewListing={handleViewListing}
                  liked={likedListings.has(item.id)}
                  onLikeClick={() => toggleLike(item.id)}
                />
              </View>
            )}
          />
        )}
      </ScreenWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: "#FAFAFA",
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1.5),
  },
  greeting: {
    fontSize: wp(5),
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: wp(3.5),
    color: "#6B7280",
    marginTop: hp(0.3),
  },
  avatar: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
  },
  avatarFallback: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: wp(5),
    fontWeight: "700",
    color: "#3F51B5",
  },
  searchRow: {
    flexDirection: "row",
    gap: wp(2),
    marginBottom: hp(1.2),
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: wp(50),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: wp(4),
    gap: wp(2),
  },
  searchInput: {
    flex: 1,
    paddingVertical: hp(1.2),
    fontSize: wp(3.5),
    color: "#111827",
  },
  filterButton: {
    width: wp(11),
    height: wp(11),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: wp(5.5),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  filterButtonActive: {
    backgroundColor: "#3F51B5",
    borderColor: "#3F51B5",
  },
  categoryChips: {
    flexDirection: "row",
    gap: wp(2),
    paddingVertical: hp(0.5),
  },
  chip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: wp(50),
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: {
    backgroundColor: "#3F51B5",
    borderColor: "#3F51B5",
  },
  chipText: {
    fontSize: wp(3.2),
    color: "#6B7280",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "white",
  },
  filterPanel: {
    overflow: "hidden",
  },
  filterPanelInner: {
    paddingTop: hp(1.5),
  },
  filterLabel: {
    fontSize: wp(3.5),
    fontWeight: "600",
    color: "#374151",
    marginBottom: hp(1),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
  },
  priceInput: {
    flex: 1,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp(3),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    fontSize: wp(3.5),
    color: "#111827",
  },
  priceDivider: {
    width: wp(4),
    height: 1,
    backgroundColor: "#D1D5DB",
  },
  clearBtn: {
    marginTop: hp(1.2),
    alignSelf: "flex-start",
  },
  clearBtnText: {
    fontSize: wp(3.5),
    color: "#EF4444",
    fontWeight: "500",
  },
  grid: {
    padding: wp(3),
    paddingBottom: hp(10),
  },
  columnWrapper: {
    gap: wp(3),
    marginBottom: hp(1.5),
  },
  cardWrapper: {
    flex: 1,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: hp(10),
  },
  stateText: {
    marginTop: hp(1.5),
    fontSize: wp(3.8),
    color: "#9CA3AF",
  },
  emptyIconWrap: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontSize: wp(4.5),
    fontWeight: "700",
    color: "#374151",
    marginBottom: hp(0.8),
  },
  emptySubtitle: {
    fontSize: wp(3.5),
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: wp(10),
    lineHeight: wp(5.5),
  },
  clearFiltersBtn: {
    marginTop: hp(2),
    backgroundColor: "#EEF2FF",
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.2),
    borderRadius: wp(50),
  },
  clearFiltersBtnText: {
    color: "#3F51B5",
    fontWeight: "600",
    fontSize: wp(3.5),
  },
  footerLoader: {
    paddingVertical: hp(2),
    alignItems: "center",
  },
});