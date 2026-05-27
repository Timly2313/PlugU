import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

export default function EmptyState({ onBrowse }) {
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Heart size={wp(10)} color="#9CA3AF" />
      </View>
      <Text style={s.title}>No Saved Listings</Text>
      <Text style={s.desc}>
        Start saving items you're interested in by tapping the bookmark icon on any listing.
      </Text>
      <TouchableOpacity style={s.btn} onPress={onBrowse}>
        <Text style={s.btnText}>Browse Listings</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(8), paddingVertical: hp(10) },
  iconWrap: { width: wp(20), height: wp(20), borderRadius: wp(10), backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: hp(2) },
  title:    { fontSize: wp(4.5), fontWeight: '600', color: '#111827', marginBottom: hp(1) },
  desc:     { fontSize: wp(3.5), color: '#6B7280', textAlign: 'center', lineHeight: hp(2.2), marginBottom: hp(3), maxWidth: wp(80) },
  btn:      { backgroundColor: '#3F51B5', borderRadius: wp(4), paddingHorizontal: wp(6), paddingVertical: hp(1.2) },
  btnText:  { color: '#fff', fontSize: wp(3.5), fontWeight: '600' },
});