import React from 'react';
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { UserPlus, UserCheck, MessageCircle, Star, Edit3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';

export default function ProfileActionButtons({
  isOwnProfile,
  following,
  followLoading,
  onFollow,
  onMessage,
  starting,
  userId,
  totalReviews,
}) {
  if (isOwnProfile) {
    return (
      <View style={s.wrap}>
        <TouchableOpacity
          style={s.editBtn}
          onPress={() => router.push('/EditProfileScreen')}
        >
          <Edit3 size={wp(4)} color="#374151" />
          <Text style={s.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      {/* Follow */}
      <TouchableOpacity
        style={[s.followBtn, following && s.followingBtn]}
        onPress={onFollow}
        disabled={followLoading}
      >
        {followLoading ? (
          <ActivityIndicator size="small" color={following ? '#3F51B5' : '#fff'} />
        ) : following ? (
          <>
            <UserCheck size={wp(4)} color="#3F51B5" />
            <Text style={s.followingText}>Following</Text>
          </>
        ) : (
          <>
            <UserPlus size={wp(4)} color="#fff" />
            <Text style={s.followText}>Follow</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Message */}
      <TouchableOpacity style={s.iconBtn} onPress={onMessage} disabled={starting}>
        {starting
          ? <ActivityIndicator size="small" color="#3F51B5" />
          : <MessageCircle size={wp(5)} color="#3F51B5" />}
      </TouchableOpacity>

      {/* Reviews */}
      <TouchableOpacity
        style={s.iconBtn}
        onPress={() => router.push({ pathname: '/UserReviewsScreen', params: { userId } })}
      >
        <Star size={wp(5)} color="#F59E0B" fill="#F59E0B" />
        {totalReviews > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{totalReviews > 99 ? '99+' : totalReviews}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: wp(2.5),
    marginHorizontal: wp(4),
    marginBottom: hp(2),
  },
  followBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: wp(2),
    backgroundColor: '#3F51B5',
    paddingVertical: hp(1.5),
    borderRadius: wp(3),
    shadowColor: '#3F51B5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  followText:    { color: '#fff', fontWeight: '700', fontSize: wp(3.8) },
  followingBtn:  { backgroundColor: '#EEF2FF', shadowColor: 'transparent', elevation: 0 },
  followingText: { color: '#3F51B5', fontWeight: '700', fontSize: wp(3.8) },
  editBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: wp(2),
    backgroundColor: '#fff',
    paddingVertical: hp(1.5),
    borderRadius: wp(3),
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  editText: { color: '#374151', fontWeight: '600', fontSize: wp(3.8) },
  iconBtn: {
    width: wp(12), height: wp(12),
    borderRadius: wp(3),
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  badge: {
    position: 'absolute', top: -wp(1.5), right: -wp(1.5),
    backgroundColor: '#F59E0B',
    minWidth: wp(4.5), height: wp(4.5),
    borderRadius: wp(2.5),
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: wp(1),
  },
  badgeText: { color: '#fff', fontSize: wp(2.2), fontWeight: '800' },
});