import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { MapPin, Calendar } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import Avatar from '../components/Avatar';
import { router } from 'expo-router';
import { resolveMediaUrls, isVideo, timeAgo } from '../utilities/communityUtils';
import MediaGrid from '../components/MediaGrid';
import ImageLightbox from '../components/ImageLightbox';
import VideoLightbox from '../components/VideoLightbox';

const PRIMARY = '#3F51B5';

export default function PostContent({ post }) {
  const name      = post.profiles?.display_name ?? post.profiles?.username ?? 'User';
  const mediaUrls = resolveMediaUrls(post.media_urls);
  const imageUrls = mediaUrls.filter((u) => !isVideo(u));

  const [lightboxOpen,  setLightboxOpen]  = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [videoOpen,     setVideoOpen]     = useState(false);
  const [videoUrl,      setVideoUrl]      = useState('');

  const handleImagePress = (gridIndex) => {
    const url = mediaUrls[gridIndex];
    if (!url || isVideo(url)) return;
    const imgIdx = imageUrls.indexOf(url);
    setLightboxIndex(imgIdx >= 0 ? imgIdx : 0);
    setLightboxOpen(true);
  };

  return (
    <>
      <View style={s.wrap}>
        {/* Author */}
        <TouchableOpacity
          style={s.authorRow}
          onPress={() => router.push({ pathname: '/UserProfileScreen', params: { userId: post.profiles?.id ?? post.user_id } })}
          activeOpacity={0.75}
        >
          <Avatar uri={post.profiles?.avatar_url} name={name} size={wp(11)} borderWidth={0} />
          <View style={s.authorInfo}>
            <Text style={s.authorName}>{name}</Text>
            <View style={s.metaRow}>
              {post.location ? (
                <>
                  <MapPin size={wp(3)} color="#9CA3AF" />
                  <Text style={s.metaText}>{post.location} · </Text>
                </>
              ) : null}
              <Calendar size={wp(3)} color="#9CA3AF" />
              <Text style={s.metaText}>{timeAgo(post.created_at)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Text */}
        {!!post.content && (
          <Text style={s.content}>{post.content}</Text>
        )}
      </View>

      {/* Media — full width */}
      {mediaUrls.length > 0 && (
        <View style={s.mediaWrap}>
          <MediaGrid
            urls={mediaUrls}
            isVisible={true}
            onImagePress={handleImagePress}
            onVideoLongPress={(url) => { setVideoUrl(url); setVideoOpen(true); }}
          />
        </View>
      )}

      {/* Stats */}
      <View style={s.statsRow}>
        <Text style={s.stat}>{post.like_count ?? 0} likes</Text>
        <Text style={s.stat}>{post.comment_count ?? 0} comments</Text>
        <Text style={s.stat}>{post.share_count ?? 0} shares</Text>
      </View>

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
}

const s = StyleSheet.create({
  wrap:       { padding: wp(4) },
  authorRow:  { flexDirection: 'row', alignItems: 'center', gap: wp(3), marginBottom: hp(1.5) },
  authorInfo: { flex: 1 },
  authorName: { fontSize: wp(4), fontWeight: '700', color: '#111827' },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: wp(1), marginTop: hp(0.3) },
  metaText:   { fontSize: wp(3), color: '#9CA3AF' },
  content:    { fontSize: wp(4), color: '#1F2937', lineHeight: hp(3), marginBottom: hp(1) },
  mediaWrap:  { marginBottom: hp(0) },
  statsRow:   {
    flexDirection: 'row', gap: wp(4),
    paddingHorizontal: wp(4), paddingVertical: hp(1.2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  stat:       { fontSize: wp(3.2), color: '#9CA3AF' },
});