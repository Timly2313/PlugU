export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (secs < 60) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

// Map notification type → icon name + color
export function getNotificationMeta(type) {
  switch (type) {
    case "like":
      return { icon: "Heart", color: "#EF4444", bg: "#FEF2F2" };
    case "comment":
      return { icon: "MessageCircle", color: "#3F51B5", bg: "#EEF2FF" };
    case "reply":
      return { icon: "CornerDownRight", color: "#8B5CF6", bg: "#F5F3FF" };
    case "follow":
      return { icon: "UserPlus", color: "#10B981", bg: "#ECFDF5" };
    case "message":
      return { icon: "Mail", color: "#F59E0B", bg: "#FFFBEB" };
    case "listing_inquiry":
      return { icon: "ShoppingBag", color: "#0EA5E9", bg: "#F0F9FF" };
    case "listing_sold":
      return { icon: "CheckCircle", color: "#10B981", bg: "#ECFDF5" };
    case "price_drop":
      return { icon: "TrendingDown", color: "#EF4444", bg: "#FEF2F2" };
    case "review":
      return { icon: "Star", color: "#F59E0B", bg: "#FFFBEB" };
    case "system":
      return { icon: "Bell", color: "#6B7280", bg: "#F3F4F6" };
    default:
      return { icon: "Bell", color: "#6B7280", bg: "#F3F4F6" };
  }
}

export function getNotificationRoute(notification) {
  const { target_type, target_id, data } = notification;
  switch (target_type) {
    case "post":
      return { pathname: "/PostDetailScreen", params: { postId: target_id } };
    case "comment":
      return {
        pathname: "/PostDetailScreen",
        params: { postId: data?.post_id, commentId: target_id },
      };
    case "listing":
      return {
        pathname: "/ListingDetailScreen",
        params: { listingId: target_id },
      };
    case "conversation":
      return {
        pathname: "/ConversationScreen",
        params: {
          conversationId: target_id,
          displayName: data?.display_name,
          listingTitle: data?.listing_title,
          avatarUrl: data?.avatar_url,
        },
      };
    case "profile":
      return { pathname: "/UserProfileScreen", params: { userId: target_id } };
    default:
      return null;
  }
}
