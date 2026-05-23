import React, { useCallback, useRef } from 'react';
import {
  View, Text, FlatList, RefreshControl,
  ActivityIndicator, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PlusSquare } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../../utilities/dimensions';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../context/authContext';
import { useFeed } from '../../hooks/useFeed';
import { useComments } from '../../hooks/useComments';
import PostItem from '../../components/PostItem';
import CommentModal from '../../components/CommentModal';

const PRIMARY = '#3F51B5';

export default function CommunityScreen() {
  const { profile: currentUser } = useAuth();

  const {
    posts, setPosts,
    isLoading, isRefreshing, loadingMore,
    handleLike, loadMore, refresh,
  } = useFeed(currentUser?.id);

  const {
    activePostId,
    comments,
    isLoadingComments,
    commentText,
    setCommentText,
    openComments,
    closeComments,
    sendComment,
    likeComment,
  } = useComments(currentUser, setPosts);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const [visibleIds, setVisibleIds] = React.useState(new Set());
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    setVisibleIds(new Set(viewableItems.map((vi) => vi.item.id)));
  }).current;

  const renderItem = useCallback(({ item }) => (
    <PostItem
      post={item}
      isVisible={visibleIds.has(item.id)}
      onLike={handleLike}
      onOpenComments={openComments}
    />
  ), [visibleIds, handleLike, openComments]);

  const renderSeparator = () => <View style={s.separator} />;

  const renderFooter = () =>
    loadingMore
      ? <View style={s.footerLoader}><ActivityIndicator size="small" color={PRIMARY} /></View>
      : null;

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={s.empty}>
        <PlusSquare size={wp(14)} color="#C7D2FE" />
        <Text style={s.emptyTitle}>Nothing here yet</Text>
        <Text style={s.emptySub}>Be the first to post something</Text>
        <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/CreatePostScreen')}>
          <Text style={s.emptyBtnText}>Create Post</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenWrapper bg="#fff">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={hp(10)}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Community</Text>
          <TouchableOpacity
            style={s.createBtn}
            onPress={() => router.push('/CreatePostScreen')}
            activeOpacity={0.85}
          >
            <PlusSquare size={wp(4)} color="#fff" />
            <Text style={s.createBtnText}>Post</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={renderSeparator}
            contentContainerStyle={s.feedContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh}
                tintColor={PRIMARY}
                colors={[PRIMARY]}
              />
            }
            onEndReached={loadMore}
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

      {/* Comment modal — single instance, driven by activePostId */}
      <CommentModal
        visible={!!activePostId}
        postId={activePostId}
        comments={comments}
        isLoading={isLoadingComments}
        commentText={commentText}
        onChangeText={setCommentText}
        onSend={sendComment}
        onClose={closeComments}
        onLikeComment={likeComment} 
      />
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: wp(5.5), fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: wp(1.5),
    backgroundColor: PRIMARY, paddingHorizontal: wp(4),
    paddingVertical: hp(0.8), borderRadius: wp(50),
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: wp(3.5) },
  loader:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  feedContent:   { paddingBottom: hp(10) },
  separator:     { height: hp(1), backgroundColor: '#F3F4F6' },
  footerLoader:  { paddingVertical: hp(2), alignItems: 'center' },
  empty:         { alignItems: 'center', paddingTop: hp(8), paddingHorizontal: wp(10), gap: hp(1) },
  emptyTitle:    { fontSize: wp(4.5), fontWeight: '700', color: '#374151', marginTop: hp(1) },
  emptySub:      { fontSize: wp(3.5), color: '#9CA3AF', textAlign: 'center', lineHeight: hp(2.4) },
  emptyBtn:      { marginTop: hp(1.5), backgroundColor: PRIMARY, paddingHorizontal: wp(6), paddingVertical: hp(1.4), borderRadius: wp(50) },
  emptyBtnText:  { color: '#fff', fontWeight: '700', fontSize: wp(3.8) },
});