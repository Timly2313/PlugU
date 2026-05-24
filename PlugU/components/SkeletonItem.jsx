import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { hp, wp } from '../utilities/dimensions';

export default function SkeletonItem() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[s.row, { opacity }]}>
      <View style={s.avatar} />
      <View style={s.content}>
        <View style={s.line} />
        <View style={[s.line, { width: '60%', marginTop: hp(0.8) }]} />
        <View style={[s.line, { width: '35%', marginTop: hp(0.8) }]} />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: wp(4), paddingVertical: hp(1.5),
    gap: wp(3), borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB', minHeight: hp(10),
  },
  avatar:  { width: wp(11), height: wp(11), borderRadius: wp(5.5), backgroundColor: '#E5E7EB', flexShrink: 0 },
  content: { flex: 1 },
  line:    { height: hp(1.4), backgroundColor: '#E5E7EB', borderRadius: wp(1), width: '80%' },
});