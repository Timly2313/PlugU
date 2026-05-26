import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { hp, wp } from '../utilities/dimensions';

export default function EmptyMessages() {
  return (
    <View style={s.wrap}>
      <Text style={s.text}>No messages yet. Say hello!</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingTop: hp(10) },
  text: { color: '#9CA3AF', fontSize: wp(3.5) },
});