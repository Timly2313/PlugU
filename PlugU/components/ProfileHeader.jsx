import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ShieldCheck, Zap, MapPin, Globe, Star, CalendarDays, Settings, LogOut } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import { memberSince } from '../utilities/userProfileUtils';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_H = hp(20);
const AVATAR_S = wp(30);

export default function ProfileHeader({ profile, onAvatarPress, onBannerPress, onSettingsPress, onLogoutPress }) {
  const displayName = profile.display_name ?? profile.username ?? 'User';
  const initial = (profile.display_name?.[0] ?? profile.username?.[0] ?? 'U').toUpperCase();

  return (
    <View>
      {/* Banner with header buttons */}
      <TouchableOpacity
        activeOpacity={profile.cover_image_url ? 0.85 : 1}
        onPress={() => profile.cover_image_url && onBannerPress(profile.cover_image_url)}
        style={styles.bannerWrap}
      >
        {profile.cover_image_url ? (
          <Image source={{ uri: profile.cover_image_url }} style={styles.banner} resizeMode="cover" />
        ) : (
          <View style={styles.banner} />
        )}

        {/* Header action buttons */}
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onSettingsPress?.();
            }}
          >
            <Settings size={wp(4.5)} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onLogoutPress?.();
            }}
          >
            <LogOut size={wp(4.5)} color="white" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Profile Card - overlapping banner */}
      <View style={styles.profileCard}>
        {/* Avatar overlapping banner — tappable */}
        <TouchableOpacity
          style={styles.avatarWrap}
          activeOpacity={profile.avatar_url ? 0.85 : 1}
          onPress={() => profile.avatar_url && onAvatarPress(profile.avatar_url)}
        >
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Badges */}
        <View style={styles.badgesRow}>
          {profile.is_verified && (
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={wp(3)} color="#3F51B5" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
          {profile.is_premium && (
            <View style={styles.premiumBadge}>
              <Zap size={wp(3)} color="#F59E0B" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>

        <Text style={styles.displayName}>
          {displayName}
        </Text>
        {profile.username && (
          <Text style={styles.username}>@{profile.username}</Text>
        )}

        {/* Location and Website */}
        <View style={styles.metaWrap}>
          {profile.location ? (
            <View style={styles.metaItem}>
              <MapPin size={wp(3.5)} color="#9CA3AF" />
              <Text style={styles.metaText}>{profile.location}</Text>
            </View>
          ) : null}
          {profile.website ? (
            <View style={styles.metaItem}>
              <Globe size={wp(3.5)} color="#9CA3AF" />
              <Text style={[styles.metaText, styles.link]} numberOfLines={1}>{profile.website}</Text>
            </View>
          ) : null}
        </View>

        {profile.bio ? (
          <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
        ) : null}

        {/* Rating */}
        {profile.avg_rating > 0 && (
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={wp(3.5)}
                color="#F59E0B"
                fill={i <= Math.round(profile.avg_rating) ? '#F59E0B' : 'none'}
              />
            ))}
            <Text style={styles.ratingText}>
              {profile.avg_rating?.toFixed(1)} · {profile.total_reviews || 0} reviews
            </Text>
          </View>
        )}

        {/* Member since */}
        <View style={styles.memberBadge}>
            <Text style={styles.memberLabel}>Member since • </Text>
            <Text style={styles.memberDate}>{memberSince(profile.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    height: BANNER_H,
    position: "relative",
  },
  banner: {
    width: "100%",
    height: "100%",
    backgroundColor: "#3F51B5",
  },
  headerBtns: {
    position: "absolute",
    top: hp(1),
    right: wp(2),
    flexDirection: "row",
    gap: wp(2),
  },
  headerBtn: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: "rgba(95, 93, 93, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    backgroundColor: "white",
    marginHorizontal: wp(4),
    marginTop: hp(-4),
    borderRadius: wp(6),
    paddingHorizontal: wp(5),
    paddingTop: hp(4),
    paddingBottom: hp(2),
    alignItems: "center",
  },
  avatarWrap: {
    position: "absolute",
    top: hp(-6),
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    borderWidth: 4,
    borderColor: "white",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#3F51B5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "white",
    fontSize: wp(9),
    fontWeight: "800",
  },
  badgesRow: {
    flexDirection: "row",
    gap: wp(10),
    minHeight: hp(3),
    marginTop: hp(2),
    marginBottom:hp(.5)
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    backgroundColor: "#EEF2FF",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: wp(50),
  },
  verifiedText: {
    fontSize: wp(2.8),
    color: "#3F51B5",
    fontWeight: "600",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    backgroundColor: "#FFFBEB",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: wp(50),
  },
  premiumText: {
    fontSize: wp(2.8),
    color: "#F59E0B",
    fontWeight: "600",
  },
  displayName: {
    fontSize: wp(5.5),
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  username: {
    fontSize: wp(3.5),
    color: "#9CA3AF",
    marginTop: hp(0.3),
  },
  metaWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: wp(3),
    marginTop: hp(0.8),
    justifyContent: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
  },
  metaText: {
    fontSize: wp(3.3),
    color: "#9CA3AF",
  },
  link: {
    color: "#3F51B5",
  },
  bio: {
    fontSize: wp(3.5),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: hp(2.5),
    paddingHorizontal: wp(2),
    marginTop: hp(1),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    marginTop: hp(1.5),
    justifyContent: "center",
  },
  ratingText: {
    fontSize: wp(3.2),
    color: "#6B7280",
    marginLeft: wp(1),
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2.5),
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D0F5",
    borderRadius: wp(3),
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.5),
    marginTop: hp(1.5),
  },
  memberLabel: {
    fontSize: wp(3),
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    lineHeight: hp(1.6),
  },
  memberDate: {
    fontSize: wp(3.2),
    fontWeight: "700",
    color: "#3F51B5",
    lineHeight: hp(2),
  },
});