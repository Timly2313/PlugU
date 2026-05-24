import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import Avatar from '../components/Avatar';
import { timeAgo } from '../utilities/communityUtils';
import { resolveDisplayName } from '../utilities/messageUtils';

const ConversationItem = React.memo(({ item, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn  = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();

  const displayName = resolveDisplayName(item);
  const avatarUrl   = (item.participant_avatars ?? [])[0] ?? null;
  const timeLabel   = timeAgo(item.last_message_at);
  const isUnread    = (item.unread_count ?? 0) > 0;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => onPress(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          s.item,
          isUnread ? s.unread : s.read,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Avatar — uses shared Avatar component */}
        <Avatar
          uri={avatarUrl}
          name={displayName}
          size={wp(11)}
          borderWidth={0}
        />

        {/* Content */}
        <View style={s.content}>
          <View style={s.header}>
            <Text style={s.name} numberOfLines={1}>{displayName}</Text>
            <View style={s.timeWrap}>
              <Clock size={wp(3)} color="#6B7280" />
              <Text style={s.time}>{timeLabel}</Text>
            </View>
          </View>

          <Text
            style={[s.lastMsg, isUnread && s.lastMsgUnread]}
            numberOfLines={1}
          >
            {item.last_message_content ?? 'No messages yet'}
          </Text>

          {item.title ? (
            <Text style={s.listing} numberOfLines={1}>Re: {item.title}</Text>
          ) : null}
        </View>

        {/* Unread badge */}
        {isUnread && (
          <View style={s.badge}>
            <Text style={s.badgeText}>
              {item.unread_count > 99 ? '99+' : item.unread_count}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

export default ConversationItem;

const s = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: wp(4), paddingVertical: hp(1.5),
    gap: wp(3), borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB', minHeight: hp(10),
  },
  unread: { backgroundColor: 'rgba(63,81,181,0.04)' },
  read:   { backgroundColor: '#fff' },
  content: { flex: 1, minWidth: 0 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: hp(0.4), gap: wp(2),
  },
  name:        { fontSize: wp(3.8), fontWeight: '600', color: '#111827', flex: 1 },
  timeWrap:    { flexDirection: 'row', alignItems: 'center', gap: wp(0.8), flexShrink: 0 },
  time:        { fontSize: wp(2.5), color: '#6B7280' },
  lastMsg:     { fontSize: wp(3.3), color: '#6B7280', marginBottom: hp(0.4) },
  lastMsgUnread: { color: '#374151', fontWeight: '500' },
  listing:     { fontSize: wp(2.5), color: '#3F51B5' },
  badge: {
    backgroundColor: '#3F51B5', borderRadius: wp(3),
    minWidth: wp(5), height: wp(5), alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: wp(1), flexShrink: 0,
  },
  badgeText: { color: '#fff', fontSize: wp(2.5), fontWeight: '700' },
});