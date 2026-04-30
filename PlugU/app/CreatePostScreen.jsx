import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, ImageIcon, Video, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { hp, wp } from '../utilities/dimensions';
import { router } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/authContext';
import { supabase } from '../lib/supabase';
import { uploadMediaToSupabase } from '../services/imageService';

const PRIMARY = '#3F51B5';

// ─── Insert post directly — active status, picked up by realtime ─────────────

async function insertPost({ userId, content, mediaUrls, tags }) {
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content,
      media_urls: mediaUrls,
      status: 'active',
    })
    .select()
    .single();

  if (postError) throw new Error(postError.message);

  // Insert tags if provided (best-effort, non-blocking)
  if (tags.length > 0) {
    const tagRows = tags.map((tag) => ({ post_id: post.id, tag_name: tag }));
    await supabase.from('post_tags').insert(tagRows).then(({ error }) => {
      if (error) console.warn('Tag insert warning:', error.message);
    });
  }

  return post;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreatePostScreen() {
  const { user, profile } = useAuth();

  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]); // { id, type, localUri, asset }
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // ── Media pickers ────────────────────────────────────────────────────────────

  const pickMedia = async (mediaType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll access is needed to attach media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'image' ? 'Images' : 'Videos',
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const picked = result.assets.map((asset) => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: mediaType,
        localUri: asset.uri,
        asset,
      }));
      setMedia((prev) => [...prev, ...picked]);
    }
  };

  const removeMedia = (id) => setMedia((prev) => prev.filter((m) => m.id !== id));

  // ── Tags ─────────────────────────────────────────────────────────────────────

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags((prev) => [...prev, t]);
      setTagInput('');
    }
  };

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!user || !profile) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }
    if (!content.trim() && media.length === 0) {
      Alert.alert('Empty post', 'Add some text or media before posting.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Upload each media file and collect public URLs
      const mediaUrls = [];
      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        setUploadProgress(`Uploading ${item.type} ${i + 1} of ${media.length}…`);
        const url = await uploadMediaToSupabase(item.localUri, user.id, 'post-media', item.type);
        mediaUrls.push(url);
      }

      // 2. Insert post directly — goes live instantly via realtime
      setUploadProgress('Publishing post…');
      await insertPost({
        userId: user.id,
        content: content.trim(),
        mediaUrls,
        tags,
      });

      router.back();
    } catch (err) {
      console.error('Create post error:', err);
      Alert.alert('Error', err.message || 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  const canSubmit = (content.trim().length > 0 || media.length > 0) && !submitting;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={submitting}>
            <ArrowLeft size={wp(5)} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <Text style={[styles.charCount, content.length > 900 && { color: '#EF4444' }]}>
            {content.length}/1000
          </Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Author row ── */}
            <View style={styles.authorRow}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.authorAvatar} />
              ) : (
                <View style={styles.authorAvatarFallback}>
                  <Text style={styles.authorAvatarInitial}>
                    {(profile?.display_name?.[0] ?? profile?.username?.[0] ?? 'U').toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.authorName}>
                  {profile?.display_name ?? profile?.username ?? 'You'}
                </Text>
                <Text style={styles.visibilityText}>Community · visible instantly</Text>
              </View>
            </View>

            {/* ── Text input ── */}
            <View style={styles.card}>
              <TextInput
                style={styles.textArea}
                placeholder="What's on your mind?"
                placeholderTextColor="#9CA3AF"
                value={content}
                onChangeText={(t) => t.length <= 1000 && setContent(t)}
                multiline
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            {/* ── Media picker buttons ── */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Add to your post</Text>
              <View style={styles.mediaPickerRow}>
                <TouchableOpacity
                  style={styles.mediaPickerBtn}
                  onPress={() => pickMedia('image')}
                  disabled={submitting}
                  activeOpacity={0.75}
                >
                  <ImageIcon size={wp(4.5)} color={PRIMARY} />
                  <Text style={styles.mediaPickerText}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaPickerBtn}
                  onPress={() => pickMedia('video')}
                  disabled={submitting}
                  activeOpacity={0.75}
                >
                  <Video size={wp(4.5)} color={PRIMARY} />
                  <Text style={styles.mediaPickerText}>Video</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Media preview grid ── */}
            {media.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Media ({media.length})</Text>
                <View style={styles.mediaGrid}>
                  {media.map((item) => (
                    <View key={item.id} style={styles.mediaThumb}>
                      {item.type === 'image' ? (
                        <Image
                          source={{ uri: item.localUri }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[StyleSheet.absoluteFill, styles.videoThumbInner]}>
                          <Video size={wp(8)} color="#9CA3AF" />
                          <Text style={styles.videoLabel}>Video</Text>
                        </View>
                      )}
                      <View style={styles.mediaBadge}>
                        <Text style={styles.mediaBadgeText}>
                          {item.type === 'image' ? 'IMG' : 'VID'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.mediaRemoveBtn}
                        onPress={() => removeMedia(item.id)}
                        disabled={submitting}
                      >
                        <X size={wp(3.5)} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Tags ── */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>
                Tags{' '}
                <Text style={styles.optional}>(optional · {tags.length}/10)</Text>
              </Text>

              {tags.length > 0 && (
                <View style={styles.tagsWrap}>
                  {tags.map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>#{t}</Text>
                      <TouchableOpacity
                        onPress={() => removeTag(t)}
                        disabled={submitting}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <X size={wp(3)} color={PRIMARY} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {tags.length < 10 && (
                <TextInput
                  style={styles.tagInput}
                  placeholder="Type a tag and press return…"
                  placeholderTextColor="#9CA3AF"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  blurOnSubmit={false}
                  returnKeyType="done"
                  editable={!submitting}
                />
              )}
            </View>

            {/* ── Tips ── */}
            <View style={[styles.card, styles.tipsCard]}>
              <Text style={styles.cardLabel}>Tips</Text>
              {[
                'Keep posts respectful and relevant to the community.',
                'Use tags to help others discover your content.',
                'Photos and videos make posts more engaging.',
                'Avoid sharing personal or sensitive information.',
              ].map((tip, i) => (
                <Text key={i} style={styles.tip}>· {tip}</Text>
              ))}
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Fixed footer ── */}
        <View style={styles.footer}>
          {submitting && uploadProgress ? (
            <Text style={styles.progressText}>{uploadProgress}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.postBtn, !canSubmit && styles.postBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.postBtnText}>Post to Community</Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const THUMB_SIZE = (wp(100) - wp(4) * 2 - wp(4) * 2 - wp(3)) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: wp(3),
  },
  backBtn: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: wp(5),
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  charCount: {
    fontSize: wp(3),
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Scroll
  scrollContent: {
    padding: wp(4),
    gap: hp(1.5),
    paddingBottom: hp(14),
  },

  // Author row
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingVertical: hp(0.5),
  },
  authorAvatar: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: '#E5E7EB',
  },
  authorAvatarFallback: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarInitial: {
    color: 'white',
    fontWeight: '800',
    fontSize: wp(4.5),
  },
  authorName: {
    fontSize: wp(3.8),
    fontWeight: '700',
    color: '#111827',
  },
  visibilityText: {
    fontSize: wp(2.8),
    color: '#9CA3AF',
    marginTop: hp(0.2),
  },

  // Cards
  card: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLabel: {
    fontSize: wp(3.8),
    fontWeight: '700',
    color: '#374151',
    marginBottom: hp(1.2),
  },
  optional: {
    fontWeight: '400',
    color: '#9CA3AF',
    fontSize: wp(3.2),
  },

  // Text area
  textArea: {
    minHeight: hp(14),
    fontSize: wp(3.8),
    color: '#111827',
    textAlignVertical: 'top',
    lineHeight: hp(2.5),
  },

  // Media picker
  mediaPickerRow: {
    flexDirection: 'row',
    gap: wp(3),
  },
  mediaPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    borderWidth: 1.5,
    borderColor: PRIMARY,
    borderRadius: wp(3),
    paddingVertical: hp(1.2),
  },
  mediaPickerText: {
    color: PRIMARY,
    fontSize: wp(3.5),
    fontWeight: '600',
  },

  // Media grid
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3),
  },
  mediaThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: wp(3),
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  videoThumbInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(0.5),
    backgroundColor: '#E5E7EB',
  },
  videoLabel: {
    fontSize: wp(3),
    color: '#6B7280',
    fontWeight: '500',
  },
  mediaBadge: {
    position: 'absolute',
    bottom: wp(2),
    left: wp(2),
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: wp(1.5),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
  },
  mediaBadgeText: {
    color: 'white',
    fontSize: wp(2.2),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mediaRemoveBtn: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
    width: wp(7),
    height: wp(7),
    borderRadius: wp(3.5),
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tags
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(1.2),
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    backgroundColor: '#EEF2FF',
    borderRadius: wp(50),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
  },
  tagText: {
    color: PRIMARY,
    fontSize: wp(3.2),
    fontWeight: '600',
  },
  tagInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(3),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    fontSize: wp(3.5),
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },

  // Tips
  tipsCard: {
    backgroundColor: '#F0F4FF',
  },
  tip: {
    fontSize: wp(3.3),
    color: '#6B7280',
    lineHeight: hp(2.3),
    marginBottom: hp(0.3),
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(3),
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: hp(0.8),
  },
  progressText: {
    fontSize: wp(3),
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  postBtn: {
    backgroundColor: PRIMARY,
    borderRadius: wp(3.5),
    paddingVertical: hp(1.7),
    alignItems: 'center',
  },
  postBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },
  postBtnText: {
    color: 'white',
    fontSize: wp(4),
    fontWeight: '700',
  },
});