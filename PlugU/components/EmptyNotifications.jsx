import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

export default function EmptyNotifications({ unreadOnly }) {
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Bell size={wp(10)} color="#C7D2FE" />
      </View>
      <Text style={s.title}>
        {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
      </Text>
      <Text style={s.sub}>
        {unreadOnly
          ? "You're all caught up!"
          : "When someone likes, comments or follows you, it'll show up here."}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(10), paddingVertical: hp(10) },
  iconWrap:{ width: wp(22), height: wp(22), borderRadius: wp(11), backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: hp(2) },
  title:   { fontSize: wp(4.2), fontWeight: '700', color: '#374151', marginBottom: hp(0.8), textAlign: 'center' },
  sub:     { fontSize: wp(3.4), color: '#9CA3AF', textAlign: 'center', lineHeight: hp(2.4) },
});