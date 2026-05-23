import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Image, Modal, TouchableOpacity,
  FlatList, Animated, PanResponder, StyleSheet,
  Dimensions, StatusBar as RNStatusBar,
} from 'react-native';
import { X } from 'lucide-react-native';
import { wp } from '../utilities/dimensions';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STATUS_BAR_H = RNStatusBar.currentHeight ?? 44;

export default function ImageLightbox({ visible, urls, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const flatListRef = useRef(null);

  const translateY = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(1)).current;
  const scaleVal   = useRef(1);
  const lastDist   = useRef(null);

  const bgOpacity = translateY.interpolate({
    inputRange: [-SCREEN_H * 0.3, 0, SCREEN_H * 0.3],
    outputRange: [0.2, 1, 0.2],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      translateY.setValue(0);
      scale.setValue(1);
      scaleVal.current = 1;
      lastDist.current = null;
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 50);
    }
  }, [visible, initialIndex]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }),
      Animated.timing(scale,      { toValue: 0.75,     duration: 250, useNativeDriver: true }),
    ]).start(onClose);
  }, [onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (lastDist.current !== null) {
            const delta = dist - lastDist.current;
            scaleVal.current = Math.min(4, Math.max(1, scaleVal.current + delta * 0.01));
            scale.setValue(scaleVal.current);
          }
          lastDist.current = dist;
          return;
        }
        lastDist.current = null;
        if (scaleVal.current <= 1.05) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        lastDist.current = null;
        if (Math.abs(gs.dy) > SCREEN_H * 0.2 && scaleVal.current <= 1.05) {
          dismiss();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 120 }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <Animated.View style={[s.backdrop, { opacity: bgOpacity }]} />

      <TouchableOpacity
        style={s.closeBtn} onPress={dismiss}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <X size={wp(6)} color="#fff" />
      </TouchableOpacity>

      {urls.length > 1 && (
        <View style={s.counter}>
          <Text style={s.counterText}>{index + 1} / {urls.length}</Text>
        </View>
      )}

      {urls.length > 1 && (
        <View style={s.dots}>
          {urls.map((_, i) => (
            <View key={i} style={[s.dot, i === index && s.dotActive]} />
          ))}
        </View>
      )}

      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateY }, { scale }] }]}
        {...panResponder.panHandlers}
      >
        <FlatList
          ref={flatListRef}
          data={urls}
          keyExtractor={(_, i) => String(i)}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={scaleVal.current <= 1.05}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          onMomentumScrollEnd={(e) => {
            const newIdx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setIndex(newIdx);
            scale.setValue(1);
            scaleVal.current = 1;
          }}
          renderItem={({ item }) => (
            <View style={s.page}>
              <Image source={{ uri: item }} style={s.image} resizeMode="contain" />
            </View>
          )}
        />
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  closeBtn:    {
    position: 'absolute', top: STATUS_BAR_H + 8, right: wp(4), zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: 8,
  },
  counter:     {
    position: 'absolute', top: STATUS_BAR_H + 14, alignSelf: 'center', zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  counterText: { color: '#fff', fontSize: wp(3.2), fontWeight: '600' },
  dots:        {
    position: 'absolute', bottom: 48, alignSelf: 'center',
    zIndex: 20, flexDirection: 'row', gap: 6,
  },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive:   { backgroundColor: '#fff', width: 18, borderRadius: 3 },
  page:        { width: SCREEN_W, height: SCREEN_H, justifyContent: 'center', alignItems: 'center' },
  image:       { width: SCREEN_W, height: SCREEN_H },
});