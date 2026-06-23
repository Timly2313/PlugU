import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper      from '../components/ScreenWrapper';
import Avatar             from '../components/Avatar';
import { profileService } from '../services/profileService';
import { StatusBar } from 'expo-status-bar';

export default function FollowListScreen() {
  const { userId, type, title } = useLocalSearchParams();

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!userId || !type) return;
    const fn = type === 'followers'
      ? profileService.getFollowers
      : profileService.getFollowing;

    fn(userId)
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, type]);

  const renderItem = useCallback(({ item }) => {
    const name    = item.display_name ?? item.username ?? 'User';
    return (
      <TouchableOpacity
        style={s.row}
        activeOpacity={0.75}
        onPress={() => router.push({ pathname: '/UserProfileScreen', params: { userId: item.id } })}
      >
        <Avatar uri={item.avatar_url} name={name} size={wp(13)} borderWidth={0} />
        <View style={s.info}>
          <Text style={s.name}>{name}</Text>
          {item.username && <Text style={s.username}>@{item.username}</Text>}
        </View>
        <View style={s.viewBtn}>
          <Text style={s.viewBtnText}>View</Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="auto" />
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={wp(5)} color="#374151" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{title ?? type}</Text>
        {users.length > 0 && (
          <View style={s.countPill}>
            <Text style={s.countText}>{users.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#3F51B5" />
        </View>
      ) : error ? (
        <View style={s.centered}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={users.length === 0 ? s.emptyContent : s.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyTitle}>
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </Text>
              <Text style={s.emptySub}>
                {type === 'followers'
                  ? 'When people follow this account they\'ll appear here'
                  : 'Accounts this user follows will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', gap: wp(3), paddingHorizontal: wp(4), paddingVertical: hp(1.5), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  backBtn:     { width: wp(9), height: wp(9), borderRadius: wp(4.5), backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: wp(4.5), fontWeight: '700', color: '#111827' },
  countPill:   { backgroundColor: '#EEF2FF', paddingHorizontal: wp(3), paddingVertical: hp(0.4), borderRadius: wp(50) },
  countText:   { fontSize: wp(3), color: '#3F51B5', fontWeight: '700' },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText:   { color: '#EF4444', fontSize: wp(3.8) },
  listContent: { paddingVertical: hp(1) },
  emptyContent:{ flexGrow: 1 },
  separator:   { height: StyleSheet.hairlineWidth, backgroundColor: '#F3F4F6', marginLeft: wp(4) + wp(13) + wp(3) },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(4), paddingVertical: hp(1.5), gap: wp(3) },
  info:        { flex: 1 },
  name:        { fontSize: wp(3.8), fontWeight: '700', color: '#111827' },
  username:    { fontSize: wp(3.2), color: '#9CA3AF', marginTop: hp(0.2) },
  viewBtn:     { paddingHorizontal: wp(4), paddingVertical: hp(0.8), borderRadius: wp(2), borderWidth: 1, borderColor: '#E5E7EB' },
  viewBtnText: { fontSize: wp(3.2), color: '#374151', fontWeight: '600' },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(10), paddingVertical: hp(10) },
  emptyTitle:  { fontSize: wp(4.2), fontWeight: '700', color: '#374151', marginBottom: hp(1), textAlign: 'center' },
  emptySub:    { fontSize: wp(3.4), color: '#9CA3AF', textAlign: 'center', lineHeight: hp(2.4) },
});