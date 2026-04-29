import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import {
  LogOut,
  TrendingUp,
  DollarSign,
  Eye,
  Package,
  Settings,
  Edit,
  Heart,
  MoreVertical,
  Trash2,
  Pencil,
  MapPin,
  ShieldCheck,
  Zap,
  Star,
  ChevronRight,
  PlusCircle,
} from "lucide-react-native";
import { hp, wp } from "../../utilities/dimensions";
import ScreenWrapper from "../../components/ScreenWrapper";
import { useAuth } from "../../context/authContext";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../../lib/supabase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatCount(n) {
  if (!n && n !== 0) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

const STATUS_CONFIG = {
  active:       { label: "Active",       color: "#10B981", bg: "#ECFDF5" },
  sold:         { label: "Sold",         color: "#6B7280", bg: "#F3F4F6" },
  reserved:     { label: "Reserved",     color: "#F59E0B", bg: "#FFFBEB" },
  hidden:       { label: "Hidden",       color: "#EF4444", bg: "#FEF2F2" },
  under_review: { label: "Under Review", color: "#8B5CF6", bg: "#F5F3FF" },
  deleted:      { label: "Deleted",      color: "#6B7280", bg: "#F3F4F6" },
};

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();

  const [stats, setStats] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch profile stats via RPC
      const { data: statsData } = await supabase
        .rpc("get_user_profile_with_stats", { p_user_id: profile.id });

      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Fetch own listings (all statuses)
      const { data: listingData } = await supabase
        .from("listings")
        .select("id, title, price, location, images, category, status, view_count, like_count")
        .eq("user_id", profile.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

      setUserListings(listingData || []);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = () => {
    setActionModalVisible(false);
    Alert.alert(
      "Delete Listing",
      `Delete "${selectedListing?.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const listing = selectedListing;
            setUserListings((prev) => prev.filter((l) => l.id !== listing.id));
            const { error } = await supabase
              .from("listings")
              .delete()
              .eq("id", listing.id);
            if (error) {
              setUserListings((prev) => [listing, ...prev]);
              Alert.alert("Error", "Failed to delete listing");
            }
          },
        },
      ]
    );
  };

  const updateListingStatus = async (newStatus) => {
    if (!selectedListing) return;
    setUserListings((prev) =>
      prev.map((l) => (l.id === selectedListing.id ? { ...l, status: newStatus } : l))
    );
    setStatusModalVisible(false);
    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", selectedListing.id);
    if (error) {
      Alert.alert("Error", "Failed to update status");
      loadData();
    }
  };

  const onLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/LoginScreen");
        },
      },
    ]);
  };

  const statCards = [
    {
      label: "Listings",
      value: formatCount(stats?.listing_count ?? userListings.length),
      icon: Package,
      onPress: null,
      color: "#3F51B5",
      bg: "#EEF2FF",
    },
    {
      label: "Sold",
      value: formatCount(userListings.filter((l) => l.status === "sold").length),
      icon: DollarSign,
      onPress: null,
      color: "#3F51B5",
      bg: "#EEF2FF",
    },
    {
      label: "Views",
      value: formatCount(stats?.post_count ?? 0),
      icon: Eye,
      onPress: () => router.push("/AnalyticsScreen"),
      color: "#3F51B5",
      bg: "#EEF2FF",
    },
    {
      label: "Rating",
      value: stats?.avg_rating ? stats.avg_rating.toFixed(1) : "—",
      icon: Star,
      onPress: () => router.push("/ReviewsScreen"),
      color: "#3F51B5",
      bg: "#EEF2FF",
    },
  ];

  const imageUri = (item) => {
    if (!item.images) return null;
    if (Array.isArray(item.images)) return item.images[0] ?? null;
    if (typeof item.images === "object") return Object.values(item.images)[0] ?? null;
    return null;
  };

  const avatarInitial = (profile?.display_name?.[0] ?? profile?.username?.[0] ?? "U").toUpperCase();

  return (
    <ScreenWrapper bg="#F8F9FB">
      <StatusBar style="auto" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(12) }}
      >
        {/* ── Banner ── */}
        <View style={styles.bannerWrap}>
          {profile?.cover_image_url ? (
            <Image source={{ uri: profile.cover_image_url }} style={styles.banner} resizeMode="cover" />
          ) : (
            <View style={styles.banner} />
          )}

          {/* Header action buttons */}
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/SettingsScreen")}>
              <Settings size={wp(4.5)} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={onLogout}>
              <LogOut size={wp(4.5)} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Profile card ── */}
        <Animated.View
          style={[
            styles.profileCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Avatar overlapping banner */}
          <View style={styles.avatarWrap}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{avatarInitial}</Text>
              </View>
            )}
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            {profile?.is_verified && (
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={wp(3)} color="#3F51B5" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
            {profile?.is_premium && (
              <View style={styles.premiumBadge}>
                <Zap size={wp(3)} color="#F59E0B" />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>

          <Text style={styles.displayName}>
            {profile?.display_name ?? profile?.username ?? "User"}
          </Text>
          {profile?.username && (
            <Text style={styles.username}>@{profile.username}</Text>
          )}

          {profile?.location ? (
            <View style={styles.locationRow}>
              <MapPin size={wp(3.5)} color="#9CA3AF" />
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          ) : null}

          {profile?.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
          ) : null}

          {/* Action buttons */}
          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => router.push("/EditProfileScreen")}
            >
              <Edit size={wp(4)} color="white" />
              <Text style={styles.actionBtnPrimaryText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => router.push("/SavedListingsScreen")}
            >
              <Heart size={wp(4)} color="#3F51B5" />
              <Text style={styles.actionBtnSecondaryText}>Saved</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Stats ── */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <TouchableOpacity
                key={s.label}
                style={[styles.statCard, { backgroundColor: s.bg }]}
                onPress={s.onPress}
                disabled={!s.onPress}
                activeOpacity={s.onPress ? 0.75 : 1}
              >
                <View style={[styles.statIconWrap, { backgroundColor: s.color + "20" }]}>
                  <Icon size={wp(4)} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
                {s.onPress && (
                  <ChevronRight size={wp(3)} color={s.color} style={styles.statChevron} />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ── My Listings ── */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.listingsHeader}>
            <Text style={styles.listingsTitle}>My Listings</Text>
            <TouchableOpacity
              style={styles.newListingBtn}
              onPress={() => router.push("/CreateListingScreen")}
            >
              <PlusCircle size={wp(4)} color="#3F51B5" />
              <Text style={styles.newListingText}>New</Text>
            </TouchableOpacity>
          </View>

          {!loading && userListings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Package size={wp(12)} color="#C7D2FE" />
              </View>
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "New" to post your first listing
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/CreateListingScreen")}
              >
                <Text style={styles.emptyBtnText}>Create Listing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={userListings}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => {
                const uri = imageUri(item);
                const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.active;

                return (
                  <View style={styles.listingCard}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push({
                          pathname: "/ListingDetailsScreen",
                          params: { listingId: item.id },
                        })
                      }
                    >
                      <View style={styles.listingImgWrap}>
                        {uri ? (
                          <Image source={{ uri }} style={styles.listingImg} resizeMode="cover" />
                        ) : (
                          <View style={styles.listingImgFallback}>
                            <Package size={wp(8)} color="#D1D5DB" />
                          </View>
                        )}

                        {/* Status pill */}
                        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                          <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
                          <Text style={[styles.statusPillText, { color: sc.color }]}>
                            {sc.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.listingInfo}>
                        <Text style={styles.listingTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.listingPrice}>
                          R{Number(item.price).toLocaleString()}
                        </Text>
                        <View style={styles.listingMeta}>
                          <Eye size={wp(3)} color="#9CA3AF" />
                          <Text style={styles.listingMetaText}>{item.view_count ?? 0}</Text>
                          <Heart size={wp(3)} color="#9CA3AF" />
                          <Text style={styles.listingMetaText}>{item.like_count ?? 0}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Three-dot menu */}
                    <TouchableOpacity
                      style={styles.dotsBtn}
                      onPress={() => {
                        setSelectedListing(item);
                        setActionModalVisible(true);
                      }}
                    >
                      <MoreVertical size={wp(4)} color="white" />
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Action Modal ── */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActionModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle} numberOfLines={1}>
              {selectedListing?.title}
            </Text>

            {/* Status pill preview */}
            {selectedListing && (
              <View style={styles.sheetStatusRow}>
                <View
                  style={[
                    styles.sheetStatusPill,
                    {
                      backgroundColor:
                        (STATUS_CONFIG[selectedListing.status] ?? STATUS_CONFIG.active).bg,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: (STATUS_CONFIG[selectedListing.status] ?? STATUS_CONFIG.active).color,
                      fontSize: wp(3),
                      fontWeight: "600",
                    }}
                  >
                    {(STATUS_CONFIG[selectedListing.status] ?? STATUS_CONFIG.active).label}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setActionModalVisible(false);
                router.push({
                  pathname: "/CreateListingScreen",
                  params: { listingId: selectedListing?.id },
                });
              }}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: "#EEF2FF" }]}>
                <Pencil size={wp(4)} color="#3F51B5" />
              </View>
              <Text style={styles.sheetOptionText}>Edit Listing</Text>
              <ChevronRight size={wp(4)} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setActionModalVisible(false);
                setStatusModalVisible(true);
              }}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: "#ECFDF5" }]}>
                <Settings size={wp(4)} color="#10B981" />
              </View>
              <Text style={styles.sheetOptionText}>Change Status</Text>
              <ChevronRight size={wp(4)} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetOption, styles.deleteOption]}
              onPress={handleDeleteListing}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: "#FEF2F2" }]}>
                <Trash2 size={wp(4)} color="#EF4444" />
              </View>
              <Text style={[styles.sheetOptionText, { color: "#EF4444" }]}>
                Delete Listing
              </Text>
              <ChevronRight size={wp(4)} color="#FCA5A5" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setActionModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Status Modal ── */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Change Status</Text>
            <Text style={styles.sheetSubtitle} numberOfLines={1}>
              {selectedListing?.title}
            </Text>

            {Object.entries(STATUS_CONFIG)
              .filter(([key]) => key !== "deleted")
              .map(([key, cfg]) => {
                const isCurrent = selectedListing?.status === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.statusOption,
                      isCurrent && { borderColor: cfg.color, backgroundColor: cfg.bg },
                    ]}
                    onPress={() => updateListingStatus(key)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                    <Text
                      style={[
                        styles.statusOptionText,
                        isCurrent && { color: cfg.color, fontWeight: "700" },
                      ]}
                    >
                      {cfg.label}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.currentPill, { backgroundColor: cfg.color }]}>
                        <Text style={styles.currentPillText}>Current</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    height: hp(20),
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
    gap: wp(2),
    minHeight: hp(3),
    marginBottom: hp(0.5),
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    marginTop: hp(0.8),
  },
  locationText: {
    fontSize: wp(3.3),
    color: "#9CA3AF",
  },
  bio: {
    fontSize: wp(3.5),
    color: "#6B7280",
    textAlign: "center",
    lineHeight: hp(2.5),
    paddingHorizontal: wp(2),
    marginTop: hp(1),
  },
  actionBtns: {
    flexDirection: "row",
    gap: wp(3),
    marginTop: hp(2),
    width: "100%",
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
    backgroundColor: "#3F51B5",
    paddingVertical: hp(0),
    borderRadius: wp(50),
  },
  actionBtnPrimaryText: {
    color: "white",
    fontWeight: "700",
    fontSize: wp(3.8),
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
    backgroundColor: "white",
    paddingVertical: hp(1.4),
    borderRadius: wp(50),
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  actionBtnSecondaryText: {
    color: "#3F51B5",
    fontWeight: "700",
    fontSize: wp(3.8),
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: wp(4),
    gap: wp(2),
    marginTop: hp(2),
   
  },
  statCard: {
    flex: 1,
    borderRadius: wp(4),
    padding: wp(2),
    alignItems: "center",
    gap: hp(0.4),
    position: "relative",
  },
  statIconWrap: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: hp(0.3),
  },
  statValue: {
    fontSize: wp(4.5),
    fontWeight: "800",
  },
  statLabel: {
    fontSize: wp(2.8),
    color: "#6B7280",
    fontWeight: "500",
  },
  statChevron: {
    position: "absolute",
    top: wp(2),
    right: wp(2),
  },
  listingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
  },
  listingsTitle: {
    fontSize: wp(4.5),
    fontWeight: "800",
    color: "#111827",
  },
  newListingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
    backgroundColor: "#EEF2FF",
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.8),
    borderRadius: wp(50),
  },
  newListingText: {
    color: "#3F51B5",
    fontWeight: "700",
    fontSize: wp(3.5),
  },
  grid: {
    paddingHorizontal: wp(4),
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
    position: "relative",
  },
  listingImgWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
  },
  listingImg: {
    width: "100%",
    height: "100%",
  },
  listingImgFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  statusPill: {
    position: "absolute",
    bottom: wp(2),
    left: wp(2),
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.4),
    borderRadius: wp(50),
  },
  statusDot: {
    width: wp(1.8),
    height: wp(1.8),
    borderRadius: wp(1),
  },
  statusPillText: {
    fontSize: wp(2.5),
    fontWeight: "600",
  },
  dotsBtn: {
    position: "absolute",
    top: wp(2),
    right: wp(2),
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  listingInfo: {
    padding: wp(3),
    gap: hp(0.3),
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
  listingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
    marginTop: hp(0.3),
  },
  listingMetaText: {
    fontSize: wp(2.8),
    color: "#9CA3AF",
  },
  emptyState: {
    alignItems: "center",
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
  },
  emptySubtitle: {
    fontSize: wp(3.5),
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: hp(2.5),
    marginBottom: hp(2),
  },
  emptyBtn: {
    backgroundColor: "#3F51B5",
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: wp(50),
  },
  emptyBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: wp(3.8),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: wp(7),
    borderTopRightRadius: wp(7),
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
    paddingTop: hp(1.5),
  },
  sheetHandle: {
    width: wp(10),
    height: hp(0.5),
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: hp(2),
  },
  sheetTitle: {
    fontSize: wp(4.5),
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: hp(0.5),
  },
  sheetSubtitle: {
    fontSize: wp(3.5),
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: hp(1.5),
  },
  sheetStatusRow: {
    alignItems: "center",
    marginBottom: hp(1.5),
  },
  sheetStatusPill: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.6),
    borderRadius: wp(50),
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
    gap: wp(3),
  },
  sheetOptionIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(3),
    alignItems: "center",
    justifyContent: "center",
  },
  sheetOptionText: {
    fontSize: wp(4),
    color: "#111827",
    fontWeight: "500",
    flex: 1,
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
    marginBottom: hp(0.8),
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    gap: wp(3),
  },
  statusOptionText: {
    fontSize: wp(3.8),
    color: "#374151",
    flex: 1,
    fontWeight: "500",
  },
  currentPill: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.3),
    borderRadius: wp(50),
  },
  currentPillText: {
    color: "white",
    fontSize: wp(2.5),
    fontWeight: "600",
  },
  cancelBtn: {
    marginTop: hp(1.5),
    paddingVertical: hp(1.8),
    alignItems: "center",
    borderRadius: wp(3),
    backgroundColor: "#F9FAFB",
  },
  cancelBtnText: {
    fontSize: wp(4),
    color: "#6B7280",
    fontWeight: "600",
  },
});