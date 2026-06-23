import React, { useRef, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { X, Send, Heart } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import Avatar from './Avatar';
import { timeAgo, formatCount } from '../utilities/communityUtils';

const PRIMARY = '#111';
const { height: SCREEN_H } = Dimensions.get('window');

// ─── Comment Row ──────────────────────────────────────────────────────────────
const CommentRow = memo(({ comment, onLike }) => {
  const name =
    comment.profiles?.display_name ??
    comment.profiles?.username ??
    'User';

  const liked = comment.is_liked ?? false;

  return (
    <View style={s.commentRow}>
      <Avatar uri={comment.profiles?.avatar_url} name={name} size={wp(9)} />

      <View style={s.commentBody}>
        <View style={s.commentHeader}>
          <View style={{ flex: 1 }}>
            <View style={s.nameRow}>
              <Text style={s.name}>{name}</Text>
              <Text style={s.time}>{timeAgo(comment.created_at)}</Text>
            </View>
            <Text style={s.commentText}>{comment.content}</Text>
          </View>

          {/* Like button — icon stacked above count */}
          <TouchableOpacity
            style={s.likeButton}
            activeOpacity={0.7}
            onPress={() => {
              onLike(comment.id);
            }}
          >
            <Heart
              size={wp(4)}
              color={liked ? '#EF4444' : '#9CA3AF'}
              fill={liked ? '#EF4444' : 'none'}
            />
            <Text style={[s.likeCount, liked && s.likeCountActive]}>
              {formatCount(comment.like_count ?? 0)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CommentModal({
  visible,
  comments,
  isLoading,
  commentText,
  onChangeText,
  onSend,
  onClose,
  onLikeComment,
}) {
  const inputRef = useRef(null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      {/* 
        Single KeyboardAvoidingView wraps everything.
        The backdrop tap closes the modal.
        The sheet sits at the bottom and is NOT wrapped in 
        TouchableWithoutFeedback so taps inside work normally.
      */}
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Dim backdrop — tap outside sheet to close */}
        <TouchableOpacity
          style={s.backdrop}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />

        {/* Sheet — stop touch propagation to backdrop */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={s.sheet}>
            {/* Handle */}
            <View style={s.handleWrap}>
              <View style={s.handle} />
            </View>

            {/* Header */}
            <View style={s.header}>
              <Text style={s.headerTitle}>
                {comments?.length || 0} comments
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={wp(5)} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Comments list */}
            {isLoading ? (
              <View style={s.loader}>
                <ActivityIndicator size="large" color={PRIMARY} />
              </View>
            ) : (
              <FlatList
                data={comments}
                style={s.list}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <CommentRow
                    comment={item}
                    onLike={onLikeComment}
                  />
                )}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.listContent}
                ListEmptyComponent={
                  <Text style={s.emptyText}>No comments yet</Text>
                }
              />
            )}

            {/* Input bar — inside the sheet, above keyboard */}
            <View style={s.inputContainer}>
              <TextInput
                ref={inputRef}
                value={commentText}
                onChangeText={onChangeText}
                placeholder="Add a comment..."
                placeholderTextColor="#9CA3AF"
                multiline
                style={s.input}
                maxLength={500}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={onSend}
              />
              <TouchableOpacity
                onPress={onSend}
                disabled={!commentText?.trim()}
                style={[
                  s.sendButton,
                  !commentText?.trim() && s.sendDisabled,
                ]}
                activeOpacity={0.8}
              >
                <Send size={wp(4)} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Full screen root
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  // Backdrop fills everything above the sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  // Bottom sheet
  sheet: {
    height: SCREEN_H * 0.75,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  // Handle
  handleWrap: {
    alignItems: 'center',
    paddingTop: hp(1),
    paddingBottom: hp(0.8),
  },
  handle: {
    width: wp(12),
    height: 4,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: wp(3.8),
    fontWeight: '700',
    color: '#111827',
  },

  // List
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: hp(4),
    color: '#9CA3AF',
    fontSize: wp(3.5),
  },

  // Comment row
  commentRow: {
    flexDirection: 'row',
    marginBottom: hp(2.2),
    gap: wp(2.5),
  },
  commentBody: { flex: 1 },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: wp(2),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(0.4),
  },
  name: {
    fontSize: wp(3.4),
    fontWeight: '700',
    color: '#111827',
  },
  time: {
    fontSize: wp(2.8),
    color: '#9CA3AF',
  },
  commentText: {
    fontSize: wp(3.45),
    color: '#374151',
    lineHeight: hp(2.4),
    paddingRight: wp(5),
  },

  // Like
  likeButton: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 3,
    paddingTop: hp(0.2),
    minWidth: wp(8),
  },
  likeCount: {
    fontSize: wp(2.7),
    color: '#9CA3AF',
  },
  likeCountActive: {
    color: '#EF4444',
  },

  // Input bar
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: wp(3.5),
    color: '#111827',
    maxHeight: hp(12),
  },
  sendButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    marginLeft: wp(2),
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: { opacity: 0.4 },
});