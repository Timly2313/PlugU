import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  MapPin,
  MoreHorizontal,
  PlusSquare,
} from 'lucide-react-native';
import { hp, wp } from '../../utilities/dimensions';
import ScreenWrapper from '../../components/ScreenWrapper';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/authContext';

const PAGE_LIMIT = 10;
const PRIMARY = '#3F51B5';
const SCREEN_W = Dimensions.get('window').width;
const HALF_W = (SCREEN_W - 2) / 2; // 2 px gap between halves

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Bulletproof media URL resolver.
 *
 * Supabase JSONB can give us:
 *   - null / undefined
 *   - already-parsed array:  ["url1", "url2"]
 *   - already-parsed object: { "0": "url1", "1": "url2" }
 *   - JSON string of array:  '["url1","url2"]'
 *   - JSON string of object: '{"0":"url1","1":"url2"}'
 *   - bare string:           "url1"
 */
function resolveMediaUrls(raw) {
  if (!raw) return [];

  // Already an array
  if (Array.isArray(raw)) return raw.filter(isValidUrl);

  // Already a plain object (JSONB object map)
  if (typeof raw === 'object') return Object.values(raw).filter(isValidUrl);

  // String — try to parse first
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    // Looks like JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(isValidUrl);
        if (typeof parsed === 'object') return Object.values(parsed).filter(isValidUrl);
      } catch {
        /* fall through */
      }
    }
    // Plain URL string
    return isValidUrl(trimmed) ? [trimmed] : [];
  }

  return [];
}

function isValidUrl(v) {
  if (!v || typeof v !== 'string') return false;
  const s = v.trim();
  return s.length > 0 && (s.startsWith('http') || s.startsWith('data:'));
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function callEdge(fnName, body) {
  const { data, error } = await supabase.functions.invoke(fnName, { body });
  if (error) throw error;
  return data;
}

const api = {
  getFeed: ({ page, limit }) =>
    supabase
      .from('posts')
      .select(
        `id, content, media_urls, location, status, like_count, comment_count, share_count,
         created_at, user_id,
         profiles:user_id (id, username, display_name, avatar_url)`
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
      .then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),

  getComments: (postId) =>
    supabase
      .from('comments')
      .select(
        `id, content, created_at, user_id,
         profiles:user_id (id, username, display_name, avatar_url)`
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),

  like: (postId, action) => callEdge('like-post', { post_id: postId, action }),
  comment: (postId, content, parentId) =>
    callEdge('create-comment', { post_id: postId, content, parent_id: parentId }),
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ uri, name, size = wp(10), style }) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.[0] ?? '?').toUpperCase();

  if (!uri || failed) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: PRIMARY,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <Text style={{ color: 'white', fontWeight: '700', fontSize: size * 0.38 }}>
          {initial}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: '#E5E7EB' },
        style,
      ]}
      onError={() => setFailed(true)}
    />
  );
}

// ─── Media Grid ───────────────────────────────────────────────────────────────

function MediaGrid({ urls }) {
  if (!urls || urls.length === 0) return null;
  const count = Math.min(urls.length, 4);

  if (count === 1) {
    return (
      <Image
        source={{ uri: urls[0] }}
        style={styles.mediaSingle}
        resizeMode="cover"
      />
    );
  }

  if (count === 2) {
    return (
      <View style={styles.mediaRow}>
        {urls.slice(0, 2).map((url, i) => (
          <Image key={i} source={{ uri: url }} style={styles.mediaHalf} resizeMode="cover" />
        ))}
      </View>
    );
  }

  if (count === 3) {
    return (
      <View style={styles.mediaRow}>
        <Image source={{ uri: urls[0] }} style={styles.mediaTallLeft} resizeMode="cover" />
        <View style={styles.mediaStackRight}>
          <Image source={{ uri: urls[1] }} style={styles.mediaStackItem} resizeMode="cover" />
          <View style={styles.mediaStackDivider} />
          <Image source={{ uri: urls[2] }} style={styles.mediaStackItem} resizeMode="cover" />
        </View>
      </View>
    );
  }

  // 4 images — 2×2
  return (
    <View style={styles.mediaGrid2x2}>
      {urls.slice(0, 4).map((url, i) => (
        <Image
          key={i}
          source={{ uri: url }}
          style={[
            styles.mediaGrid2x2Item,
            (i === 1 || i === 3) && styles.mediaGapLeft,
            (i === 2 || i === 3) && styles.mediaGapTop,
          ]}
          resizeMode="cover"
        />
      ))}
    </View>
  );
}

