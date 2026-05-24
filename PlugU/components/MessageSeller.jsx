import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { MessageCircle, Send, CheckCircle } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

const QUICK_REPLIES = [
  'Is this still available?',
  'Can you do a lower price?',
  'Where can we meet?',
];

export default function MessageSeller({
  message,
  onChangeText,
  onSend,
  sending,
  messageSent,
}) {
  return (
    <View style={s.card}>
      <View style={s.header}>
        <MessageCircle size={wp(5)} color="#3F51B5" />
        <Text style={s.title}>Message Seller</Text>
      </View>

      {messageSent && (
        <View style={s.sentBanner}>
          <CheckCircle size={wp(4)} color="#10B981" />
          <Text style={s.sentText}>Message sent! The seller will respond shortly.</Text>
        </View>
      )}

      {/* Quick replies */}
      <View style={s.quickReplies}>
        {QUICK_REPLIES.map((q) => (
          <TouchableOpacity
            key={q}
            style={s.quickReply}
            onPress={() => onChangeText(q)}
          >
            <Text style={s.quickReplyText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Type your message…"
          value={message}
          onChangeText={onChangeText}
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!message.trim() || sending) && s.sendBtnDisabled]}
          onPress={onSend}
          disabled={!message.trim() || sending}
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
  card: {
    backgroundColor: '#fff', borderRadius: wp(4), padding: wp(4),
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 0,
  },
  header:      { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(1.2) },
  title:       { fontSize: wp(4), fontWeight: '700', color: '#111827' },
  sentBanner:  {
    flexDirection: 'row', alignItems: 'center', gap: wp(2),
    backgroundColor: '#ECFDF5', borderRadius: wp(2),
    paddingHorizontal: wp(3), paddingVertical: hp(1), marginBottom: hp(1.2),
  },
  sentText:    { fontSize: wp(3.3), color: '#065F46', flex: 1 },
  quickReplies:{ flexDirection: 'row', flexWrap: 'wrap', gap: wp(2), marginBottom: hp(1.5) },
  quickReply:  {
    backgroundColor: '#EEF2FF', borderRadius: wp(50),
    paddingHorizontal: wp(3.5), paddingVertical: hp(0.8),
  },
  quickReplyText: { fontSize: wp(3), color: '#3F51B5', fontWeight: '500' },
  inputRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: wp(2) },
  input: {
    flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: wp(4), paddingHorizontal: wp(4), paddingVertical: hp(1.2),
    fontSize: wp(3.5), color: '#111827', maxHeight: hp(12),
  },
  sendBtn:        { width: wp(11), height: wp(11), backgroundColor: '#3F51B5', borderRadius: wp(5.5), alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ backgroundColor: '#C7D2FE' },
});