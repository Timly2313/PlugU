import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, StyleSheet, Share,
} from 'react-native';
import { ArrowLeft, AlertCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper      from '../components/ScreenWrapper';
import { useAuth }        from '../context/authContext';
import { usePostDetails } from '../hooks/usePostDetails';
import { usePostComments } from '../hooks/usePostComments';
import PostContent        from '../components/PostContent';
import PostActions        from '../components/PostActions';
import CommentItem        from '../components/CommentItem';
import CommentInput       from '../components/CommentInput';

const PRIMARY = '#3F51B5';

export default function PostDetailScreen() {
  const { postId, commentId } = useLocalSearchParams();
  const { profile }           = useAuth();

  const {
    post, setPost, loading, error, reload, toggleLike,
  } = usePostDetails(postId, profile?.id);

  const {
    comments, loading: loadingComments,
    sending, inputText, setInputText,
    sendComment, likeComment,
  } = usePostComments(postId, profile?.id);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    sendComment(profile, () => {
      setPost((prev) => prev
        ? { ...prev, comment_count: (prev.comment_count ?? 0) + 1 }
        : prev
      );
    });
  }, [sendComment, profile, setPost]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!post) return;
    try {
      await Share.share({ message: post.content ?? 'Check out this post!' });
    } catch { /* silent */ }
  }, [post]);

  // ── Render comment ─────────────────────────────────────────────────────────
  const renderComment = useCallback(({ item }) => (
    <CommentItem comment={item} onLike={likeComment} />
  ), [likeComment]);

  const keyExtractor = useCallback((item) => item.id, []);

  // ── States ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ScreenWrapper bg="#fff">
        <Header />
        <View style={s.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !post) {
    return (
      <ScreenWrapper bg="#fff">
        <Header />
        <View style={s.centered}>
          <AlertCircle size={wp(12)} color="#EF4444" />
          <Text style={s.errorText}>{error ?? 'Post not found'}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={reload}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="#fff">
      <StatusBar style="dark" />

      {/* Header */}
      <Header />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          data={comments}
          keyExtractor={keyExtractor}
          renderItem={renderComment}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.listContent}
          // Post content + actions sit above the comments
          ListHeaderComponent={
            <>
              <PostContent post={post} />
              <PostActions
                post={post}
                onLike={toggleLike}
                onShare={handleShare}
              />
              <View style={s.commentsHeader}>
                <Text style={s.commentsTitle}>
                  Comments ({post.comment_count ?? 0})
                </Text>
              </View>
              {loadingComments && (
                <View style={s.commentsLoader}>
                  <ActivityIndicator size="small" color={PRIMARY} />
                </View>
              )}
              {!loadingComments && comments.length === 0 && (
                <Text style={s.noComments}>No comments yet. Be the first!</Text>
              )}
            </>
          }
        />

        {/* Comment input — sticks above keyboard */}
        <CommentInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          sending={sending}
        />
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

// Simple back header
function Header() {
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <ArrowLeft size={wp(5)} color="#374151" />
      </TouchableOpacity>
      <Text style={s.headerTitle}>Post</Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex:           { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: wp(3), paddingHorizontal: wp(4), paddingVertical: hp(1), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB', backgroundColor: '#fff' },
  backBtn:        { width: wp(9), height: wp(9), borderRadius: wp(4.5), backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: wp(4.5), fontWeight: '700', color: '#111827' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: hp(2) },
  errorText:      { fontSize: wp(3.8), color: '#374151', textAlign: 'center', paddingHorizontal: wp(8) },
  retryBtn:       { backgroundColor: PRIMARY, paddingHorizontal: wp(6), paddingVertical: hp(1.2), borderRadius: wp(2) },
  retryText:      { color: '#fff', fontWeight: '600', fontSize: wp(3.5) },
  listContent:    { paddingBottom: hp(2) },
  commentsHeader: { paddingHorizontal: wp(4), paddingVertical: hp(1.5), borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  commentsTitle:  { fontSize: wp(4), fontWeight: '700', color: '#111827' },
  commentsLoader: { paddingVertical: hp(2), alignItems: 'center' },
  noComments:     { textAlign: 'center', color: '#9CA3AF', fontSize: wp(3.5), paddingVertical: hp(3) },
});