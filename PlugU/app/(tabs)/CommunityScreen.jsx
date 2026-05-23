/**
 * CommunityScreen.jsx
 *
 * Features:
 *  - Bulletproof media_url resolver (array / object-map / JSON string / bare string)
 *  - Videos auto-play muted when ≥50% visible in feed; pause + reset when scrolled away
 *  - Tap video  → toggle mute
 *  - Long-press video → open full-screen player with native controls
 *  - Tap image  → full-screen lightbox with swipe-to-dismiss + pinch-to-zoom + swipe between images
 *  - Multi-image grid: 1 / 2 / 3 / 2×2 layouts
 *  - Flat UI — no cards, no elevation, hairline + thick-band dividers only
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Dimensions,
  PanResponder,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Video, ResizeMode } from 'expo-av';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  MapPin,
  MoreHorizontal,
  PlusSquare,
  Volume2,
  VolumeX,
  X,
  Play,
} from 'lucide-react-native';
import { hp, wp } from '../../utilities/dimensions';
import ScreenWrapper from '../../components/ScreenWrapper';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/authContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10;
const PRIMARY    = '#3F51B5';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HALF_W     = (SCREEN_W - 2) / 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VIDEO_EXTS = /\.(mp4|mov|m4v|webm|mkv|avi|m3u8)(\?|$)/i;

function isVideo(url) {
  if (!url || typeof url !== 'string') return false;
  return VIDEO_EXTS.test(url);
}

/**
 * Bulletproof media URL resolver.
 * Handles: null | array | JSONB object-map | JSON string of either | bare string
 */
function resolveMediaUrls(raw) {
  if (!raw) return [];
  if (Array.isArray(raw))      return raw.filter(isValidUrl);
  if (typeof raw === 'object') return Object.values(raw).filter(isValidUrl);
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        const p = JSON.parse(t);
        if (Array.isArray(p))      return p.filter(isValidUrl);
        if (typeof p === 'object') return Object.values(p).filter(isValidUrl);
      } catch { /* fall through */ }
    }
    return isValidUrl(t) ? [t] : [];
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
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
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

  like:    (postId, action) => callEdge('like_post',      { post_id: postId, action }),
  comment: (postId, content, parentId) =>
    callEdge('comment_post', { post_id: postId, content, parent_id: parentId }),
};

// ─── Image Lightbox ───────────────────────────────────────────────────────────

/**
 * Full-screen image viewer.
 *   • Swipe-down ≥20 % of screen height → dismiss
 *   • Two-finger pinch → zoom (1×–4×)
 *   • Horizontal FlatList → swipe between images
 */
function ImageLightbox({ visible, urls, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);

  const translateY = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const scaleVal   = useRef(1);
  const lastDist   = useRef(null);

  const bgOpacity = translateY.interpolate({
    inputRange: [-SCREEN_H * 0.3, 0, SCREEN_H * 0.3],
    outputRange: [0.2, 1, 0.2],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      translateY.setValue(0);
      scale.setValue(1);
      scaleVal.current = 1;
      lastDist.current = null;
    }
  }, [visible, initialIndex]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }),
      Animated.timing(scale,      { toValue: 0.75,     duration: 250, useNativeDriver: true }),
    ]).start(onClose);
  }, [onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;

        // ── Pinch ──
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (lastDist.current !== null) {
            const delta = dist - lastDist.current;
            scaleVal.current = Math.min(4, Math.max(1, scaleVal.current + delta * 0.01));
            scale.setValue(scaleVal.current);
          }
          lastDist.current = dist;
          return;
        }

        lastDist.current = null;

        // ── Vertical drag (only when not zoomed) ──
        if (scaleVal.current <= 1.05) {
          translateY.setValue(gs.dy);
        }
      },

      onPanResponderRelease: (_, gs) => {
        lastDist.current = null;
        if (Math.abs(gs.dy) > SCREEN_H * 0.2 && scaleVal.current <= 1.05) {
          dismiss();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 120 }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Animated.View style={[lbStyles.backdrop, { opacity: bgOpacity }]} />

      {/* Close button */}
      <TouchableOpacity style={lbStyles.closeBtn} onPress={dismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <X size={wp(6)} color="#fff" />
      </TouchableOpacity>

      {/* Counter */}
      {urls.length > 1 && (
        <View style={lbStyles.counter}>
          <Text style={lbStyles.counterText}>{index + 1} / {urls.length}</Text>
        </View>
      )}

      {/* Images */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateY }, { scale }] }]}
        {...panResponder.panHandlers}
      >
        <FlatList
          data={urls}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={scaleVal.current <= 1.05}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          onMomentumScrollEnd={(e) => {
            const newIdx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setIndex(newIdx);
            scale.setValue(1);
            scaleVal.current = 1;
          }}
          renderItem={({ item }) => (
            <View style={lbStyles.imagePage}>
              <Image source={{ uri: item }} style={lbStyles.fullImage} resizeMode="contain" />
            </View>
          )}
        />
      </Animated.View>
    </Modal>
  );
}

