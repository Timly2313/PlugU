import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import { getInitials } from '../utilities/conversationUtils';

export default function ConversationHeader({ displayName, listingTitle, avatarUrl, onBack, isOnline }) {
  const initials = getInitials(displayName);

  return (
    <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <ArrowLeft size={wp(5)} color="#374151" />
      </TouchableOpacity>

      <View style={s.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={s.avatar} />
        ) : (
          <View style={s.avatarFallback}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        )}
        {/* Online indicator dot */}
        {isOnline && (
          <View style={s.onlineDot}>
            <View style={s.onlineDotInner} />
          </View>
        )}
      </View>

      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{displayName}</Text>
        {isOnline ? (
          <Text style={s.onlineText}>Online</Text>
        ) : (
          !!listingTitle && (
            <Text style={s.sub} numberOfLines={1}>Re: {listingTitle}</Text>
          )
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header:        { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: wp(4), paddingVertical: hp(1.5), flexDirection: 'row', alignItems: 'center', gap: wp(3) },
  backBtn:       { width: wp(9), height: wp(9), borderRadius: wp(4.5), alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  avatarWrap:    { position: 'relative' },
  avatar:        { width: wp(10), height: wp(10), borderRadius: wp(5) },
  avatarFallback:{ width: wp(10), height: wp(10), borderRadius: wp(5), backgroundColor: '#3F51B5', alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: '#fff', fontSize: wp(3.5), fontWeight: '600' },
  onlineDot:     { position: 'absolute', bottom: 0, right: 0, width: wp(3), height: wp(3), borderRadius: wp(1.5), backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  onlineDotInner:{ width: wp(2.2), height: wp(2.2), borderRadius: wp(1.1), backgroundColor: '#22C55E' },
  info:          { flex: 1, minWidth: 0 },
  name:          { fontSize: wp(4.2), fontWeight: '700', color: '#111827' },
  sub:           { fontSize: wp(2.8), color: '#6B7280', marginTop: hp(0.2) },
  onlineText:    { fontSize: wp(2.8), color: '#22C55E', marginTop: hp(0.2), fontWeight: '500' },
});