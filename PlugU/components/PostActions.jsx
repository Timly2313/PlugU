import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

const PRIMARY = '#3F51B5';

export default function PostActions({ post, onLike, onShare }) {
  return (
    <View style={s.row}>
      <TouchableOpacity
        style={s.btn}
        onPress={onLike}
        activeOpacity={0.7}
      >
        <Heart
          size={wp(5)}
          color={post.is_liked ? PRIMARY : '#6B7280'}
          fill={post.is_liked ? PRIMARY : 'none'}
        />
        <Text style={[s.label, post.is_liked && { color: PRIMARY }]}>Like</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.btn} activeOpacity={0.7}>
        <MessageCircle size={wp(5)} color="#6B7280" />
        <Text style={s.label}>Comment</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.btn} onPress={onShare} activeOpacity={0.7}>
        <Share2 size={wp(5)} color="#6B7280" />
        <Text style={s.label}>Share</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row:   { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
  btn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(2), paddingVertical: hp(1.5) },
  label: { fontSize: wp(3.5), color: '#6B7280', fontWeight: '500' },
});