// ─── Comment Row ──────────────────────────────────────────────────────────────

const CommentRow = memo(({ comment }) => {
  const name = comment.profiles?.display_name ?? comment.profiles?.username ?? 'User';
  return (
    <View style={styles.commentRow}>
      <Avatar uri={comment.profiles?.avatar_url} name={name} size={wp(7)} />
      <View style={styles.commentBody}>
        <Text style={styles.commentAuthor}>
          {name}
          <Text style={styles.commentContent}> {comment.content}</Text>
        </Text>
        <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
      </View>
    </View>
  );
});

// ─── Post Item ────────────────────────────────────────────────────────────────

const PostItem = memo(
  ({
    post,
    onLike,
    onToggleComments,
    expandedPostId,
    postComments,
    commentLoadingId,
    commentText,
    onCommentTextChange,
    onSendComment,
  }) => {
    const isExpanded = expandedPostId === post.id;
    const name = post.profiles?.display_name ?? post.profiles?.username ?? 'User';
    const comments = postComments[post.id] ?? [];
    const isLoadingComments = commentLoadingId === post.id;
    const mediaUrls = resolveMediaUrls(post.media_urls);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }, []);

    return (
      <Animated.View style={[styles.post, { opacity: fadeAnim }]}>

        {/* ── Header ── */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.authorRow}
            activeOpacity={0.75}
            onPress={() =>
              router.push({
                pathname: '/UserProfileScreen',
                params: { userId: post.profiles?.id ?? post.user_id },
              })
            }
          >
            <Avatar uri={post.profiles?.avatar_url} name={name} size={wp(9)} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{name}</Text>
              <View style={styles.metaRow}>
                {post.location ? (
                  <>
                    <MapPin size={wp(2.6)} color="#9CA3AF" />
                    <Text style={styles.metaText}>{post.location} · </Text>
                  </>
                ) : null}
                <Text style={styles.metaText}>{timeAgo(post.created_at)}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MoreHorizontal size={wp(5)} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* ── Text content ── */}
        {!!post.content && <Text style={styles.postText}>{post.content}</Text>}

        {/* ── Media ── */}
        {mediaUrls.length > 0 && (
          <View style={styles.mediaWrapper}>
            <MediaGrid urls={mediaUrls} />
          </View>
        )}

        {/* ── Stats ── */}
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{formatCount(post.like_count)} likes</Text>
          <View style={styles.statsRight}>
            <Text style={styles.statText}>{formatCount(post.comment_count)} comments</Text>
            <Text style={styles.statText}>{formatCount(post.share_count ?? 0)} shares</Text>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.divider} />
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onLike(post.id, post.is_liked)}
            activeOpacity={0.6}
          >
            <Heart
              size={wp(4.5)}
              color={post.is_liked ? PRIMARY : '#6B7280'}
              fill={post.is_liked ? PRIMARY : 'none'}
            />
            <Text style={[styles.actionLabel, post.is_liked && { color: PRIMARY }]}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onToggleComments(post.id)}
            activeOpacity={0.6}
          >
            <MessageCircle size={wp(4.5)} color={isExpanded ? PRIMARY : '#6B7280'} />
            <Text style={[styles.actionLabel, isExpanded && { color: PRIMARY }]}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
            <Share2 size={wp(4.5)} color="#6B7280" />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* ── Comments ── */}
        {isExpanded && (
          <>
            <View style={styles.divider} />
            <View style={styles.commentsSection}>
              {isLoadingComments ? (
                <ActivityIndicator
                  size="small"
                  color={PRIMARY}
                  style={{ marginVertical: hp(1.5) }}
                />
              ) : (
                <>
                  {comments.length === 0 && (
                    <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                  )}
                  {comments.map((c) => (
                    <CommentRow key={c.id} comment={c} />
                  ))}
                </>
              )}

              {/* Comment input */}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  value={commentText}
                  onChangeText={onCommentTextChange}
                  placeholder="Write a comment…"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
                  onPress={() => onSendComment(post.id)}
                  disabled={!commentText.trim()}
                  activeOpacity={0.8}
                >
                  <Send size={wp(4)} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </Animated.View>
    );
  }
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const { profile: currentUser } = useAuth();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [postComments, setPostComments] = useState({});
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentLoadingId, setCommentLoadingId] = useState(null);
  const [commentText, setCommentText] = useState('');

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else if (pageNumber === 1) setIsLoading(true);
      else setLoadingMore(true);

      const data = await api.getFeed({ page: pageNumber, limit: PAGE_LIMIT });

      if (refresh || pageNumber === 1) {
        setPosts(data);
      } else {
        setPosts((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          return [...prev, ...data.filter((p) => !ids.has(p.id))];
        });
      }
      setHasMore(data.length === PAGE_LIMIT);
      setPage(pageNumber);
    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, []);

  // ── Realtime ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel('community-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const { data } = await supabase
            .from('posts')
            .select(
              `id, content, media_urls, location, status, like_count, comment_count, share_count,
               created_at, user_id,
               profiles:user_id (id, username, display_name, avatar_url)`
            )
            .eq('id', payload.new.id)
            .single();
          if (data) setPosts((prev) => [data, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prev) =>
            prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ── Like ─────────────────────────────────────────────────────────────────────

  const handleLike = useCallback(async (postId, isLiked) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, is_liked: !isLiked, like_count: isLiked ? p.like_count - 1 : p.like_count + 1 }
          : p
      )
    );
    try {
      await api.like(postId, isLiked ? 'unlike' : 'like');
    } catch (err) {
      console.error('Like error:', err);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, is_liked: isLiked, like_count: isLiked ? p.like_count + 1 : p.like_count - 1 }
            : p
        )
      );
    }
  }, []);

  // ── Comments ─────────────────────────────────────────────────────────────────

  const handleToggleComments = useCallback(
    async (postId) => {
      if (expandedPostId === postId) {
        setExpandedPostId(null);
        return;
      }
      setExpandedPostId(postId);
      if (!postComments[postId]) {
        setCommentLoadingId(postId);
        try {
          const data = await api.getComments(postId);
          setPostComments((prev) => ({ ...prev, [postId]: data }));
        } catch (err) {
          console.error('Load comments error:', err);
          setPostComments((prev) => ({ ...prev, [postId]: [] }));
        } finally {
          setCommentLoadingId(null);
        }
      }
    },
    [expandedPostId, postComments]
  );

  const handleSendComment = useCallback(
    async (postId) => {
      const text = commentText.trim();
      if (!text) return;

      const optimistic = {
        id: `opt_${Date.now()}`,
        content: text,
        created_at: new Date().toISOString(),
        user_id: currentUser?.id,
        profiles: {
          id: currentUser?.id,
          username: currentUser?.username,
          display_name: currentUser?.display_name,
          avatar_url: currentUser?.avatar_url,
        },
      };

      setPostComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), optimistic],
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
        )
      );
      setCommentText('');

      try {
        const result = await api.comment(postId, text);
        setPostComments((prev) => ({
          ...prev,
          [postId]: (prev[postId] || []).map((c) =>
            c.id === optimistic.id ? { ...optimistic, ...result.comment } : c
          ),
        }));
      } catch (err) {
        console.error('Comment error:', err);
        setPostComments((prev) => ({
          ...prev,
          [postId]: (prev[postId] || []).filter((c) => c.id !== optimistic.id),
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) }
              : p
          )
        );
      }
    },
    [commentText, currentUser]
  );

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }) => (
      <PostItem
        post={item}
        currentUserId={currentUser?.id}
        onLike={handleLike}
        onToggleComments={handleToggleComments}
        expandedPostId={expandedPostId}
        postComments={postComments}
        commentLoadingId={commentLoadingId}
        commentText={expandedPostId === item.id ? commentText : ''}
        onCommentTextChange={setCommentText}
        onSendComment={handleSendComment}
      />
    ),
    [
      handleLike,
      handleToggleComments,
      expandedPostId,
      postComments,
      commentLoadingId,
      commentText,
      handleSendComment,
      currentUser,
    ]
  );

  // Thick divider between posts
  const renderSeparator = () => <View style={styles.postSeparator} />;

  const renderFooter = () =>
    loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={PRIMARY} />
      </View>
    ) : null;

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <PlusSquare size={wp(14)} color="#C7D2FE" />
        <Text style={styles.emptyTitle}>Nothing here yet</Text>
        <Text style={styles.emptySubtitle}>Be the first to post something</Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => router.push('/CreatePostScreen')}
        >
          <Text style={styles.emptyBtnText}>Create Post</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ── UI ────────────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper bg="#FFFFFF">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={hp(10)}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/CreatePostScreen')}
            activeOpacity={0.85}
          >
            <PlusSquare size={wp(4)} color="white" />
            <Text style={styles.createBtnText}>Post</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={renderSeparator}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchPosts(1, true)}
                tintColor={PRIMARY}
                colors={[PRIMARY]}
              />
            }
            onEndReached={() => {
              if (hasMore && !loadingMore) fetchPosts(page + 1);
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews
            initialNumToRender={5}
            maxToRenderPerBatch={8}
            windowSize={10}
          />
        )}
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: wp(5.5),
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    backgroundColor: PRIMARY,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: wp(50),
  },
  createBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: wp(3.5),
  },

  // ── Feed ──
  feedContent: {
    paddingBottom: hp(10),
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Thick separator between posts (like Facebook / Threads)
  postSeparator: {
    height: hp(1),
    backgroundColor: '#F3F4F6',
  },
  footerLoader: {
    paddingVertical: hp(2),
    alignItems: 'center',
  },

  // ── Post ──
  post: {
    backgroundColor: '#FFFFFF',
  },
  // Thin hairline divider used inside a post
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginHorizontal: wp(4),
  },

  // ── Post header ──
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(1.2),
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
    flex: 1,
  },
  authorInfo: { flex: 1 },
  authorName: {
    fontSize: wp(3.8),
    fontWeight: '700',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(0.5),
    marginTop: hp(0.2),
  },
  metaText: {
    fontSize: wp(2.8),
    color: '#9CA3AF',
  },

  // ── Text ──
  postText: {
    fontSize: wp(3.7),
    color: '#1F2937',
    lineHeight: hp(2.5),
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.2),
  },

  // ── Media ──
  // Wrapper adds top/bottom breathing room around media block
  mediaWrapper: {
    marginBottom: hp(1.2),
  },

  mediaSingle: {
    width: SCREEN_W,
    height: SCREEN_W * 0.75, // 4:3
    backgroundColor: '#F3F4F6',
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 2,
  },
  mediaHalf: {
    width: HALF_W,
    height: HALF_W,
    backgroundColor: '#F3F4F6',
  },
  mediaTallLeft: {
    width: HALF_W,
    height: HALF_W,
    backgroundColor: '#F3F4F6',
  },
  mediaStackRight: {
    flex: 1,
    gap: 0,
  },
  mediaStackDivider: {
    height: 2,
    backgroundColor: '#FFFFFF',
  },
  mediaStackItem: {
    width: '100%',
    height: (HALF_W - 2) / 2,
    backgroundColor: '#F3F4F6',
  },
  mediaGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mediaGrid2x2Item: {
    width: HALF_W,
    height: HALF_W,
    backgroundColor: '#F3F4F6',
  },
  mediaGapLeft: {
    borderLeftWidth: 2,
    borderColor: '#FFFFFF',
  },
  mediaGapTop: {
    borderTopWidth: 2,
    borderColor: '#FFFFFF',
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.9),
  },
  statsRight: {
    flexDirection: 'row',
    gap: wp(3),
  },
  statText: {
    fontSize: wp(3),
    color: '#9CA3AF',
  },

  // ── Actions ──
  actionsRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1.3),
  },
  actionLabel: {
    fontSize: wp(3.2),
    color: '#6B7280',
    fontWeight: '500',
  },

  // ── Comments ──
  commentsSection: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
    gap: hp(1.2),
  },
  commentRow: {
    flexDirection: 'row',
    gap: wp(2.5),
    alignItems: 'flex-start',
  },
  commentBody: {
    flex: 1,
    paddingTop: hp(0.2),
  },
  commentAuthor: {
    fontSize: wp(3.3),
    fontWeight: '700',
    color: '#111827',
    lineHeight: hp(2.2),
  },
  commentContent: {
    fontWeight: '400',
    color: '#374151',
  },
  commentTime: {
    fontSize: wp(2.5),
    color: '#9CA3AF',
    marginTop: hp(0.3),
  },
  noComments: {
    fontSize: wp(3.2),
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: hp(1),
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'flex-end',
    marginTop: hp(0.5),
    paddingTop: hp(1),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: wp(4),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    fontSize: wp(3.5),
    color: '#111827',
    maxHeight: hp(10),
  },
  sendBtn: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },

  // ── Empty ──
  emptyState: {
    alignItems: 'center',
    paddingTop: hp(8),
    paddingHorizontal: wp(10),
    gap: hp(1),
  },
  emptyTitle: {
    fontSize: wp(4.5),
    fontWeight: '700',
    color: '#374151',
    marginTop: hp(1),
  },
  emptySubtitle: {
    fontSize: wp(3.5),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: hp(2.4),
  },
  emptyBtn: {
    marginTop: hp(1.5),
    backgroundColor: PRIMARY,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.4),
    borderRadius: wp(50),
  },
  emptyBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: wp(3.8),
  },
});