const STATUS_BAR_H = RNStatusBar.currentHeight ?? 44;

const lbStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: STATUS_BAR_H + 8,
    right: wp(4),
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    padding: 8,
  },
  counter: {
    position: 'absolute',
    top: STATUS_BAR_H + 14,
    alignSelf: 'center',
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  counterText: { color: '#fff', fontSize: wp(3.2), fontWeight: '600' },
  imagePage: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: { width: SCREEN_W, height: SCREEN_H },
});

// ─── Video Lightbox ───────────────────────────────────────────────────────────

function VideoLightbox({ visible, url, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!visible && videoRef.current) {
      videoRef.current.pauseAsync().catch(() => {});
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={vlStyles.container}>
        <TouchableOpacity style={vlStyles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <X size={wp(6)} color="#fff" />
        </TouchableOpacity>
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={vlStyles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          useNativeControls
          isLooping={false}
        />
      </View>
    </Modal>
  );
}

const vlStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: STATUS_BAR_H + 8,
    right: wp(4),
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 8,
  },
  video: { width: SCREEN_W, height: SCREEN_H * 0.75 },
});

// ─── In-Feed Video Cell ───────────────────────────────────────────────────────

/**
 * Single in-feed video.
 *   isVisible → auto-play muted; pause + seek to 0 when out of view.
 *   Tap → toggle mute.
 *   Long-press → open VideoLightbox.
 */
