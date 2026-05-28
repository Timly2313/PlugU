import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { wp, hp } from '../utilities/dimensions';

function SkeletonRow() {
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
  }, []);

  return (
    <Animated.View style={[s.row, { opacity }]}>
      <View style={s.circle} />
      <View style={s.lines}>
        <View style={s.lineShort} />
        <View style={s.lineLong} />
        <View style={[s.lineShort, { width: '25%' }]} />
      </View>
    </Animated.View>
  );
}

export default function NotificationSkeleton({ count = 6 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(4), paddingVertical: hp(1.6), gap: wp(3), borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#F3F4F6' },
  circle:    { width: wp(12), height: wp(12), borderRadius: wp(6), backgroundColor: '#E5E7EB', flexShrink: 0 },
  lines:     { flex: 1, gap: hp(0.8) },
  lineShort: { height: hp(1.4), backgroundColor: '#E5E7EB', borderRadius: wp(1), width: '60%' },
  lineLong:  { height: hp(1.4), backgroundColor: '#E5E7EB', borderRadius: wp(1), width: '85%' },
});