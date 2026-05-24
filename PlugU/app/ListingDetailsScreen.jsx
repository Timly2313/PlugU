import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
  Share,
  Alert,
  Platform,
} from "react-native";
import {
  ArrowLeft,
  MapPin,
  Bookmark,
  Share2,
  MessageCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  Heart,
  Tag,
  Calendar,
  ShieldCheck,
  CheckCircle,
} from "lucide-react-native";
import { hp, wp } from "../utilities/dimensions";
import ScreenWrapper from "../components/ScreenWrapper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/authContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Edge function URLs ───────────────────────────────────────────────────────
const SEND_MESSAGE_URL =
  "https://ijfvlpcmizlerdtzqkul.supabase.co/functions/v1/send_message";
const TRACK_VIEW_URL =
  "https://ijfvlpcmizlerdtzqkul.supabase.co/functions/v1/track_listing_view";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function memberSince(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });
}

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
    apikey: session.access_token,
  };
}

// ─── Toast component ──────────────────────────────────────────────────────────

function Toast({ visible, message, type = "success" }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        type === "error" && styles.toastError,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <CheckCircle size={wp(4)} color="white" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ListingDetailScreen() {
  const { listingId } = useLocalSearchParams();
  const { profile } = useAuth();
  const router = useRouter();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const saveAnim = useRef(new Animated.Value(1)).current;
  const toastTimer = useRef(null);

  // ── Toast helper ────────────────────────────────────────────────────────────

  const showToast = useCallback((message, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2500
    );
  }, []);

  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  // ── Load listing ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!listingId) return;

    const load = async () => {
      try {
        const { data, error } = await supabase.rpc("get_listing_by_id", {
          p_listing_id: listingId,
          p_user_id: profile?.id ?? null,
        });
        if (error) throw error;

        if (data && data.length > 0) {
          const raw = data[0];
          const mapped = {
            id: raw.r_id,
            user_id: raw.r_user_id,
            title: raw.r_title,
            description: raw.r_description,
            price: raw.r_price,
            currency: raw.r_currency,
            category: raw.r_category,
            condition: raw.r_condition,
            images: raw.r_images,
            location: raw.r_location,
            status: raw.r_status,
            view_count: raw.r_view_count,
            like_count: raw.r_like_count,
            inquiry_count: raw.r_inquiry_count,
            created_at: raw.r_created_at,
            seller_id: raw.r_seller_id,
            seller_username: raw.r_seller_username,
            seller_avatar_url: raw.r_seller_avatar_url,
            seller_created_at: raw.r_seller_created_at,
          };
          setListing(mapped);

          // Check if already saved by current user
          if (profile?.id) {
            const { data: savedRow } = await supabase
              .from("saved_listings")
              .select("id")
              .eq("user_id", profile.id)
              .eq("listing_id", raw.r_id)
              .maybeSingle();
            setSaved(!!savedRow);
          }

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      } catch (err) {
        console.error("Failed to load listing:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [listingId, profile?.id]);

  // ── Track view ──────────────────────────────────────────────────────────────
  // Fire-and-forget once the listing is loaded. Deduplication is handled server-side.

  useEffect(() => {
    if (!listing?.id) return;

    const trackView = async () => {
      try {
        const headers = await getAuthHeaders().catch(() => ({
          "Content-Type": "application/json",
          // unauthenticated view still counts per the edge fn
        }));
        await fetch(TRACK_VIEW_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({ listing_id: listing.id }),
        });
        // Optimistically bump view count in UI
        setListing((prev) =>
          prev ? { ...prev, view_count: (prev.view_count ?? 0) + 1 } : prev
        );
      } catch (err) {
        // Non-critical — silently ignore
        console.warn("Track view failed:", err);
      }
    };

    trackView();
  }, [listing?.id]);

  // ── Save / unsave ───────────────────────────────────────────────────────────

  const handleToggleSave = async () => {
    if (!profile?.id) {
      showToast("Sign in to save listings", "error");
      return;
    }
    if (saveLoading) return;

    // Animate the bookmark icon
    Animated.sequence([
      Animated.timing(saveAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
      Animated.spring(saveAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    const newSaved = !saved;
    setSaved(newSaved); // optimistic
    setSaveLoading(true);

    try {
      if (newSaved) {
        const { error } = await supabase
          .from("saved_listings")
          .insert({ user_id: profile.id, listing_id: listing.id });
        if (error) throw error;
        showToast("Listing saved");
      } else {
        const { error } = await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", profile.id)
          .eq("listing_id", listing.id);
        if (error) throw error;
        showToast("Listing removed");
      }
    } catch (err) {
      console.error("Save toggle failed:", err);
      setSaved(!newSaved); // revert
      showToast("Something went wrong", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Share ───────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (!listing) return;

    const images = resolveImages();
    const firstImage = images[0] ?? null;

    // Build a rich share payload. On iOS this renders a link preview with
    // the image URL included in the message so apps that support OG previews
    // (WhatsApp, iMessage) will auto-fetch the thumbnail.
    try {
      const shareContent = {
        title: listing.title,
        message:
          `🛒 ${listing.title}\n` +
          `💰 R${Number(listing.price).toLocaleString()}\n` +
          (listing.location ? `📍 ${listing.location}\n` : "") +
          (listing.description
            ? `\n${listing.description.slice(0, 120)}${listing.description.length > 120 ? "…" : ""}\n`
            : "") +
          (firstImage ? `\n${firstImage}` : ""),
      };

      // On iOS, url drives the link preview thumbnail
      if (Platform.OS === "ios" && firstImage) {
        shareContent.url = firstImage;
      }

      await Share.share(shareContent);
    } catch (err) {
      if (err.message !== "The user did not share") {
        console.error("Share failed:", err);
      }
    }
  };

  // ── Send message ────────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (!profile?.id) {
      showToast("Sign in to message sellers", "error");
      return;
    }
    if (profile.id === listing?.seller_id) {
      showToast("You can't message yourself", "error");
      return;
    }

    setSending(true);
    try {
      const headers = await getAuthHeaders();

      const body = {
        recipient_id: listing.seller_id, // edge fn creates conversation if needed
        content: trimmed,
      };

      const res = await fetch(SEND_MESSAGE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);

      setMessage("");
      setMessageSent(true);

      // Bump inquiry count optimistically
      setListing((prev) =>
        prev ? { ...prev, inquiry_count: (prev.inquiry_count ?? 0) + 1 } : prev
      );

      showToast("Message sent!");

      // Optionally navigate straight to the conversation
      // Uncomment if you have a ConversationScreen:
      // router.push({ pathname: '/conversation', params: { conversationId: json.conversation_id } });
    } catch (err) {
      console.error("Send message failed:", err);
      showToast(err.message ?? "Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  // ── Image helpers ───────────────────────────────────────────────────────────

  const resolveImages = () => {
    if (!listing) return [];
    if (Array.isArray(listing.images)) return listing.images;
    if (typeof listing.images === "string") {
      try {
        return JSON.parse(listing.images);
      } catch {
        return [];
      }
    }
    return [];
  };

  // ── Loading / not-found states ──────────────────────────────────────────────

  if (loading) {
    return (
      <ScreenWrapper bg="#F9FAFB">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3F51B5" />
          <Text style={styles.loadingText}>Loading listing…</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!listing) {
    return (
      <ScreenWrapper bg="#F9FAFB">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Listing not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
            <Text style={styles.goBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const images = resolveImages();
  const isOwnListing = profile?.id === listing.seller_id;

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={wp(5)} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Share2 size={wp(4.5)} color="#374151" />
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: saveAnim }] }}>
            <TouchableOpacity
              style={[styles.iconBtn, saved && styles.iconBtnActive]}
              onPress={handleToggleSave}
              disabled={saveLoading}
            >
              {saveLoading ? (
                <ActivityIndicator size="small" color={saved ? "white" : "#3F51B5"} />
              ) : (
                <Bookmark
                  size={wp(4.5)}
                  color={saved ? "white" : "#374151"}
                  fill={saved ? "white" : "none"}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[currentImageIndex] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No images</Text>
            </View>
          )}

          {images.length > 1 && (
            <>
              <TouchableOpacity
                style={styles.navLeft}
                onPress={() =>
                  setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)
                }
              >
                <ChevronLeft size={wp(5)} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navRight}
                onPress={() =>
                  setCurrentImageIndex((i) => (i + 1) % images.length)
                }
              >
                <ChevronRight size={wp(5)} color="#374151" />
              </TouchableOpacity>
              <View style={styles.indicators}>
                {images.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setCurrentImageIndex(i)}
                    style={[styles.dot, i === currentImageIndex && styles.dotActive]}
                  />
                ))}
              </View>
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>
                  {currentImageIndex + 1}/{images.length}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Animated content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

          {/* Title & Price */}
          <View style={styles.card}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {listing.title}
              </Text>
              <Text style={styles.price}>
                R{Number(listing.price).toLocaleString()}
              </Text>
            </View>

            <View style={styles.metaRow}>
              {listing.location ? (
                <View style={styles.metaItem}>
                  <MapPin size={wp(3.5)} color="#6B7280" />
                  <Text style={styles.metaText}>{listing.location}</Text>
                </View>
              ) : null}
              <View style={styles.metaItem}>
                <Calendar size={wp(3.5)} color="#6B7280" />
                <Text style={styles.metaText}>{timeAgo(listing.created_at)}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Eye size={wp(3.5)} color="#9CA3AF" />
                <Text style={styles.statText}>{listing.view_count ?? 0} views</Text>
              </View>
              <View style={styles.statItem}>
                <Heart size={wp(3.5)} color="#9CA3AF" />
                <Text style={styles.statText}>{listing.like_count ?? 0} likes</Text>
              </View>
              <View style={styles.statItem}>
                <MessageCircle size={wp(3.5)} color="#9CA3AF" />
                <Text style={styles.statText}>{listing.inquiry_count ?? 0} inquiries</Text>
              </View>
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
              {listing.category ? (
                <View style={styles.tag}>
                  <Tag size={wp(3)} color="#3F51B5" />
                  <Text style={styles.tagText}>{listing.category}</Text>
                </View>
              ) : null}
              {Array.isArray(listing.condition) &&
                listing.condition.map((c, i) => (
                  <View key={i} style={styles.tagGreen}>
                    <ShieldCheck size={wp(3)} color="#10B981" />
                    <Text style={styles.tagTextGreen}>{c}</Text>
                  </View>
                ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{listing.description}</Text>
          </View>

          {/* Message Seller — hidden for own listings */}
          {!isOwnListing && (
            <View style={styles.card}>
              <View style={styles.messageHeader}>
                <MessageCircle size={wp(5)} color="#3F51B5" />
                <Text style={styles.sectionTitle}>Message Seller</Text>
              </View>

              {messageSent && (
                <View style={styles.sentBanner}>
                  <CheckCircle size={wp(4)} color="#10B981" />
                  <Text style={styles.sentBannerText}>
                    Message sent! The seller will respond shortly.
                  </Text>
                </View>
              )}

              <View style={styles.quickReplies}>
                {[
                  "Is this still available?",
                  "Can you do a lower price?",
                  "Where can we meet?",
                ].map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={styles.quickReply}
                    onPress={() => setMessage(q)}
                  >
                    <Text style={styles.quickReplyText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.messageInputRow}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Type your message…"
                  value={message}
                  onChangeText={setMessage}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!message.trim() || sending) && styles.sendBtnDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={!message.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Send size={wp(4)} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Seller */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/UserProfileScreen",
                params: { userId: listing.seller_id },
              })
            }
          >
            <View style={styles.sellerRow}>
              {listing.seller_avatar_url ? (
                <Image
                  source={{ uri: listing.seller_avatar_url }}
                  style={styles.sellerAvatar}
                />
              ) : (
                <View style={styles.sellerAvatarFallback}>
                  <Text style={styles.sellerAvatarInitial}>
                    {(listing.seller_username?.[0] ?? "U").toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{listing.seller_username}</Text>
                <Text style={styles.sellerMeta}>
                  Member since {memberSince(listing.seller_created_at)}
                </Text>
                <View style={styles.sellerRatingRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={wp(3)} color="#3F51B5" fill="#3F51B5" />
                  ))}
                  <Text style={styles.sellerRatingText}>5.0</Text>
                </View>
              </View>
              <ChevronRight size={wp(4.5)} color="#D1D5DB" />
            </View>
          </TouchableOpacity>

          <View style={{ height: hp(6) }} />
        </Animated.View>
      </ScrollView>

      {/* Toast */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: hp(2),
  },
  loadingText: { fontSize: wp(4), color: "#6B7280" },
  goBackBtn: {
    backgroundColor: "#3F51B5",
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: wp(50),
  },
  goBackBtnText: { color: "white", fontWeight: "600", fontSize: wp(3.5) },

  // Header
  header: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    flexDirection: "row",
    alignItems: "center",
    gap: wp(3),
  },
  headerTitle: { flex: 1, fontSize: wp(4), fontWeight: "600", color: "#111827" },
  headerRight: { flexDirection: "row", gap: wp(2) },
  iconBtn: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  iconBtnActive: { backgroundColor: "#3F51B5" },

  // Gallery
  imageGallery: { position: "relative", backgroundColor: "#F3F4F6" },
  mainImage: { width: SCREEN_WIDTH, height: hp(38) },
  imagePlaceholder: {
    width: SCREEN_WIDTH,
    height: hp(38),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  imagePlaceholderText: { color: "#9CA3AF", fontSize: wp(3.5) },
  navLeft: {
    position: "absolute",
    left: wp(3),
    top: "50%",
    transform: [{ translateY: -wp(4.5) }],
    width: wp(9),
    height: wp(9),
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: wp(4.5),
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  navRight: {
    position: "absolute",
    right: wp(3),
    top: "50%",
    transform: [{ translateY: -wp(4.5) }],
    width: wp(9),
    height: wp(9),
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: wp(4.5),
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  indicators: {
    position: "absolute",
    bottom: hp(2),
    left: 0,
    right: 0,
    justifyContent: "center",
    flexDirection: "row",
    gap: wp(1.5),
  },
  dot: {
    width: wp(1.8),
    height: wp(1.8),
    borderRadius: wp(1),
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: { width: wp(4), backgroundColor: "white" },
  imageBadge: {
    position: "absolute",
    top: hp(1.5),
    right: wp(3),
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: wp(50),
  },
  imageBadgeText: { color: "white", fontSize: wp(3), fontWeight: "500" },

  // Content
  content: { padding: wp(4), gap: hp(2) },
  card: {
    backgroundColor: "white",
    borderRadius: wp(4),
    padding: wp(4),
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: wp(3),
    marginBottom: hp(1.2),
  },
  title: {
    flex: 1,
    fontSize: wp(5),
    fontWeight: "700",
    color: "#111827",
    lineHeight: wp(7),
  },
  price: { fontSize: wp(5.5), fontWeight: "800", color: "#3F51B5" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: wp(4), marginBottom: hp(1.2) },
  metaItem: { flexDirection: "row", alignItems: "center", gap: wp(1) },
  metaText: { fontSize: wp(3.3), color: "#6B7280" },
  statsRow: {
    flexDirection: "row",
    gap: wp(5),
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginBottom: hp(1.2),
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: wp(1) },
  statText: { fontSize: wp(3), color: "#9CA3AF" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: wp(2) },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    backgroundColor: "#EEF2FF",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: wp(50),
  },
  tagText: { fontSize: wp(3), color: "#3F51B5", fontWeight: "500", textTransform: "capitalize" },
  tagGreen: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    backgroundColor: "#ECFDF5",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: wp(50),
  },
  tagTextGreen: { fontSize: wp(3), color: "#10B981", fontWeight: "500", textTransform: "capitalize" },

  // Description
  section: { paddingHorizontal: wp(1) },
  sectionTitle: { fontSize: wp(4), fontWeight: "700", color: "#111827", marginBottom: hp(1.2) },
  descriptionText: { fontSize: wp(3.8), color: "#13161A", lineHeight: hp(3) },

  // Message
  messageHeader: { flexDirection: "row", alignItems: "center", gap: wp(2), marginBottom: hp(1.2) },
  sentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
    backgroundColor: "#ECFDF5",
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    marginBottom: hp(1.2),
  },
  sentBannerText: { fontSize: wp(3.3), color: "#065F46", flex: 1 },
  quickReplies: { flexDirection: "row", flexWrap: "wrap", gap: wp(2), marginBottom: hp(1.5) },
  quickReply: {
    backgroundColor: "#EEF2FF",
    borderRadius: wp(50),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.8),
  },
  quickReplyText: { fontSize: wp(3), color: "#3F51B5", fontWeight: "500" },
  messageInputRow: { flexDirection: "row", alignItems: "flex-end", gap: wp(2) },
  messageInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: wp(4),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: wp(3.5),
    color: "#111827",
    maxHeight: hp(12),
  },
  sendBtn: {
    width: wp(11),
    height: wp(11),
    backgroundColor: "#3F51B5",
    borderRadius: wp(5.5),
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#C7D2FE" },

  // Seller
  sellerRow: { flexDirection: "row", alignItems: "center", gap: wp(3) },
  sellerAvatar: { width: wp(14), height: wp(14), borderRadius: wp(7) },
  sellerAvatarFallback: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerAvatarInitial: { fontSize: wp(6), fontWeight: "700", color: "#3F51B5" },
  sellerDetails: { flex: 1, gap: hp(0.5) },
  sellerName: { fontSize: wp(4), fontWeight: "700", color: "#111827" },
  sellerMeta: { fontSize: wp(3), color: "#9CA3AF" },
  sellerRatingRow: { flexDirection: "row", alignItems: "center", gap: wp(1) },
  sellerRatingText: { fontSize: wp(3), color: "#6B7280", marginLeft: wp(1) },

  // Toast
  toast: {
    position: "absolute",
    bottom: hp(4),
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
    backgroundColor: "#1F2937",
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.4),
    borderRadius: wp(50),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastError: { backgroundColor: "#EF4444" },
  toastText: { color: "white", fontSize: wp(3.5), fontWeight: "500" },
});