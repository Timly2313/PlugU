import React from 'react';
import {
  View, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

export default function MessageInput({ value, onChangeText, onSend, sending }) {
  const canSend = value.trim().length > 0 && !sending;

  return (
    <View style={s.container}>
      <View style={s.row}>
        <TextInput
          style={s.input}
          placeholder="Type a message…"
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
          onPress={onSend}
          disabled={!canSend}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Send size={wp(4)} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.5),
    paddingBottom: Platform.OS === 'ios' ? hp(3) : hp(1.5),
  },
  row:           { flexDirection: 'row', gap: wp(2), alignItems: 'flex-end' },
  input: {
    flex: 1, backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: wp(6), paddingHorizontal: wp(4),
    paddingVertical: hp(1.2), fontSize: wp(3.8),
    color: '#111827', maxHeight: hp(12), textAlignVertical: 'top',
  },
  sendBtn:        { width: wp(11), height: wp(11), borderRadius: wp(5.5), backgroundColor: '#3F51B5', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ backgroundColor: '#C7D2FE' },
});