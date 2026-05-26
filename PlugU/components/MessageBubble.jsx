import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { hp, wp } from '../utilities/dimensions';
import { formatMessageTime, getInitials } from '../utilities/conversationUtils';

export default function MessageBubble({ item, isMe, showAvatar }) {
  const initials = getInitials(item.sender_username ?? '');

  return (
    <View style={[s.wrapper, isMe ? s.wrapperMe : s.wrapperThem]}>
      {/* Avatar slot — only for other people's messages */}
      {!isMe && (
        <View style={s.avatarSlot}>
          {showAvatar ? (
            item.sender_avatar_url ? (
              <Image source={{ uri: item.sender_avatar_url }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
            )
          ) : (
            <View style={s.avatarSpacer} />
          )}
        </View>
      )}

      <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
        <Text style={[s.text, isMe ? s.textMe : s.textThem]}>
          {item.content}
        </Text>

        <View style={s.meta}>
          <Text style={[s.time, isMe ? s.timeMe : s.timeThem]}>
            {formatMessageTime(item.created_at)}
          </Text>
          {isMe && (
            <Text style={s.status}>
              {item.status === 'read'      ? '✓✓'
               : item.status === 'failed' ? '✗'
               : item.status === 'sending' ? '○'
               : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:       { flexDirection: 'row', marginBottom: hp(0.6), paddingHorizontal: wp(4) },
  wrapperMe:     { justifyContent: 'flex-end' },
  wrapperThem:   { justifyContent: 'flex-start' },
  avatarSlot:    { width: wp(8), marginRight: wp(2), justifyContent: 'flex-end' },
  avatar:        { width: wp(7), height: wp(7), borderRadius: wp(3.5) },
  avatarFallback:{ width: wp(7), height: wp(7), borderRadius: wp(3.5), backgroundColor: '#3F51B5', alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: '#fff', fontSize: wp(2.5), fontWeight: '600' },
  avatarSpacer:  { width: wp(7) },
  bubble:        { maxWidth: '75%', borderRadius: wp(5), paddingHorizontal: wp(4), paddingVertical: hp(1.1) },
  bubbleMe:      { backgroundColor: '#3F51B5', borderBottomRightRadius: wp(1.5) },
  bubbleThem:    { backgroundColor: '#fff', borderBottomLeftRadius: wp(1.5), borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
  text:          { fontSize: wp(3.8), lineHeight: hp(2.6) },
  textMe:        { color: '#fff' },
  textThem:      { color: '#111827' },
  meta:          { flexDirection: 'row', alignItems: 'center', gap: wp(1), marginTop: hp(0.4), justifyContent: 'flex-end' },
  time:          { fontSize: wp(2.3) },
  timeMe:        { color: 'rgba(255,255,255,0.65)' },
  timeThem:      { color: '#9CA3AF' },
  status:        { fontSize: wp(2.3), color: 'rgba(255,255,255,0.65)' },
});