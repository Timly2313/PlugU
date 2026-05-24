import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle, AlertCircle, RefreshCw } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

export default function EmptyState({ error, onRetry }) {
  if (error) {
    return (
      <View style={s.wrap}>
        <AlertCircle size={wp(14)} color="#EF4444" />
        <Text style={s.title}>Couldn't load messages</Text>
        <Text style={s.desc}>{error}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <RefreshCw size={wp(4)} color="#fff" />
          <Text style={s.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <MessageCircle size={wp(16)} color="#D1D5DB" />
      <Text style={s.title}>No messages yet</Text>
      <Text style={s.desc}>
        When someone contacts you about a listing, you'll see it here.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: wp(8), paddingVertical: hp(10),
  },
  title:    { fontSize: wp(4.5), fontWeight: '600', color: '#111827', marginTop: hp(2), marginBottom: hp(1), textAlign: 'center' },
  desc:     { fontSize: wp(3.5), color: '#6B7280', textAlign: 'center', lineHeight: hp(2.5) },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: wp(2), marginTop: hp(3),
    backgroundColor: '#3F51B5', paddingHorizontal: wp(5), paddingVertical: hp(1.4), borderRadius: wp(2),
  },
  retryText: { color: '#fff', fontSize: wp(3.5), fontWeight: '600' },
});