import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { wp } from '../utilities/dimensions';
import { notificationsService } from '../services/notificationsService';

export default function NotificationBell({ color = '#111827' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    notificationsService.getUnreadCount()
      .then(setCount)
      .catch(() => {});
  }, []);

  return (
    <TouchableOpacity
      style={s.wrap}
      onPress={() => router.push('/NotificationScreen')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Bell size={wp(5.5)} color={color} />
      {count > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap:      { position: 'relative', padding: wp(1) },
  badge:     { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', minWidth: wp(4.5), height: wp(4.5), borderRadius: wp(2.5), alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(1) },
  badgeText: { color: '#fff', fontSize: wp(2.2), fontWeight: '800' },
});