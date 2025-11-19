import React, { useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Modal, 
  ScrollView 
} from "react-native";
import { MapPin, Clock, Heart, MessageCircle, Share, MoreVertical, Tag, Mail,Sprout,Bug,ThumbsUp,Sun } from "lucide-react-native";
import { hp, wp } from "..//utilities/";

const Post = ({ 
  post, 
  currentUser, 
  onLike, 
  onComment, 
  onMessage,
  onShare,
  onMore,
  showActions = true,
  compact = false
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const {
    id,
    author,
    content,
    images,
    tags,
    timestamp,
    likes,
    comments,
    shares,
    isLiked,
    type
  } = post;

  const postTypeConfig = {
    crop_update: { label: "Crop Update", icon: Sprout, color: "#ECFDF5", textColor: "#065F46" },
    problem: { label: "Problem", icon: Bug, color: "#FEF2F2", textColor: "#991B1B" },
    achievement: { label: "Achievement", icon: ThumbsUp, color: "#FFFBEB", textColor: "#92400E" },
    advice_request: { label: "Need Advice", icon: MessageCircle, color: "#EFF6FF", textColor: "#1E40AF" },
    general: { label: "General", icon: Sun, color: "#F3F4F6", textColor: "#374151" }
  };

  const typeConfig = postTypeConfig[type] || postTypeConfig.general;
  const TypeIcon = typeConfig.icon;

  const handleLike = () => onLike ? onLike(id) : Alert.alert("Like", `Liked post ${id}`);
  const handleComment = () => onComment ? onComment(post) : Alert.alert("Comment", `Comment on post ${id}`);
  const handleMessage = () => onMessage ? onMessage(author.id, author.name, author.avatar) : Alert.alert("Message", `Message ${author.name}`);
  const handleShare = () => onShare ? onShare(post) : Alert.alert("Share", `Share post ${id}`);
  const handleMore = () => onMore ? onMore(post) : Alert.alert("More Options", `Options for post ${id}`);

  const validImages = images?.filter(img => img && typeof img === "string" && img.trim() !== "") || [];

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  // Check if post is from current user
  const isCurrentUserPost = currentUser && author.id === currentUser.id;

  // Render tags
  const PostTags = () => {
    if (!tags || tags.length === 0) return null;
    return (
      <View style={styles.tagRow}>
        {tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tagBadge}>
            <Tag size={12} color="#666" />
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {tags.length > 3 && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>+{tags.length - 3}</Text>
          </View>
        )}
      </View>
    );
  };

  // Image rendering
  const PostImages = () => {
    if (!validImages || validImages.length === 0) return null;

    if (compact || validImages.length === 1) {
      return (
        <>
          <TouchableOpacity onPress={validImages.length > 1 ? handleOpenModal : null} style={{ marginTop: hp(1) }}>
            <Image
              source={{ uri: validImages[0] }}
              style={{ width: "100%", height: hp(30), borderRadius: wp(2) }}
              resizeMode="cover"
            />
            {validImages.length > 1 && (
              <View style={styles.overlayCount}>
                <Text style={styles.overlayCountText}>+{validImages.length - 1}</Text>
              </View>
            )}
          </TouchableOpacity>
        </>
      );
    }

    // Full post mode for 2-4+ images
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: wp(1), marginTop: hp(1) }}>
        {validImages.slice(0, 4).map((uri, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={validImages.length > 1 ? handleOpenModal : null}
            style={{ width: "48%", height: hp(15), marginBottom: wp(1), position: "relative" }}
          >
            <Image
              source={{ uri }}
              style={{ width: "100%", height: "100%", borderRadius: wp(2) }}
              resizeMode="cover"
            />
            {idx === 3 && validImages.length > 4 && (
              <View style={styles.overlayCount}>
                <Text style={styles.overlayCountText}>+{validImages.length - 4}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Image source={{ uri: author.avatar }} style={[styles.avatar, compact && styles.avatarCompact]} />
        <View style={styles.headerText}>
          <View style={styles.topRow}>
            <Text style={compact ? styles.authorNameCompact : styles.authorName}>{author.name}</Text>
            {author.isVerified && <View style={[styles.badge, styles.badgeSecondary]}><Text style={styles.badgeText}>Verified</Text></View>}
            <View style={[styles.typeBadge, { backgroundColor: typeConfig.color }]}>
              <TypeIcon size={compact ? 12 : 14} color={typeConfig.textColor} />
              <Text style={[compact ? styles.typeBadgeTextCompact : styles.typeBadgeText, { color: typeConfig.textColor }]}>
                {typeConfig.label}
              </Text>
            </View>
          </View>
          {!compact && (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}><MapPin size={12} color="#666"/><Text style={styles.metaText}>{author.location}</Text></View>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.metaItem}><Clock size={12} color="#666"/><Text style={styles.metaText}>{timestamp}</Text></View>
            </View>
          )}
        </View>
        {!compact && (
          <TouchableOpacity style={styles.iconButton} onPress={handleMore}>
            <MoreVertical size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardBody}>
        <Text style={compact ? styles.postContentCompact : styles.postContent}>{content}</Text>
        <PostTags />
      </View>

      {/* Images */}
      <PostImages />

      {/* Actions */}
      {showActions && (
        <View style={compact ? styles.cardFooterCompact : styles.cardFooter}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Heart size={compact ? 16 : 18} color={isLiked ? "#24e043ff" : "#666"} fill={isLiked ? "#24e043ff" : "none"} />
              <Text style={compact ? styles.actionTextCompact : styles.actionText}>{likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleComment}>
              <MessageCircle size={compact ? 16 : 18} color="#666" />
              <Text style={compact ? styles.actionTextCompact : styles.actionText}>{comments}</Text>
            </TouchableOpacity>

            {!compact && (
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <Share size={18} color="#666" />
                <Text style={styles.actionText}>{shares}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Only show message button if post is NOT from current user AND not in compact mode */}
          {!compact && !isCurrentUserPost && (
            <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
              <Mail size={16} color="#309B48" />
              <Text style={styles.messageBtnText}>Message</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Modal for viewing all images */}
      <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {validImages.map((uri, idx) => (
              <Image
                key={idx}
                source={{ uri }}
                style={{ width: wp(90), height: hp(70), marginHorizontal: wp(2), borderRadius: wp(2) }}
                resizeMode="contain"
              />
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
            <Text style={{ color: "#fff", fontSize: wp(5) }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({

  card: {
    backgroundColor: "#ffffffff",
    borderRadius: wp(3),
    padding: wp(3),
    marginBottom: hp(1.6),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardCompact: {
    padding: wp(2.5),
    marginBottom: hp(1),
  },

  // Header styles
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: hp(1),
  },
  avatar: {
    marginTop:hp(0.75),
    width: wp(12),
    height: wp(12),
    borderRadius: wp(12) / 2,
    marginRight: wp(2.5),
    backgroundColor: "#f0f0f0",
    
  },
  avatarCompact: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(9) / 2,
    marginRight: wp(2),
  },
  headerText: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
    flexWrap: "wrap",
    marginBottom: hp(0.5),
  },
  authorName: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: wp(4),
  },
  authorNameCompact: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: wp(3.8),
  },
  badge: {
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.5),
    borderRadius: wp(2.4),
    backgroundColor: "#e6e6e6",
  },
  badgeText: {
    fontSize: wp(2.4),
    color: "#0f172a",
    fontWeight: "500",
  },
  badgeSecondary: {
    backgroundColor: "#EEF2FF",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.6),
    borderRadius: wp(3),
    gap: wp(1),
  },
  typeBadgeText: {
    fontSize: wp(3.2),
    fontWeight: "500",
  },
  typeBadgeTextCompact: {
    fontSize: wp(2.8),
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.6),
  },
  metaText: {
    fontSize: wp(3.2),
    color: "#475569",
  },
  metaTextCompact: {
    fontSize: wp(3),
    color: "#64748B",
  },
  metaDot: {
    marginHorizontal: wp(1.6),
    color: "#9CA3AF",
  },
  iconButton: {
    padding: wp(1.2),
  },

  // Body styles
  cardBody: {
    marginBottom: hp(1),
  },
  postContent: {
    fontSize: wp(3.6),
    color: "#0f172a",
    lineHeight: hp(2.6),
    marginBottom: hp(1),
  },
  postContentCompact: {
    fontSize: wp(3.4),
    color: "#0f172a",
    lineHeight: hp(2.4),
  },

  // Tag styles
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: wp(2),
  },
  tagBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.6),
    backgroundColor: "#F3F4F6",
    borderRadius: wp(3),
    gap: wp(1),
  },
  tagText: {
    fontSize: wp(3),
    color: "#666",
    fontWeight: "500",
  },


  postImage: {
    borderRadius: wp(2.4),
    backgroundColor: "#f0f0f0",
    height:hp(50),
  },

  imageCountBadge: {
    position: "absolute",
    bottom: wp(2),
    right: wp(2),
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: wp(3),
  },
  imageCountText: {
    color: "#fff",
    fontSize: wp(2.8),
    fontWeight: "600",
  },

  // Footer styles
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cardFooterCompact: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: hp(0.8),
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(4),
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
  },
  actionText: {
    fontSize: wp(3.2),
    color: "#666",
    fontWeight: "500",
    minWidth: wp(8),
  },
  actionTextCompact: {
    fontSize: wp(3),
    color: "#666",
    fontWeight: "500",
    minWidth: wp(7),
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.8),
    borderRadius: wp(2.4),
    borderWidth: 1,
    borderColor: "#309B48",
    backgroundColor: "rgba(48, 155, 72, 0.1)",
  },
  messageBtnText: {
    color: "#309B48",
    fontWeight: "600",
    fontSize: wp(3),
  },

  overlayCount: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: wp(2),
    justifyContent: "center",
    alignItems: "center",
  },
  overlayCountText: {
    color: "#fff",
    fontSize: wp(4),
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalClose: {
    position: "absolute",
    top: hp(5),
    right: wp(5),
    padding: wp(2),
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: wp(2),
  },
});

export default Post;