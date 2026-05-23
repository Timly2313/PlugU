import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions,
} from 'react-native';
import { Heart, MessageCircle, Share2, MapPin, MoreHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import Avatar from './Avatar';
import MediaGrid from './MediaGrid';
import ImageLightbox from './ImageLightbox';
import VideoLightbox from './VideoLightbox';
import { resolveMediaUrls, isVideo, timeAgo, formatCount } from '../utilities/communityUtils';

const PRIMARY  = '#3F51B5';
const SCREEN_W = Dimensions.get('window').width;

const PostItem = memo(({
  post,
  isVisible,
  onLike,
  onOpenComments,
}) => {
  const name      = post.profiles?.display_name ?? post.profiles?.username ?? 'User';
  const mediaUrls = resolveMediaUrls(post.media_urls);
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
      <Animated.View style={[s.post, { opacity: fadeAnim }]}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.authorRow}
            activeOpacity={0.75}
            onPress={() =>
              router.push({
                pathname: '/UserProfileScreen',
                params: { userId: post.profiles?.id ?? post.user_id },
              })
            }
          >
            <Avatar uri={post.profiles?.avatar_url} name={name} size={wp(9)} />
            <View style={s.authorInfo}>
              <Text style={s.authorName}>{name}</Text>
              <View style={s.metaRow}>
                {post.location ? (
                  <>
                    <MapPin size={wp(2.6)} color="#9CA3AF" />
                    <Text style={s.metaText}>{post.location} · </Text>
                  </>
                ) : null}
                <Text style={s.metaText}>{timeAgo(post.created_at)}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MoreHorizontal size={wp(5)} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Text */}
        {!!post.content && <Text style={s.postText}>{post.content}</Text>}

        {/* Media */}
        {mediaUrls.length > 0 && (
          <View style={s.mediaWrapper}>
            <MediaGrid
              urls={mediaUrls}
              isVisible={isVisible}
              onImagePress={handleImagePress}
              onVideoLongPress={handleVideoLongPress}
            />
          </View>
        )}

        {/* Stats */}
        <View style={s.divider} />
        <View style={s.statsRow}>
          <Text style={s.statText}>{formatCount(post.like_count)} likes</Text>
          <View style={s.statsRight}>
            <Text style={s.statText}>{formatCount(post.comment_count)} comments</Text>
            <Text style={s.statText}>{formatCount(post.share_count ?? 0)} shares</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.divider} />
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => onLike(post.id, post.is_liked)}
            activeOpacity={0.6}
          >
            <Heart
              size={wp(4.5)}
              color={post.is_liked ? PRIMARY : '#6B7280'}
              fill={post.is_liked ? PRIMARY : 'none'}
            />
            <Text style={[s.actionLabel, post.is_liked && { color: PRIMARY }]}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => onOpenComments(post.id)}
            activeOpacity={0.6}
          >
            <MessageCircle size={wp(4.5)} color="#6B7280" />
            <Text style={s.actionLabel}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn} activeOpacity={0.6}>
            <Share2 size={wp(4.5)} color="#6B7280" />
            <Text style={s.actionLabel}>Share</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

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

export default PostItem;

const s = StyleSheet.create({
  post:       { backgroundColor: '#fff' },
  divider:    { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginHorizontal: wp(4) },
  header:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: wp(4), paddingTop: hp(1.8), paddingBottom: hp(1.2),
  },
  authorRow:  { flexDirection: 'row', alignItems: 'center', gap: wp(2.5), flex: 1 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: wp(3.8), fontWeight: '700', color: '#111827' },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: wp(0.5), marginTop: hp(0.2) },
  metaText:   { fontSize: wp(2.8), color: '#9CA3AF' },
  postText:   {
    fontSize: wp(3.7), color: '#1F2937', lineHeight: hp(2.5),
    paddingHorizontal: wp(4), paddingBottom: hp(1.2),
  },
  mediaWrapper: { marginBottom: hp(1.2) },
  statsRow:   {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: wp(4), paddingVertical: hp(0.9),
  },
  statsRight: { flexDirection: 'row', gap: wp(3) },
  statText:   { fontSize: wp(3), color: '#9CA3AF' },
  actionsRow: { flexDirection: 'row' },
  actionBtn:  {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: wp(1.5), paddingVertical: hp(1.3),
  },
  actionLabel:{ fontSize: wp(3.2), color: '#6B7280', fontWeight: '500' },
});