import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  Animated, StyleSheet,
} from 'react-native';
import { ShieldCheck, Zap, MapPin, Edit, Heart, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import { formatCount } from '../utilities/profileUtils';

export default function ProfileCard({
  profile, stats, fadeAnim, slideAnim, onAvatarPress,
}) {
  const displayName   = profile?.display_name ?? profile?.username ?? 'User';
  const avatarInitial = (profile?.display_name?.[0] ?? profile?.username?.[0] ?? 'U').toUpperCase();
  const followerCount = stats?.follower_count  ?? 0;
  const followingCount= stats?.following_count ?? 0;

  return (
    <Animated.View
      style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Avatar */}
      <TouchableOpacity
        style={s.avatarWrap}
        activeOpacity={profile?.avatar_url ? 0.85 : 1}
        onPress={() => profile?.avatar_url && onAvatarPress(profile.avatar_url)}
      >
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
        ) : (
          <View style={s.avatarFallback}>
            <Text style={s.avatarInitial}>{avatarInitial}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Badges */}
      {(profile?.is_verified || profile?.is_premium) && (
        <View style={s.badges}>
          {profile?.is_verified && (
            <View style={s.badge}>
              <ShieldCheck size={wp(3)} color="#3F51B5" />
              <Text style={s.badgeText}>Verified</Text>
            </View>
          )}
          {profile?.is_premium && (
            <View style={[s.badge, s.premiumBadge]}>
              <Zap size={wp(3)} color="#F59E0B" />
              <Text style={[s.badgeText, s.premiumText]}>Premium</Text>
            </View>
          )}
        </View>
      )}

      {/* Name */}
      <Text style={s.name}>{displayName}</Text>
      {profile?.username && <Text style={s.username}>@{profile.username}</Text>}

      {/* Member since */}
      {profile?.created_at && (
        <Text style={s.member}>
          Member since {new Date(profile.created_at).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
        </Text>
      )}

      {/* Location */}
      {profile?.location && (
        <View style={s.locationRow}>
          <MapPin size={wp(3.2)} color="#9CA3AF" />
          <Text style={s.locationText}>{profile.location}</Text>
        </View>
      )}

      {/* Bio */}
      {profile?.bio && (
        <Text style={s.bio} numberOfLines={2}>{profile.bio}</Text>
      )}

      {/* ── Action buttons ── */}
      <View style={s.actions}>
        <TouchableOpacity
          style={s.editBtn}
          onPress={() => router.push('/EditProfileScreen')}
        >
          <Edit size={wp(3.8)} color="#fff" />
          <Text style={s.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.savedBtn}
          onPress={() => router.push('/SavedListingsScreen')}
        >
          <Heart size={wp(3.8)} color="#3F51B5" />
          <Text style={s.savedBtnText}>Saved</Text>
        </TouchableOpacity>
      </View>

      {/* ── Followers / Following row ── */}
      <View style={s.followRow}>
        <TouchableOpacity
          style={s.followItem}
          onPress={() => router.push({
            pathname: '/FollowListScreen',
            params: { userId: profile?.id, type: 'followers', title: 'Followers' },
          })}
        >
          <Text style={s.followCount}>{formatCount(followerCount)}</Text>
          <Text style={s.followLabel}>Followers</Text>
        </TouchableOpacity>

        <View style={s.followDivider} />

        <TouchableOpacity
          style={s.followItem}
          onPress={() => router.push({
            pathname: '/FollowListScreen',
            params: { userId: profile?.id, type: 'following', title: 'Following' },
          })}
        >
          <Text style={s.followCount}>{formatCount(followingCount)}</Text>
          <Text style={s.followLabel}>Following</Text>
        </TouchableOpacity>
      </View>

    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    marginTop: hp(-4.5),
    borderRadius: wp(6),
    paddingHorizontal: wp(5),
    paddingTop: hp(5),
    paddingBottom: hp(2.5),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarWrap: {
    position: 'absolute', top: hp(-6),
    width: wp(28), height: wp(28), borderRadius: wp(14),
    borderWidth: 4, borderColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  avatar:        { width: '100%', height: '100%' },
  avatarFallback:{ width: '100%', height: '100%', backgroundColor: '#3F51B5', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: wp(9), fontWeight: '800' },
  badges:        { flexDirection: 'row', gap: wp(2), marginBottom: hp(0.5) },
  badge:         { flexDirection: 'row', alignItems: 'center', gap: wp(1), backgroundColor: '#EEF2FF', paddingHorizontal: wp(2.5), paddingVertical: hp(0.4), borderRadius: wp(50) },
  badgeText:     { fontSize: wp(2.8), color: '#3F51B5', fontWeight: '600' },
  premiumBadge:  { backgroundColor: '#FFFBEB' },
  premiumText:   { color: '#F59E0B' },
  name:          { fontSize: wp(5.5), fontWeight: '800', color: '#111827', textAlign: 'center', letterSpacing: -0.3 },
  username:      { fontSize: wp(3.3), color: '#9CA3AF', marginTop: hp(0.3) },
  member:        { fontSize: wp(3), color: '#9CA3AF', marginTop: hp(0.4) },
  locationRow:   { flexDirection: 'row', alignItems: 'center', gap: wp(1), marginTop: hp(0.8) },
  locationText:  { fontSize: wp(3.2), color: '#9CA3AF' },
  bio:           { fontSize: wp(3.4), color: '#6B7280', textAlign: 'center', lineHeight: hp(2.5), paddingHorizontal: wp(2), marginTop: hp(1) },

  // Follow row
  followRow:     { flexDirection: 'row', alignItems: 'center', marginTop: hp(1), marginBottom: hp(1.5), width: '100%', justifyContent: 'center' },
  followItem:    { alignItems: 'center', paddingHorizontal: wp(8) },
  followCount:   { fontSize: wp(5), fontWeight: '800', color: '#111827' },
  followLabel:   { fontSize: wp(3), color: '#9CA3AF', marginTop: hp(0.2) },
  followDivider: { width: 1, height: hp(4), backgroundColor: '#E5E7EB' },

  // Action buttons — smaller to match screenshot
  actions:       { flexDirection: 'row', gap: wp(2.5), width: wp(60) ,marginTop: hp(2)},
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: wp(1.5), backgroundColor: '#3F51B5',
    paddingVertical: hp(0.8), borderRadius: wp(50),paddingHorizontal:wp(0.5)

  },
  editBtnText:   { color: '#fff', fontWeight: '700', fontSize: wp(3.4) },
  savedBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: wp(1.5), backgroundColor: '#fff',
    paddingVertical: hp(0.8), borderRadius: wp(50),
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  savedBtnText: { color: '#3F51B5', fontWeight: '700', fontSize: wp(3.4) },
});