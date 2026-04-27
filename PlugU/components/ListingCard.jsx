import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { MapPin, Heart, Bookmark, Share2 } from "lucide-react-native";
import { hp, wp } from "../utilities/dimensions";

export default function ListingCard({
  listing,
  showStatus,
  status,
  onViewListing,
  liked = false,
  onLikeClick,
}) {
  if (!listing) {
    return (
      <View style={styles.card}>
        <View style={styles.imagePlaceholder} />
        <View style={styles.infoContainer}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonPrice} />
        </View>
      </View>
    );
  }

  // images can be an array or a single string
const imageUri = Array.isArray(listing.images)
  ? listing.images[0]
  : typeof listing.images === 'object' && listing.images !== null
  ? Object.values(listing.images)[0]  
  : null;

  const statusConfig = {
    active:   { label: "Active",   bg: "#10B981" },
    Active:   { label: "Active",   bg: "#10B981" },
    sold:     { label: "Sold",     bg: "#6B7280" },
    Sold:     { label: "Sold",     bg: "#6B7280" },
    pending:  { label: "Pending",  bg: "#F59E0B" },
    Pending:  { label: "Pending",  bg: "#F59E0B" },
  };

  const statusInfo = statusConfig[status] ?? null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onViewListing?.(listing.id)}
      activeOpacity={0.88}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>No image</Text>
          </View>
        )}

        {/* Status badge */}
        {showStatus && statusInfo && (
          <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
            <Text style={styles.badgeText}>{statusInfo.label}</Text>
          </View>
        )}

        {/* Action buttons (save / share) — only when not showing status */}
        {!showStatus && (
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => e.stopPropagation()}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Bookmark size={wp(3.5)} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => e.stopPropagation()}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Share2 size={wp(3.5)} color="#374151" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            R{listing.price != null ? Number(listing.price).toLocaleString() : "—"}
          </Text>
          {!showStatus && (
            <TouchableOpacity
              style={[styles.likeBtn, liked && styles.likeBtnActive]}
              onPress={(e) => {
                e.stopPropagation();
                onLikeClick?.();
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Heart
                size={wp(3.5)}
                color={liked ? "white" : "#6B7280"}
                fill={liked ? "white" : "none"}
              />
            </TouchableOpacity>
          )}
        </View>

        {listing.location ? (
          <View style={styles.locationRow}>
            <MapPin size={wp(3)} color="#9CA3AF" />
            <Text style={styles.location} numberOfLines={1}>
              {listing.location}
            </Text>
          </View>
        ) : null}

        {listing.distance_km != null && (
          <Text style={styles.distance}>
            {listing.distance_km < 1
              ? `${Math.round(listing.distance_km * 1000)}m away`
              : `${listing.distance_km.toFixed(1)}km away`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: wp(4),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: wp(3),
    color: "#D1D5DB",
  },
  badge: {
    position: "absolute",
    top: wp(2),
    left: wp(2),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: wp(50),
  },
  badgeText: {
    color: "white",
    fontSize: wp(2.5),
    fontWeight: "600",
  },
  imageActions: {
    position: "absolute",
    top: wp(2),
    right: wp(2),
    flexDirection: "row",
    gap: wp(1.5),
  },
  actionBtn: {
    width: wp(7.5),
    height: wp(7.5),
    backgroundColor: "white",
    borderRadius: wp(4),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContainer: {
    padding: wp(3),
  },
  title: {
    fontSize: wp(3.5),
    fontWeight: "600",
    color: "#111827",
    marginBottom: hp(0.6),
    lineHeight: wp(5),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(0.8),
  },
  price: {
    fontSize: wp(4),
    fontWeight: "700",
    color: "#3F51B5",
  },
  likeBtn: {
    width: wp(7.5),
    height: wp(7.5),
    borderRadius: wp(4),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  likeBtnActive: {
    backgroundColor: "#3F51B5",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
  },
  location: {
    fontSize: wp(3),
    color: "#9CA3AF",
    flex: 1,
  },
  distance: {
    fontSize: wp(2.8),
    color: "#3F51B5",
    fontWeight: "500",
    marginTop: hp(0.4),
  },
  skeletonTitle: {
    height: hp(1.5),
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    marginBottom: hp(0.8),
    width: "80%",
  },
  skeletonPrice: {
    height: hp(1.5),
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    width: "50%",
  },
});