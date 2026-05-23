import React, { useRef, memo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, Dimensions,
} from 'react-native';
import { X, Send, Heart } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import Avatar from './Avatar';
import { timeAgo, formatCount } from '../utilities/communityUtils';

const PRIMARY    = '#3F51B5';
const { height: SCREEN_H } = Dimensions.get('window');

// ─── Single comment row ───────────────────────────────────────────────────────
const CommentRow = memo(({ comment }) => {
  const name = comment.profiles?.display_name ?? comment.profiles?.username ?? 'User';

  return (
    <View style={s.row}>
      {/* Avatar */}
      <Avatar uri={comment.profiles?.avatar_url} name={name} size={wp(8)} />

      {/* Body */}
      <View style={s.body}>
        {/* Top line: name + time */}
        <View style={s.topLine}>
          <Text style={s.name}>{name}</Text>
          <Text style={s.time}>{timeAgo(comment.created_at)}</Text>
        </View>

        {/* Comment text */}
        <Text style={s.content}>{comment.content}</Text>

        {/* Like button + count — stacked below text, right-aligned */}
        <View style={s.likeWrap}>
          <TouchableOpacity style={s.likeBtn} activeOpacity={0.7}>
            <Heart size={wp(3.8)} color="#9CA3AF" />
            <Text style={s.likeCount}>{formatCount(comment.like_count ?? 0)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function CommentModal({
  visible,
  postId,
  comments,
  isLoading,
  commentText,
  onChangeText,
  onSend,
  onClose,
}) {
  const inputRef = useRef(null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dim backdrop — tap to close */}
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.sheet}
      >
        {/* Handle */}
        <View style={s.handleWrap}>
          <View style={s.handle} />
        </View>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={wp(5)} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* List */}
        {isLoading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <CommentRow comment={item} />}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={s.empty}>No comments yet. Be the first!</Text>
            }
          />
        )}

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            ref={inputRef}
            style={s.input}
            value={commentText}
            onChangeText={onChangeText}
            placeholder="Write a comment…"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, !commentText.trim() && s.sendDisabled]}
            onPress={onSend}
            disabled={!commentText.trim()}
            activeOpacity={0.8}
          >
            <Send size={wp(4)} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  // ── Overlay ──
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // ── Bottom sheet ──
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_H * 0.78,
    paddingBottom: hp(2),
  },

  handleWrap: { alignItems: 'center', paddingTop: hp(1) },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: wp(4), fontWeight: '700', color: '#111827' },

  // ── List ──
  loader:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: hp(6) },
  listContent: { paddingHorizontal: wp(4), paddingTop: hp(1), paddingBottom: hp(1) },
  empty:       { textAlign: 'center', color: '#9CA3AF', fontSize: wp(3.5), paddingVertical: hp(4) },

  // ── Comment row ──
  row: {
    flexDirection: 'row',
    gap: wp(2.5),
    paddingVertical: hp(1.2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  body:    { flex: 1 },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(0.4),
  },
  name:    { fontSize: wp(3.5), fontWeight: '700', color: '#111827' },
  time:    { fontSize: wp(2.8), color: '#9CA3AF' },
  content: { fontSize: wp(3.4), color: '#374151', lineHeight: hp(2.3) },
  likeWrap:{ alignItems: 'flex-end', marginTop: hp(0.5) },
  likeBtn: { flexDirection: 'column', alignItems: 'center', gap: 2 },
  likeCount:{ fontSize: wp(2.8), color: '#9CA3AF', marginTop: 2 },

  // ── Input ──
  inputRow: {
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'flex-end',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: wp(4),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1),
    fontSize: wp(3.5),
    color: '#111827',
    maxHeight: hp(10),
  },
  sendBtn:     {
    width: wp(9), height: wp(9), borderRadius: wp(4.5),
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: '#C7D2FE' },
});