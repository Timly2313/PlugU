
import React, { useState, useEffect, useCallback, memo } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Heart, MessageCircle, Send } from 'lucide-react-native';
import { hp, wp } from '../../utilities/dimensions';
import ScreenWrapper from '../../components/ScreenWrapper';
import { router } from 'expo-router';
import { postsApi } from '../../utilities/api';
import { supabase } from '../../lib/supabase';

const PAGE_LIMIT = 10;

export default function CommunityScreen() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postComments, setPostComments] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');

  // ===============================
  // FETCH POSTS (PAGINATED)
  // ===============================

  const fetchPosts = async (pageNumber = 1, refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else if (pageNumber === 1) setIsLoading(true);
      else setLoadingMore(true);

      const data = await postsApi.getFeed({
        type: 'community',
        page: pageNumber,
        limit: PAGE_LIMIT,
      });

      if (refresh || pageNumber === 1) {
        setPosts(data || []);
      } else {
        setPosts((prev) => [...prev, ...(data || [])]);
      }

      setHasMore(data?.length === PAGE_LIMIT);
      setPage(pageNumber);
    } catch (error) {
      console.error('Fetch posts error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  // ===============================
  // REALTIME SUBSCRIPTIONS
  // ===============================

  useEffect(() => {
    const channel = supabase
      .channel('community-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === payload.new.id ? payload.new : post
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ===============================
  // LIKE (Optimistic + Safe Toggle)
  // ===============================

  const handleLike = async (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              is_liked: !post.is_liked,
              likes_count: post.is_liked
                ? post.likes_count - 1
                : post.likes_count + 1,
            }
          : post
      )
    );

    try {
      await postsApi.like(postId);
    } catch (error) {
      console.error('Like failed:', error);
      fetchPosts(1, true); // rollback
    }
  };

  // ===============================
  // COMMENTS
  // ===============================

  const loadComments = async (postId) => {
    try {
      const comments = await postsApi.getComments(postId);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;

    const optimisticComment = {
      id: Date.now().toString(),
      content: commentText,
      created_at: new Date().toISOString(),
    };

    setPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), optimisticComment],
    }));

    setCommentText('');

    try {
      await postsApi.comment(postId, optimisticComment.content);
    } catch (error) {
      console.error(error);
      loadComments(postId);
    }
  };

  // ===============================
  // RENDER POST (MEMOIZED)
  // ===============================

  const PostItem = memo(({ post }) => (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: post.profiles?.avatar_url }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.authorName}>
            {post.profiles?.display_name ||
              post.profiles?.username ||
              'User'}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(post.created_at).toLocaleString()}
          </Text>
        </View>
      </View>

      <Text style={styles.postText}>{post.content}</Text>

      <View style={styles.postStats}>
        <Text>{post.likes_count || 0} likes</Text>
        <Text>{post.comments_count || 0} comments</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleLike(post.id)}>
          <Heart
            size={wp(5)}
            color={post.is_liked ? '#3F51B5' : '#6B7280'}
            fill={post.is_liked ? '#3F51B5' : 'none'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setSelectedPost(post.id);
            loadComments(post.id);
          }}
        >
          <MessageCircle size={wp(5)} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {selectedPost === post.id && (
        <View style={styles.commentsSection}>
          {postComments[post.id]?.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Text>{comment.content}</Text>
            </View>
          ))}

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => handleAddComment(post.id)}
            >
              <Send size={wp(4)} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  ));

  // ===============================
  // RENDER
  // ===============================

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/CreatePostScreen')}
          >
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <PostItem post={item} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchPosts(1, true)}
              />
            }
            onEndReached={() => {
              if (hasMore && !loadingMore) {
                fetchPosts(page + 1);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? <ActivityIndicator /> : null
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: wp(5.5),
    fontWeight: 'bold',
    color: '#111827',
  },
   createButton: {
    backgroundColor: '#3F51B5',
    borderRadius: wp(50),
    paddingHorizontal: wp(6),
    paddingVertical: hp(0.8),
  },
  createButtonText: { color: 'white', fontSize: wp(3.5), fontWeight: '600' },
  scrollView: {
    flex: 1,
  },
 
  createPostButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: '#F9FAFB',
    borderRadius: wp(50),
  },
  createPostText: {
    color: '#6B7280',
    fontSize: wp(3.5),
  },
  postsList: {
    paddingBottom: hp(2),
  },
  post: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  postHeader: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    flex: 1,
  },
  avatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: wp(3),
    fontWeight: '600',
  },
  authorName: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
  },
  timestamp: {
    fontSize: wp(2.5),
    color: '#6B7280',
    marginTop: hp(0.25),
  },
  moreButton: {
    width: wp(8),
    height: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.5),
  },
  postText: {
    fontSize: wp(3.5),
    color: '#111827',
    lineHeight: hp(2.2),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginTop: hp(1),
  },
  tag: {
    backgroundColor: '#E8EAF6',
    borderRadius: wp(50),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
  },
  tagText: {
    color: '#3F51B5',
    fontSize: wp(2.5),
  },
  postImageContainer: {
    width: '100%',
  },
  postImage: {
    width: '100%',
    height: hp(30),
  },
  videosContainer: {
    width: '100%',
    gap: hp(1),
  },
  videoContainer: {
    width: '100%',
    height: hp(25),
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    color: 'white',
    fontSize: wp(3.5),
  },
  postStats: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statText: {
    fontSize: wp(3),
    color: '#6B7280',
  },
  rightStats: {
    flexDirection: 'row',
    gap: wp(3),
  },
  postActions: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: wp(2),
  },
  actionText: {
    fontSize: wp(3.5),
    color: '#6B7280',
  },
  actionTextActive: {
    color: '#3F51B5',
  },
  commentsSection: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  commentsList: {
    gap: hp(1.5),
    marginBottom: hp(1.5),
  },
  comment: {
    flexDirection: 'row',
    gap: wp(2),
  },
  commentAvatar: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: 'white',
    fontSize: wp(2),
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: wp(2),
    padding: wp(3),
  },
  commentAuthor: {
    fontSize: wp(3),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp(0.25),
  },
  commentText: {
    fontSize: wp(3.5),
    color: '#374151',
    lineHeight: hp(2),
  },
  commentTime: {
    fontSize: wp(2.5),
    color: '#6B7280',
    marginTop: hp(0.5),
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(4),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: wp(3.5),
    color: '#111827',
    maxHeight: hp(10),
    textAlignVertical: 'center',
  },
  sendButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});