function InFeedVideo({ url, style, isVisible, onLongPress }) {
  const videoRef            = useRef(null);
  const [muted,  setMuted]  = useState(true);
  const [status, setStatus] = useState({});
  const [ready,  setReady]  = useState(false);

  useEffect(() => {
    if (!videoRef.current || !ready) return;
    if (isVisible) {
      videoRef.current.playAsync().catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
      videoRef.current.setPositionAsync(0).catch(() => {});
    }
  }, [isVisible, ready]);

  return (
    <TouchableWithoutFeedback
      onPress={() => setMuted((m) => !m)}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <View style={[style, { backgroundColor: '#000' }]}>
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isMuted={muted}
          isLooping
          shouldPlay={false}
          onPlaybackStatusUpdate={setStatus}
          onReadyForDisplay={() => setReady(true)}
        />

        {/* Mute badge */}
        <View style={inFeedStyles.muteBadge}>
          {muted
            ? <VolumeX size={wp(3.5)} color="#fff" />
            : <Volume2 size={wp(3.5)} color="#fff" />}
        </View>

        {/* Loading / buffering */}
        {!ready && (
          <View style={inFeedStyles.overlay}>
            <ActivityIndicator color="#fff" size="small" />
          </View>
        )}

        {/* Paused-but-visible hint */}
        {ready && !status.isPlaying && isVisible && (
          <View style={inFeedStyles.overlay}>
            <Play size={wp(10)} color="#fff" fill="#fff" />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const inFeedStyles = StyleSheet.create({
  muteBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    padding: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
});

// ─── Media Cell ───────────────────────────────────────────────────────────────

/** Routes to InFeedVideo or a tappable Image depending on URL type. */
function MediaCell({ url, style, isVisible, onImagePress, onVideoLongPress }) {
  if (isVideo(url)) {
    return (
      <InFeedVideo
        url={url}
        style={style}
        isVisible={isVisible}
        onLongPress={() => onVideoLongPress(url)}
      />
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onImagePress}>
      <Image source={{ uri: url }} style={style} resizeMode="cover" />
    </TouchableOpacity>
  );
}

// ─── Media Grid ───────────────────────────────────────────────────────────────

function MediaGrid({ urls, isVisible, onImagePress, onVideoLongPress }) {
  if (!urls || urls.length === 0) return null;
  const count = Math.min(urls.length, 4);

  if (count === 1) {
    return (
      <MediaCell
        url={urls[0]}
        style={styles.mediaSingle}
        isVisible={isVisible}
        onImagePress={() => onImagePress(0)}
        onVideoLongPress={onVideoLongPress}
      />
    );
  }

  if (count === 2) {
    return (
      <View style={styles.mediaRow}>
        {urls.slice(0, 2).map((url, i) => (
          <MediaCell
            key={i}
            url={url}
            style={styles.mediaHalf}
            isVisible={isVisible}
            onImagePress={() => onImagePress(i)}
            onVideoLongPress={onVideoLongPress}
          />
        ))}
      </View>
    );
  }

  if (count === 3) {
    return (
      <View style={styles.mediaRow}>
        <MediaCell
          url={urls[0]}
          style={styles.mediaTallLeft}
          isVisible={isVisible}
          onImagePress={() => onImagePress(0)}
          onVideoLongPress={onVideoLongPress}
        />
        <View style={styles.mediaStackRight}>
          <MediaCell
            url={urls[1]}
            style={styles.mediaStackItem}
            isVisible={isVisible}
            onImagePress={() => onImagePress(1)}
            onVideoLongPress={onVideoLongPress}
          />
          <View style={styles.mediaStackDivider} />
          <MediaCell
            url={urls[2]}
            style={styles.mediaStackItem}
            isVisible={isVisible}
            onImagePress={() => onImagePress(2)}
            onVideoLongPress={onVideoLongPress}
          />
        </View>
      </View>
    );
  }

  // 4 — 2×2
  return (
    <View style={styles.mediaGrid2x2}>
      {urls.slice(0, 4).map((url, i) => (
        <MediaCell
          key={i}
          url={url}
          style={[
            styles.mediaGrid2x2Item,
            (i === 1 || i === 3) && styles.mediaGapLeft,
            (i === 2 || i === 3) && styles.mediaGapTop,
          ]}
          isVisible={isVisible}
          onImagePress={() => onImagePress(i)}
          onVideoLongPress={onVideoLongPress}
        />
      ))}
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ uri, name, size = wp(10), style }) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.[0] ?? '?').toUpperCase();

  if (!uri || failed) {
    return (
      <View style={[{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
      }, style]}>
        <Text style={{ color: 'white', fontWeight: '700', fontSize: size * 0.38 }}>{initial}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E5E7EB' }, style]}
      onError={() => setFailed(true)}
    />
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
          {name}<Text style={styles.commentContent}> {comment.content}</Text>
        </Text>
        <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
      </View>
    </View>
  );
});

// ─── Post Item ────────────────────────────────────────────────────────────────

const PostItem = memo(({
  post,
  isVisible,
  onLike,
  onToggleComments,
  expandedPostId,
  postComments,
  commentLoadingId,
  commentText,
  onCommentTextChange,
  onSendComment,
}) => {
  const isExpanded        = expandedPostId === post.id;
  const name              = post.profiles?.display_name ?? post.profiles?.username ?? 'User';
  const comments          = postComments[post.id] ?? [];
  const isLoadingComments = commentLoadingId === post.id;
  const mediaUrls         = resolveMediaUrls(post.media_urls);

  // Collect image-only URLs for the lightbox
  const imageUrls = mediaUrls.filter((u) => !isVideo(u));

  const [lightboxOpen,  setLightboxOpen]  = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoOpen,     setVideoOpen]     = useState(false);
  const [videoUrl,      setVideoUrl]      = useState('');

  const handleImagePress = useCallback((gridIndex) => {
    const url = mediaUrls[gridIndex];
    if (!url || isVideo(url)) return;
    const imgIdx = imageUrls.indexOf(url);
    setLightboxIndex(imgIdx >= 0 ? imgIdx : 0);
    setLightboxOpen(true);
  }, [mediaUrls, imageUrls]);

  const handleVideoLongPress = useCallback((url) => {
    setVideoUrl(url);
    setVideoOpen(true);
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, []);

  return (
    <>
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
            <MediaGrid
              urls={mediaUrls}
              isVisible={isVisible}
              onImagePress={handleImagePress}
              onVideoLongPress={handleVideoLongPress}
            />
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
                <ActivityIndicator size="small" color={PRIMARY} style={{ marginVertical: hp(1.5) }} />
              ) : (
                <>
                  {comments.length === 0 && (
                    <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                  )}
                  {comments.map((c) => <CommentRow key={c.id} comment={c} />)}
                </>
              )}
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

      {/* Lightboxes live outside the post so they cover the whole screen */}
      <ImageLightbox
        visible={lightboxOpen}
        urls={imageUrls}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
      <VideoLightbox
        visible={videoOpen}
        url={videoUrl}
        onClose={() => setVideoOpen(false)}
      />
    </>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const { profile: currentUser } = useAuth();

  const [posts,         setPosts]         = useState([]);
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(true);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);

  const [postComments,     setPostComments]     = useState({});
  const [expandedPostId,   setExpandedPostId]   = useState(null);
  const [commentLoadingId, setCommentLoadingId] = useState(null);
  const [commentText,      setCommentText]      = useState('');

  // Set of post IDs whose cells are ≥50% visible — drives video autoplay
  const [visibleIds, setVisibleIds] = useState(new Set());

  // ── Viewability ──────────────────────────────────────────────────────────────

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    setVisibleIds(new Set(viewableItems.map((vi) => vi.item.id)));
  }).current;

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh)               setIsRefreshing(true);
      else if (pageNumber === 1) setIsLoading(true);
      else                       setLoadingMore(true);

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

  useEffect(() => { fetchPosts(1); }, []);

  // ── Realtime ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel('community-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' },
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

  const handleToggleComments = useCallback(async (postId) => {
    if (expandedPostId === postId) { setExpandedPostId(null); return; }
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
  }, [expandedPostId, postComments]);

  const handleSendComment = useCallback(async (postId) => {
    const text = commentText.trim();
    if (!text) return;

    const optimistic = {
      id: `opt_${Date.now()}`,
      content: text,
      created_at: new Date().toISOString(),
      user_id: currentUser?.id,
      profiles: {
        id:           currentUser?.id,
        username:     currentUser?.username,
        display_name: currentUser?.display_name,
        avatar_url:   currentUser?.avatar_url,
      },
    };

    setPostComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), optimistic] }));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p))
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
  }, [commentText, currentUser]);

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }) => (
    <PostItem
      post={item}
      isVisible={visibleIds.has(item.id)}
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
  ), [
    visibleIds,
    handleLike, handleToggleComments,
    expandedPostId, postComments, commentLoadingId,
    commentText, handleSendComment, currentUser,
  ]);

  const renderSeparator = () => <View style={styles.postSeparator} />;
  const renderFooter    = () =>
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
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/CreatePostScreen')}>
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
        {/* Header */}
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
            onEndReached={() => { if (hasMore && !loadingMore) fetchPosts(page + 1); }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
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
  headerTitle:  { fontSize: wp(5.5), fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    backgroundColor: PRIMARY,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: wp(50),
  },
  createBtnText: { color: 'white', fontWeight: '700', fontSize: wp(3.5) },

  // ── Feed ──
  feedContent:   { paddingBottom: hp(10) },
  loaderWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  postSeparator: { height: hp(1), backgroundColor: '#F3F4F6' },
  footerLoader:  { paddingVertical: hp(2), alignItems: 'center' },

  // ── Post ──
  post:    { backgroundColor: '#FFFFFF' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginHorizontal: wp(4) },

  // ── Post header ──
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.8),
    paddingBottom: hp(1.2),
  },
  authorRow:  { flexDirection: 'row', alignItems: 'center', gap: wp(2.5), flex: 1 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: wp(3.8), fontWeight: '700', color: '#111827' },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: wp(0.5), marginTop: hp(0.2) },
  metaText:   { fontSize: wp(2.8), color: '#9CA3AF' },

  // ── Text ──
  postText: {
    fontSize: wp(3.7),
    color: '#1F2937',
    lineHeight: hp(2.5),
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.2),
  },

  // ── Media ──
  mediaWrapper:     { marginBottom: hp(1.2) },
  mediaSingle:      { width: SCREEN_W, height: SCREEN_W * 0.75, backgroundColor: '#000' },
  mediaRow:         { flexDirection: 'row', gap: 2 },
  mediaHalf:        { width: HALF_W, height: HALF_W, backgroundColor: '#000' },
  mediaTallLeft:    { width: HALF_W, height: HALF_W, backgroundColor: '#000' },
  mediaStackRight:  { flex: 1 },
  mediaStackDivider:{ height: 2, backgroundColor: '#FFFFFF' },
  mediaStackItem:   { width: '100%', height: (HALF_W - 2) / 2, backgroundColor: '#000' },
  mediaGrid2x2:     { flexDirection: 'row', flexWrap: 'wrap' },
  mediaGrid2x2Item: { width: HALF_W, height: HALF_W, backgroundColor: '#000' },
  mediaGapLeft:     { borderLeftWidth: 2, borderColor: '#FFFFFF' },
  mediaGapTop:      { borderTopWidth: 2,  borderColor: '#FFFFFF' },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.9),
  },
  statsRight: { flexDirection: 'row', gap: wp(3) },
  statText:   { fontSize: wp(3), color: '#9CA3AF' },

  // ── Actions ──
  actionsRow: { flexDirection: 'row' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    paddingVertical: hp(1.3),
  },
  actionLabel: { fontSize: wp(3.2), color: '#6B7280', fontWeight: '500' },

  // ── Comments ──
  commentsSection: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
    gap: hp(1.2),
  },
  commentRow:     { flexDirection: 'row', gap: wp(2.5), alignItems: 'flex-start' },
  commentBody:    { flex: 1, paddingTop: hp(0.2) },
  commentAuthor:  { fontSize: wp(3.3), fontWeight: '700', color: '#111827', lineHeight: hp(2.2) },
  commentContent: { fontWeight: '400', color: '#374151' },
  commentTime:    { fontSize: wp(2.5), color: '#9CA3AF', marginTop: hp(0.3) },
  noComments:     { fontSize: wp(3.2), color: '#9CA3AF', textAlign: 'center', paddingVertical: hp(1) },
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
  sendBtn:         { width: wp(9), height: wp(9), borderRadius: wp(4.5), backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#C7D2FE' },

  // ── Empty ──
  emptyState:    { alignItems: 'center', paddingTop: hp(8), paddingHorizontal: wp(10), gap: hp(1) },
  emptyTitle:    { fontSize: wp(4.5), fontWeight: '700', color: '#374151', marginTop: hp(1) },
  emptySubtitle: { fontSize: wp(3.5), color: '#9CA3AF', textAlign: 'center', lineHeight: hp(2.4) },
  emptyBtn:      { marginTop: hp(1.5), backgroundColor: PRIMARY, paddingHorizontal: wp(6), paddingVertical: hp(1.4), borderRadius: wp(50) },
  emptyBtnText:  { color: 'white', fontWeight: '700', fontSize: wp(3.8) },
});