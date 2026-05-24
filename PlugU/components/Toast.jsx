import React, { useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

export default function Toast({ visible, message, type = 'success' }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: visible ? 0 : 20, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        s.toast,
        type === 'error' && s.toastError,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <CheckCircle size={wp(4)} color="#fff" />
      <Text style={s.text}>{message}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: hp(4), alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: wp(2),
    backgroundColor: '#002457ff',
    paddingHorizontal: wp(5), paddingVertical: hp(1.4),
    borderRadius: wp(50),
    shadowColor: '#000000ff', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  toastError: { backgroundColor: '#EF4444' },
  text: { color: '#fff', fontSize: wp(3.5), fontWeight: '500' },
});