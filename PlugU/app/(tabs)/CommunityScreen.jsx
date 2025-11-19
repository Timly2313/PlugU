import React, { useState, useEffect  } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, StyleSheet, FlatList} from 'react-native';
import { Heart, MessageCircle, Share2, MoreVertical, Send } from 'lucide-react-native';
import { hp, wp } from '../../utilities/dimensions';
import ScreenWrapper from '../../components/ScreenWrapper';
import { router } from 'expo-router';
const mockPosts = [
  {
    id: '1',
    author: { name: 'Sarah Johnson', avatar: 'SJ' },
    content: 'Just listed some amazing furniture pieces! Check them out on my profile. Great condition and prices! 🛋️',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',
    likes: 24,
    comments: 5,
    shares: 2,
    timestamp: '2h ago',
    isLiked: false,
  },
  {
    id: '2',
    author: { name: 'Mike Chen', avatar: 'MC' },
    content: 'Looking for vintage bikes in the Bay Area. Any recommendations? 🚲',
    likes: 12,
    comments: 8,
    shares: 1,
    timestamp: '5h ago',
    isLiked: true,
  },
  {
    id: '3',
    author: { name: 'Emma Davis', avatar: 'ED' },
    content: 'Huge thanks to this community! Sold my laptop within 24 hours. Best marketplace ever! 💻',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=400&fit=crop',
    likes: 45,
    comments: 12,
    shares: 5,
    timestamp: '1d ago',
    isLiked: false,
  },
  {
    id: '4',
    author: { name: 'Alex Rodriguez', avatar: 'AR' },
    content: 'Pro tip: Always meet in public places for safety! Stay safe everyone 🙏',
    likes: 67,
    comments: 15,
    shares: 18,
    timestamp: '2d ago',
    isLiked: true,
  },
];

export default function CommunityScreen({  newPostData }) {
  const [posts, setPosts] = useState(mockPosts);
  const [commentText, setCommentText] = useState('');
  const [postComments, setPostComments] = useState({});
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);


  const onViewProfile = (avatar) => {
    router.push({ pathname: "/UserProfileScreen", params: { userAvatar: avatar } });
  };
  
  useEffect(() => {
    if (newPostData && !posts.find(p => p.id === newPostData.id)) {
      setPosts([newPostData, ...posts]);
    }
    }, [newPostData]);

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
        : post
    ));
  };

  const handleAddComment = (postId) => {
    if (commentText.trim()) {
      const comment = {
        id: Date.now().toString(),
        author: { name: 'John Doe', avatar: 'JD' },
        text: commentText,
        timestamp: 'Just now',
      };
      
      setPostComments({
        ...postComments,
        [postId]: [...(postComments[postId] || []), comment],
      });

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: post.comments + 1 }
          : post
      ));
      
      setCommentText('');
    }
  };

  const handleShare = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, shares: post.shares + 1 }
        : post
    ));
    Alert.alert('Success', 'Post shared successfully!');
  };

  const renderPost = ({ item: post }) => (
    <View style={styles.post}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.authorInfo}
          onPress={() => onViewProfile(post.author.avatar)}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.author.avatar}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <Text style={styles.timestamp}>{post.timestamp}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={wp(4)} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={styles.postText}>{post.content}</Text>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Post Image */}
      {post.image && (
        <View style={styles.postImageContainer}>
          <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
        </View>
      )}

      {/* Post Videos */}
      {post.videos && post.videos.length > 0 && (
        <View style={styles.videosContainer}>
          {post.videos.map((video, idx) => (
            <View key={idx} style={styles.videoContainer}>
              <Text style={styles.videoPlaceholder}>Video Content</Text>
            </View>
          ))}
        </View>
      )}

      {/* Post Stats */}
      <View style={styles.postStats}>
        <Text style={styles.statText}>{post.likes} likes</Text>
        <View style={styles.rightStats}>
          <Text style={styles.statText}>{post.comments} comments</Text>
          <Text style={styles.statText}>{post.shares} shares</Text>
        </View>
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(post.id)}
          activeOpacity={0.7}
        >
          <Heart 
            size={wp(5)} 
            color={post.isLiked ? '#3F51B5' : '#6B7280'}
            fill={post.isLiked ? '#3F51B5' : 'none'}
          />
          <Text style={[
            styles.actionText,
            post.isLiked && styles.actionTextActive
          ]}>Like</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setSelectedPostForComments(selectedPostForComments === post.id ? null : post.id)}
          activeOpacity={0.7}
        >
          <MessageCircle size={wp(5)} color="#6B7280" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare(post.id)}
          activeOpacity={0.7}
        >
          <Share2 size={wp(5)} color="#6B7280" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {selectedPostForComments === post.id && (
        <View style={styles.commentsSection}>
          {/* Existing Comments */}
          {postComments[post.id] && postComments[post.id].length > 0 && (
            <View style={styles.commentsList}>
              {postComments[post.id].map((comment) => (
                <View key={comment.id} style={styles.comment}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{comment.author.avatar}</Text>
                  </View>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                    <Text style={styles.commentText}>{comment.text}</Text>
                    <Text style={styles.commentTime}>{comment.timestamp}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* Add Comment Input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={commentText}
              onChangeText={setCommentText}
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={() => handleAddComment(post.id)}
              disabled={!commentText.trim()}
            >
              <Send size={wp(4)} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <ScreenWrapper bg={"#F9FAFB"}>
       <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>

          <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/CreatePostScreen")}
        >
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
        </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Posts Feed */}
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.postsList}
        />
      </ScrollView>
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