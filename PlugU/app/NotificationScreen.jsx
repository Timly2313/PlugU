import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { ArrowLeft, CheckCheck, Filter } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper            from '../components/ScreenWrapper';
import { useNotifications }     from '../hooks/useNotifications';
import NotificationItem         from '../components/NotificationItem';
import NotificationSkeleton     from '../components/NotificationSkeleton';
import EmptyNotifications       from '../components/EmptyNotifications';

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    refreshing,
    hasMore,
    error,
    unreadOnly,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    toggleUnreadFilter,
  } = useNotifications();

  const renderItem = useCallback(({ item }) => (
    <NotificationItem notification={item} onRead={markAsRead} />
  ), [markAsRead]);

  const renderSeparator = () => <View style={s.separator} />;

  const renderFooter = () =>
    loadingMore
      ? <View style={s.footerLoader}><ActivityIndicator size="small" color="#3F51B5" /></View>
      : null;

  const renderEmpty = () => {
    if (loading) return null;
    if (error)   return (
      <View style={s.errorWrap}>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={refresh}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
    return <EmptyNotifications unreadOnly={unreadOnly} />;
  };

  return (
    <ScreenWrapper bg="#F8F9FB">
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={wp(5)} color="#374151" />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={s.headerActions}>
          {/* Toggle unread filter */}
          <TouchableOpacity
            style={[s.headerBtn, unreadOnly && s.headerBtnActive]}
            onPress={toggleUnreadFilter}
          >
            <Filter size={wp(4)} color={unreadOnly ? '#fff' : '#374151'} />
          </TouchableOpacity>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <TouchableOpacity style={s.headerBtn} onPress={markAllAsRead}>
              <CheckCheck size={wp(4)} color="#374151" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter pill */}
      {unreadOnly && (
        <View style={s.filterBar}>
          <View style={s.filterPill}>
            <Text style={s.filterPillText}>Unread only</Text>
            <TouchableOpacity onPress={toggleUnreadFilter} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.filterPillClose}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List */}
      {loading ? (
        <NotificationSkeleton count={8} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={notifications.length === 0 ? s.emptyContent : s.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#3F51B5"
              colors={['#3F51B5']}
            />
          }
          maxToRenderPerBatch={15}
          windowSize={10}
        />
      )}
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    gap: wp(3),
  },
  backBtn:        { width: wp(9), height: wp(9), borderRadius: wp(4.5), backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerCenter:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: wp(2) },
  headerTitle:    { fontSize: wp(5), fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  unreadBadge:    { backgroundColor: '#3F51B5', minWidth: wp(5.5), height: wp(5.5), borderRadius: wp(3), alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(1.5) },
  unreadBadgeText:{ color: '#fff', fontSize: wp(2.8), fontWeight: '700' },
  headerActions:  { flexDirection: 'row', gap: wp(2) },
  headerBtn:      { width: wp(9), height: wp(9), borderRadius: wp(4.5), backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerBtnActive:{ backgroundColor: '#3F51B5' },

  // Filter bar
  filterBar: { paddingHorizontal: wp(4), paddingVertical: hp(1), backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  filterPill:{ flexDirection: 'row', alignItems: 'center', gap: wp(2), backgroundColor: '#EEF2FF', paddingHorizontal: wp(3), paddingVertical: hp(0.6), borderRadius: wp(50), alignSelf: 'flex-start' },
  filterPillText:  { fontSize: wp(3.2), color: '#3F51B5', fontWeight: '600' },
  filterPillClose: { fontSize: wp(3), color: '#3F51B5', fontWeight: '700' },

  // List
  listContent:  { paddingBottom: hp(4) },
  emptyContent: { flexGrow: 1 },
  separator:    { height: StyleSheet.hairlineWidth, backgroundColor: '#F3F4F6', marginLeft: wp(4) + wp(12) + wp(3) },
  footerLoader: { paddingVertical: hp(2), alignItems: 'center' },

  // Error
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: hp(2), paddingTop: hp(10) },
  errorText: { fontSize: wp(3.8), color: '#374151', textAlign: 'center', paddingHorizontal: wp(8) },
  retryBtn:  { backgroundColor: '#3F51B5', paddingHorizontal: wp(6), paddingVertical: hp(1.2), borderRadius: wp(2) },
  retryText: { color: '#fff', fontWeight: '600', fontSize: wp(3.5) },
});