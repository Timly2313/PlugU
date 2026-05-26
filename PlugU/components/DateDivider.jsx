import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { hp, wp } from '../utilities/dimensions';
import { formatDateDivider } from '../utilities/conversationUtils';

export default function DateDivider({ date }) {
  return (
    <View style={s.row}>
      <View style={s.line} />
      <Text style={s.label}>{formatDateDivider(date)}</Text>
      <View style={s.line} />
    </View>
  );
}

const s = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginVertical: hp(1.5), paddingHorizontal: wp(4) },
  line:  { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },
  label: { fontSize: wp(2.8), color: '#9CA3AF', marginHorizontal: wp(3), fontWeight: '500' },
});