import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import {
  View, FlatList, ActivityIndicator,
  RefreshControl, ScrollView, StyleSheet,
  Animated,
} from 'react-native';
import { StatusBar }        from 'expo-status-bar';
import ScreenWrapper        from '../../components/ScreenWrapper';
import { hp, wp }           from '../../utilities/dimensions';
import { useAuth }          from '../../context/authContext';
import { useMarketListings } from '../../hooks/useMarketListings';
import { useBanners }       from '../../hooks/useBanners';
import { useMarketSave }    from '../../hooks/useMarketSave';
import MarketHeader         from '../../components/MarketHeader';
import FilterPanel          from '../../components/FilterPanel';
import HeroBanner           from '../../components/HeroBanner';
import MarketListingCard    from '../../components/MarketListingCard';
import MarketEmptyState     from '../../components/MarketEmptyState';


const INITIAL_FILTERS = { category: null, minPrice: '', maxPrice: '' };

export default function MarketScreen() {
  const { profile } = useAuth();

  const [searchQuery,    setSearchQuery]    = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showFilters,    setShowFilters]    = useState(false);
  const [filters,        setFilters]        = useState(INITIAL_FILTERS);

  const filterAnim = useRef(new Animated.Value(0)).current;

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Animate filter panel ───────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(filterAnim, {
      toValue:         showFilters ? 1 : 0,
      duration:        220,
      useNativeDriver: false,
    }).start();
  }, [showFilters]);

  // ── Data ───────────────────────────────────────────────────────────────────
  const { banners } = useBanners();

  const {
    data, isLoading, isFetchingNextPage,
    hasNextPage, fetchNextPage,
    refetch, isRefetching,
  } = useMarketListings({
    userId:   profile?.id,
    query:    debouncedQuery,
    category: filters.category,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  });

  // ── Fix 1: derive listings from data BEFORE using it ──────────────────────
  const listings = useMemo(() => data?.pages.flat() ?? [], [data]);

  const listingIds = useMemo(() => listings.map((l) => l.id), [listings]);

  const { savedIds, loadingIds, toggleSave } = useMarketSave(profile?.id, listingIds);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setSearchQuery('');
    setShowFilters(false);
  }, []);

  const hasActiveFilters =
    !!filters.category || !!filters.minPrice ||
    !!filters.maxPrice  || !!debouncedQuery;

  // ── Fix 2: ListHeader as a component function, not memoized JSX ───────────
  // FlatList expects ListHeaderComponent to be a component or () => JSX
  const ListHeaderComponent = useCallback(() => (
    <HeroBanner banners={banners} />
  ), [banners]);

  // ── Render item ────────────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }) => (
    <View style={s.cardWrap}>
      <MarketListingCard
        listing={item}
        isSaved={savedIds.has(item.id)}
        isSaving={loadingIds.has(item.id)}
        onSave={toggleSave}
      />
    </View>
  ), [savedIds, loadingIds, toggleSave]);

  const keyExtractor = useCallback((item) => item.id, []);

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <ScreenWrapper bg="#FAFAFA">
      <StatusBar style="auto" />
      <MarketHeader
        profile={profile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
        hasActiveFilters={hasActiveFilters}
        selectedCategory={filters.category}
        onCategoryChange={(v) => handleFilterChange('category', v)}
      />

      <FilterPanel
        visible={showFilters}
        animValue={filterAnim}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {isLoading && listings.length === 0 ? (
        // Initial load — show banner + spinner so the banner is visible immediately
        <ScrollView contentContainerStyle={s.loadingScroll}>
          <HeroBanner banners={banners} />
          <View style={s.centered}>
            <ActivityIndicator size="large" color="#3F51B5" />
          </View>
        </ScrollView>
      ) : listings.length === 0 ? (
        // Empty state — still show the banner
        <ScrollView
          contentContainerStyle={s.emptyScroll}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3F51B5"
            />
          }
        >
          
          <MarketEmptyState
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          // ── Fix 2: pass component function, not JSX ──
          ListHeaderComponent={ListHeaderComponent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3F51B5"
            />
          }
          ListFooterComponent={
            isFetchingNextPage
              ? <View style={s.footerLoader}><ActivityIndicator size="small" color="#3F51B5" /></View>
              : null
          }
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={6}
        />
      )}
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  centered:     { alignItems: 'center', justifyContent: 'center'},
  loadingScroll:{ flexGrow: 1 },
  emptyScroll:  { flexGrow: 1 },
  grid:         { padding: wp(3), paddingBottom: hp(10) },
  row:          { gap: wp(3), marginBottom: hp(1.5) },
  cardWrap:     { flex: 1 },
  footerLoader: { paddingVertical: hp(2), alignItems: 'center' },
});