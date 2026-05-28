import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Heart, MessageCircle, CornerDownRight, UserPlus,
  Mail, ShoppingBag, CheckCircle, TrendingDown,
  Star, Bell,
} from 'lucide-react-native';
import { wp } from '../utilities/dimensions';

const ICON_MAP = {
  Heart, MessageCircle, CornerDownRight, UserPlus,
  Mail, ShoppingBag, CheckCircle, TrendingDown,
  Star, Bell,
};

export default function NotificationIcon({ iconName, color, bg, size = wp(5) }) {
  const Icon = ICON_MAP[iconName] ?? Bell;
  return (
    <View style={[s.wrap, { backgroundColor: bg, width: size * 2, height: size * 2, borderRadius: size }]}>
      <Icon size={size} color={color} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});