import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { hp, wp } from '../utilities/dimensions';

const PRIMARY = '#3F51B5';

export default function AuthorRow({ profile }) {
  const name    = profile?.display_name ?? profile?.username ?? 'You';
  const initial = (profile?.display_name?.[0] ?? profile?.username?.[0] ?? 'U').toUpperCase();

  return (
    <View style={s.row}>
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
      ) : (
        <View style={s.avatarFallback}>
          <Text style={s.initial}>{initial}</Text>
        </View>
      )}
      <View>
        <Text style={s.name}>{name}</Text>
        <Text style={s.visibility}>Community · visible instantly</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'center', gap: wp(3), paddingVertical: hp(0.5) },
  avatar:        { width: wp(11), height: wp(11), borderRadius: wp(5.5), backgroundColor: '#E5E7EB' },
  avatarFallback:{ width: wp(11), height: wp(11), borderRadius: wp(5.5), backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
  initial:       { color: '#fff', fontWeight: '800', fontSize: wp(4.5) },
  name:          { fontSize: wp(3.8), fontWeight: '700', color: '#111827' },
  visibility:    { fontSize: wp(2.8), color: '#9CA3AF', marginTop: hp(0.2) },
});