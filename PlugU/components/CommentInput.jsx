import React, { useRef } from 'react';
import {
  View, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

const PRIMARY = '#3F51B5';

export default function CommentInput({ value, onChangeText, onSend, sending }) {
  const ref = useRef(null);

  return (
    <View style={s.wrap}>
      <TextInput
        ref={ref}
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Write a comment…"
        placeholderTextColor="#9CA3AF"
        multiline
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={onSend}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[s.sendBtn, (!value.trim() || sending) && s.sendDisabled]}
        onPress={onSend}
        disabled={!value.trim() || sending}
      >
        {sending
          ? <ActivityIndicator size="small" color="#fff" />
          : <Send size={wp(4)} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: wp(2),
    paddingHorizontal: wp(4),
    paddingTop: hp(1.2),
    paddingBottom: Platform.OS === 'ios' ? hp(3) : hp(1.5),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: wp(50),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    fontSize: wp(3.5),
    color: '#111827',
    maxHeight: hp(10),
  },
  sendBtn:     { width: wp(10), height: wp(10), borderRadius: wp(5), backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  sendDisabled:{ backgroundColor: '#C7D2FE' },
});