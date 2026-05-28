import React, { useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { wp, hp } from '../utilities/dimensions';
import NotificationIcon from './NotificationIcon';
import { timeAgo, getNotificationMeta, getNotificationRoute } from '../utilities/notificationsUtils';

export default function NotificationItem({ notification, onRead }) {
  const { icon, color, bg } = getNotificationMeta(notification.type);
  const isUnread             = !notification.is_read;
  const actor                = notification.actor;
  const actorName            = actor?.display_name ?? actor?.username ?? 'Someone';

  const handlePress = useCallback(() => {
    if (isUnread) onRead(notification.id);
    const route = getNotificationRoute(notification);
    if (route) router.push(route);
  }, [notification, isUnread, onRead]);

  return (
    <TouchableOpacity
      style={[s.row, isUnread && s.rowUnread]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Unread dot */}
      {isUnread && <View style={s.unreadDot} />}

      {/* Actor avatar stacked on notification icon */}
      <View style={s.iconWrap}>
        {actor?.avatar_url ? (
          <Image source={{ uri: actor.avatar_url }} style={s.avatar} />
        ) : (
          <View style={[s.avatarFallback, { backgroundColor: bg }]}>
            <Text style={[s.avatarInitial, { color }]}>
              {actorName[0].toUpperCase()}
            </Text>
          </View>
        )}
        {/* Type badge in corner */}
        <View style={[s.typeBadge, { backgroundColor: bg }]}>
          <NotificationIcon iconName={icon} color={color} bg={bg} size={wp(2.8)} />
        </View>
      </View>

      {/* Content */}
      <View style={s.content}>
        <Text style={s.title} numberOfLines={1}>
          <Text style={s.actorName}>{actorName} </Text>
          {notification.title}
        </Text>
        {notification.body ? (
          <Text style={s.body} numberOfLines={2}>{notification.body}</Text>
        ) : null}
        <Text style={[s.time, isUnread && { color }]}>{timeAgo(notification.created_at)}</Text>
      </View>

      {/* Target thumbnail if it's a listing notification */}
      {notification.target_type === 'listing' && notification.data?.listing_image && (
        <Image source={{ uri: notification.data.listing_image }} style={s.thumb} />
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.6),
    backgroundColor: '#fff',
    gap: wp(3),
  },
  rowUnread:     { backgroundColor: '#F8F9FF' },
  unreadDot:     { position: 'absolute', left: wp(2), top: hp(2.2), width: wp(1.8), height: wp(1.8), borderRadius: wp(1), backgroundColor: '#3F51B5' },
  iconWrap:      { position: 'relative', width: wp(12), height: wp(12) },
  avatar:        { width: wp(12), height: wp(12), borderRadius: wp(6) },
  avatarFallback:{ width: wp(12), height: wp(12), borderRadius: wp(6), alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: wp(4.5), fontWeight: '700' },
  typeBadge:     { position: 'absolute', bottom: -wp(1), right: -wp(1), width: wp(5.5), height: wp(5.5), borderRadius: wp(3), alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  content:       { flex: 1, gap: hp(0.4) },
  title:         { fontSize: wp(3.5), color: '#374151', lineHeight: hp(2.3) },
  actorName:     { fontWeight: '700', color: '#111827' },
  body:          { fontSize: wp(3.2), color: '#6B7280', lineHeight: hp(2.2) },
  time:          { fontSize: wp(2.8), color: '#9CA3AF', fontWeight: '500' },
  thumb:         { width: wp(12), height: wp(12), borderRadius: wp(2), backgroundColor: '#F3F4F6' },
});