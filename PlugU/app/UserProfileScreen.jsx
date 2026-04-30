import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import {
  ArrowLeft,
  Star,
  MapPin,
  Package,
  UserPlus,
  UserCheck,
  Grid3x3,
  Globe,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/authContext";
import { hp, wp } from "../utilities/dimensions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function memberSince(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { profile: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // ── Full-screen image viewer ──
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUri, setImageViewerUri] = useState(null);
  const imageViewerAnim = useRef(new Animated.Value(0)).current;

  const openImageViewer = (uri) => {
    if (!uri) return;
    setImageViewerUri(uri);
    setImageViewerVisible(true);
    Animated.timing(imageViewerAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeImageViewer = () => {
    Animated.timing(imageViewerAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setImageViewerVisible(false);
      setImageViewerUri(null);
    });
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .rpc("get_user_profile_with_stats", { p_user_id: userId });

      if (profileError) throw profileError;

      if (profileData && profileData.length > 0) {
        const p = profileData[0];
        setProfile(p);
        setFollowing(p.is_following ?? false);
        setFollowerCount(p.follower_count ?? 0);
      }

      const { data: listingData } = await supabase
        .from("listings")
        .select("id, title, price, location, images, category, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      setListings(listingData || []);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      console.error("Profile load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser?.id || followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", userId);
        setFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        await supabase.from("follows").insert({
          follower_id: currentUser.id,
          following_id: userId,
        });
        setFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleViewListing = (listingId) => {
    router.push({ pathname: "/ListingDetailsScreen", params: { listingId } });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3F51B5" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.notFoundText}>User not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarInitial = (profile.username?.[0] ?? "U").toUpperCase();
  const displayName = profile.display_name ?? profile.username ?? "User";

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Floating back button */}
      <TouchableOpacity style={styles.floatingBack} onPress={() => router.back()}>
        <ArrowLeft size={wp(5)} color="white" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Banner ── */}
        <TouchableOpacity
          activeOpacity={profile.cover_image_url ? 0.85 : 1}
          onPress={() => openImageViewer(profile.cover_image_url)}
          style={styles.bannerWrap}
        >
          {profile.cover_image_url ? (
            <Image
              source={{ uri: profile.cover_image_url }}
              style={styles.banner}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bannerFallback} />
          )}
        </TouchableOpacity>

        {/* ── Profile card ── */}
        <Animated.View
          style={[
            styles.profileCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Avatar — tappable */}
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={profile.avatar_url ? 0.85 : 1}
            onPress={() => openImageViewer(profile.avatar_url)}
          >
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{avatarInitial}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Badges row */}
          <View style={styles.badgesRow}>
            {profile.is_verified && (
              <View style={styles.badge}>
                <ShieldCheck size={wp(3)} color="#3F51B5" />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
            {profile.is_premium && (
              <View style={[styles.badge, styles.premiumBadge]}>
                <Zap size={wp(3)} color="#F59E0B" />
                <Text style={[styles.badgeText, styles.premiumBadgeText]}>Premium</Text>
              </View>
            )}
          </View>

          {/* Name */}
          <Text style={styles.displayName}>{displayName}</Text>
          {profile.username && (
            <Text style={styles.username}>@{profile.username}</Text>
          )}

          {/* Location */}
          {profile.location ? (
            <View style={styles.metaRow}>
              <MapPin size={wp(3.5)} color="#9CA3AF" />
              <Text style={styles.metaText}>{profile.location}</Text>
            </View>
          ) : null}

          {/* Website */}
          {profile.website ? (
            <View style={styles.metaRow}>
              <Globe size={wp(3.5)} color="#9CA3AF" />
              <Text style={[styles.metaText, styles.websiteText]} numberOfLines={1}>
                {profile.website}
              </Text>
            </View>
          ) : null}

          {/* Bio */}
          {profile.bio ? (
            <Text style={styles.bio} numberOfLines={3}>
              {profile.bio}
            </Text>
          ) : null}

          {/* Rating */}
          {profile.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={wp(4)}
                  color="#F59E0B"
                  fill={s <= Math.round(profile.avg_rating) ? "#F59E0B" : "none"}
                />
              ))}
              <Text style={styles.ratingText}>
                {profile.avg_rating} ({profile.total_reviews} reviews)
              </Text>
            </View>
          )}

          {/* ── Stats ── */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatCount(profile.listing_count ?? listings.length)}</Text>
              <Text style={styles.statLabel}>Listings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatCount(followerCount)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatCount(profile.following_count ?? 0)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatCount(profile.post_count ?? 0)}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* ── Actions ── */}
          <View style={styles.actionsRow}>
            {isOwnProfile ? (
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.followBtn, following && styles.followingBtn]}
                onPress={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={following ? "#3F51B5" : "white"}
                  />
                ) : following ? (
                  <>
                    <UserCheck size={wp(4)} color="#3F51B5" />
                    <Text style={styles.followingBtnText}>Following</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={wp(4)} color="white" />
                    <Text style={styles.followBtnText}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Member since + last active */}
          <View style={styles.footerMeta}>
            <View style={styles.memberRow}>
              <Star size={wp(3)} color="#3F51B5" fill="#3F51B5" />
              <Text style={styles.memberText}>
                Member since {memberSince(profile.created_at)}
              </Text>
            </View>
            {profile.last_active_at && (
              <Text style={styles.lastActive}>
                Last active {memberSince(profile.last_active_at)}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* ── Listings ── */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.listingsHeader}>
            <Grid3x3 size={wp(4.5)} color="#111827" />
            <Text style={styles.listingsTitle}>Listings</Text>
            {listings.length > 0 && (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{listings.length}</Text>
              </View>
            )}
          </View>

          {listings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Package size={wp(12)} color="#C7D2FE" />
              </View>
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptySubtitle}>
                {isOwnProfile
                  ? "Post your first listing to get started"
                  : "This user hasn't posted any listings"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={listings}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => {
                const imageUri = Array.isArray(item.images)
                  ? item.images[0]
                  : typeof item.images === "object" && item.images !== null
                  ? Object.values(item.images)[0]
                  : null;

                return (
                  <TouchableOpacity
                    style={styles.listingCard}
                    activeOpacity={0.88}
                    onPress={() => handleViewListing(item.id)}
                  >
                    <View style={styles.listingImageWrap}>
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.listingImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.listingImageFallback}>
                          <Package size={wp(7)} color="#D1D5DB" />
                        </View>
                      )}
                      <View style={styles.statusPill}>
                        <View
                          style={[
                            styles.statusDot,
                            item.status === "active" && styles.dotActive,
                            item.status === "sold" && styles.dotSold,
                            item.status === "reserved" && styles.dotReserved,
                          ]}
                        />
                        <Text style={styles.statusText}>{item.status}</Text>
                      </View>
                    </View>
                    <View style={styles.listingInfo}>
                      <Text style={styles.listingTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.listingPrice}>
                        R{Number(item.price).toLocaleString()}
                      </Text>
                      {item.location ? (
                        <View style={styles.listingLocationRow}>
                          <MapPin size={wp(2.8)} color="#9CA3AF" />
                          <Text style={styles.listingLocation} numberOfLines={1}>
                            {item.location}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </Animated.View>

        <View style={{ height: hp(6) }} />
      </ScrollView>

      {/* ── Full-Screen Image Viewer ── */}
      <Modal
        visible={imageViewerVisible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeImageViewer}
      >
        <Animated.View
          style={[styles.imageViewerOverlay, { opacity: imageViewerAnim }]}
        >
          {/* Close button */}
          <TouchableOpacity style={styles.imageViewerClose} onPress={closeImageViewer}>
            <X size={wp(5.5)} color="white" />
          </TouchableOpacity>

          {/* Tap anywhere to dismiss */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.imageViewerImgWrap}
            onPress={closeImageViewer}
          >
            {imageViewerUri && (
              <Image
                source={{ uri: imageViewerUri }}
                style={styles.imageViewerImg}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: hp(2),
    backgroundColor: "#F8F9FB",
  },
  notFoundText: {
    fontSize: wp(4),
    color: "#6B7280",
  },
  backBtn: {
    backgroundColor: "#3F51B5",
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: wp(50),
  },
  backBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: wp(3.5),
  },
  floatingBack: {
    position: "absolute",
    top: hp(5),
    left: wp(4),
    zIndex: 10,
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerWrap: {
    height: hp(24),
  },
  banner: {
    width: "100%",
    height: "100%",
  },
  bannerFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#3F51B5",
  },
  profileCard: {
    backgroundColor: "white",
    marginHorizontal: wp(4),
    marginTop: hp(-5),
    borderRadius: wp(6),
    paddingHorizontal: wp(5),
    paddingTop: hp(5),
    paddingBottom: hp(2.5),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  avatarWrap: {
    position: "absolute",
    top: hp(-7),
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    borderWidth: 4,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
  avatar: {
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
    fontWeight: "700",
  },
  badgesRow: {
    flexDirection: "row",
    gap: wp(2),
    marginBottom: hp(0.5),
    minHeight: hp(3),
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    backgroundColor: "#EEF2FF",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: wp(50),
  },
  badgeText: {
    fontSize: wp(2.8),
    color: "#3F51B5",
    fontWeight: "600",
  },
  premiumBadge: {
    backgroundColor: "#FFFBEB",
  },
  premiumBadgeText: {
    color: "#F59E0B",
  },
  displayName: {
    fontSize: wp(5.5),
    fontWeight: "800",
    color: "#111827",
    marginTop: hp(0.5),
    textAlign: "center",
  },
  username: {
    fontSize: wp(3.5),
    color: "#9CA3AF",
    marginTop: hp(0.3),
    marginBottom: hp(0.8),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    marginBottom: hp(0.5),
  },
  metaText: {
    fontSize: wp(3.3),
    color: "#9CA3AF",
  },
  websiteText: {
    color: "#3F51B5",
  },
  bio: {
    fontSize: wp(3.5),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: hp(2.5),
    paddingHorizontal: wp(2),
    marginTop: hp(1),
    marginBottom: hp(0.5),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    marginTop: hp(1),
    marginBottom: hp(0.5),
  },
  ratingText: {
    fontSize: wp(3.2),
    color: "#6B7280",
    marginLeft: wp(1),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    marginVertical: hp(1.5),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: hp(0.3),
  },
  statDivider: {
    width: 1,
    height: hp(4),
    backgroundColor: "#F3F4F6",
  },
  statNumber: {
    fontSize: wp(4.5),
    fontWeight: "800",
    color: "#111827",
  },
  statLabel: {
    fontSize: wp(2.8),
    color: "#9CA3AF",
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    gap: wp(3),
    marginBottom: hp(1.5),
    width: "100%",
  },
  followBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
    backgroundColor: "#3F51B5",
    paddingVertical: hp(1.5),
    borderRadius: wp(50),
  },
  followBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: wp(3.8),
  },
  followingBtn: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#3F51B5",
  },
  followingBtnText: {
    color: "#3F51B5",
    fontWeight: "700",
    fontSize: wp(3.8),
  },
  editBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingVertical: hp(1.5),
    borderRadius: wp(50),
  },
  editBtnText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: wp(3.8),
  },
  footerMeta: {
    alignItems: "center",
    gap: hp(0.5),
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
  },
  memberText: {
    fontSize: wp(3),
    color: "#9CA3AF",
  },
  lastActive: {
    fontSize: wp(2.8),
    color: "#D1D5DB",
  },
  listingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
    paddingBottom: hp(1.5),
  },
  listingsTitle: {
    fontSize: wp(4.5),
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  countPill: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.4),
    borderRadius: wp(50),
  },
  countPillText: {
    fontSize: wp(3),
    color: "#3F51B5",
    fontWeight: "700",
  },
  grid: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  gridRow: {
    gap: wp(3),
    marginBottom: hp(1.5),
  },
  listingCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: wp(4),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  listingImageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  listingImage: {
    width: "100%",
    height: "100%",
  },
  listingImageFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  statusPill: {
    position: "absolute",
    top: wp(2),
    left: wp(2),
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.4),
    borderRadius: wp(50),
  },
  statusDot: {
    width: wp(1.8),
    height: wp(1.8),
    borderRadius: wp(1),
    backgroundColor: "#D1D5DB",
  },
  dotActive: {
    backgroundColor: "#10B981",
  },
  dotSold: {
    backgroundColor: "#6B7280",
  },
  dotReserved: {
    backgroundColor: "#F59E0B",
  },
  statusText: {
    fontSize: wp(2.5),
    color: "#374151",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  listingInfo: {
    padding: wp(3),
    gap: hp(0.4),
  },
  listingTitle: {
    fontSize: wp(3.5),
    fontWeight: "600",
    color: "#111827",
  },
  listingPrice: {
    fontSize: wp(4),
    fontWeight: "800",
    color: "#3F51B5",
  },
  listingLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
  },
  listingLocation: {
    fontSize: wp(3),
    color: "#9CA3AF",
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(6),
    paddingHorizontal: wp(10),
  },
  emptyIconWrap: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
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
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: wp(3.5),
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: hp(2.5),
  },

  // ── Image viewer ──
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerClose: {
    position: "absolute",
    top: hp(6),
    right: wp(5),
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  imageViewerImgWrap: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  imageViewerImg: {
    width: "100%",
    height: "100%",
  },
});