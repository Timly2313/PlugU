import React, { memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Heart } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import Avatar from '../components/Avatar';
import { timeAgo, formatCount } from '../utilities/communityUtils';

const CommentItem = memo(({ comment, onLike }) => {
  const name = comment.profiles?.display_name ?? comment.profiles?.username ?? 'User';

  return (
    <View style={s.row}>
      <Avatar uri={comment.profiles?.avatar_url} name={name} size={wp(9)} borderWidth={0} />
      <View style={s.body}>
        {/* Name + time */}
        <View style={s.topLine}>
          <Text style={s.name}>{name}</Text>
          <Text style={s.time}>{timeAgo(comment.created_at)}</Text>
        </View>
        {/* Text */}
        <Text style={s.text}>{comment.content}</Text>
      </View>

      {/* Like */}
      <TouchableOpacity style={s.likeBtn} onPress={() => onLike(comment.id)}>
        <Heart
          size={wp(4)}
          color={comment.is_liked ? '#EF4444' : '#9CA3AF'}
          fill={comment.is_liked ? '#EF4444' : 'none'}
        />
        <Text style={[s.likeCount, comment.is_liked && s.likeCountActive]}>
          {formatCount(comment.like_count ?? 0)}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

export default CommentItem;

const s = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: wp(4), paddingVertical: hp(1.5), gap: wp(3), borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#F3F4F6' },
  body:          { flex: 1 },
  topLine:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: hp(0.4) },
  name:          { fontSize: wp(3.5), fontWeight: '700', color: '#111827' },
  time:          { fontSize: wp(2.8), color: '#9CA3AF' },
  text:          { fontSize: wp(3.5), color: '#374151', lineHeight: hp(2.4) },
  likeBtn:       { alignItems: 'center', gap: hp(0.3), paddingTop: hp(0.3) },
  likeCount:     { fontSize: wp(2.8), color: '#9CA3AF' },
  likeCountActive:{ color: '#EF4444' },
});