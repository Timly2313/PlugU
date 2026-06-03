import React from 'react';
import {
  View, Image, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Settings, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';

export default function ProfileBanner({
  coverUrl, onImagePress, onLogout,
}) {
  return (
    <TouchableOpacity
      activeOpacity={coverUrl ? 0.85 : 1}
      onPress={() => coverUrl && onImagePress(coverUrl)}
      style={s.wrap}
    >
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={s.image} resizeMode="cover" />
      ) : (
        <View style={s.fallback} />
      )}

      <View style={s.btns}>
        <TouchableOpacity
          style={s.btn}
          onPress={(e) => { e.stopPropagation?.(); router.push('/SettingsScreen'); }}
        >
          <Settings size={wp(4.5)} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.btn}
          onPress={(e) => { e.stopPropagation?.(); onLogout(); }}
        >
          <LogOut size={wp(4.5)} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap:    { height: hp(20), position: 'relative' },
  image:   { width: '100%', height: '100%' },
  fallback:{ width: '100%', height: '100%', backgroundColor: '#3F51B5' },
  btns:    { position: 'absolute', top: hp(1.5), right: wp(3), flexDirection: 'row', gap: wp(2) },
  btn:     { width: wp(10), height: wp(10), borderRadius: wp(5), backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
});