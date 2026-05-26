import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import { getInitials } from '../utilities/conversationUtils';

export default function ConversationHeader({ displayName, listingTitle, avatarUrl, onBack }) {
  const initials = getInitials(displayName);

  return (
    <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <ArrowLeft size={wp(5)} color="#374151" />
      </TouchableOpacity>

      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={s.avatar} />
      ) : (
        <View style={s.avatarFallback}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
      )}

      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{displayName}</Text>
        {!!listingTitle && (
          <Text style={s.sub} numberOfLines={1}>Re: {listingTitle}</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header:        { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: wp(4), paddingVertical: hp(1.5), flexDirection: 'row', alignItems: 'center', gap: wp(3) },
  backBtn:       { width: wp(9), height: wp(9), borderRadius: wp(4.5), alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  avatar:        { width: wp(10), height: wp(10), borderRadius: wp(5) },
  avatarFallback:{ width: wp(10), height: wp(10), borderRadius: wp(5), backgroundColor: '#3F51B5', alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: '#fff', fontSize: wp(3.5), fontWeight: '600' },
  info:          { flex: 1, minWidth: 0 },
  name:          { fontSize: wp(4.2), fontWeight: '700', color: '#111827' },
  sub:           { fontSize: wp(2.8), color: '#6B7280', marginTop: hp(0.2) },
});