import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Dimensions, Animated
} from 'react-native';
import { hp, wp } from '../utilities/dimensions';
import { resolveCta } from '../hooks/useBanners';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_H = hp(28);
const AUTO_SCROLL_MS = 6000;
const HORIZONTAL_MARGIN = wp(1); 


export default function HeroBanner({ banners }) {
  const [index, setIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  // Clear and restart timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % banners.length;
        Animated.timing(translateX, {
          toValue: -next * SCREEN_W,
          duration: 400,
          useNativeDriver: true,
        }).start();
        return next;
      });
    }, AUTO_SCROLL_MS);
  }, [banners.length, clearTimer, translateX]);

  const goTo = useCallback((i) => {
    const clamped = Math.max(0, Math.min(i, banners.length - 1));
    setIndex(clamped);
    Animated.timing(translateX, {
      toValue: -clamped * SCREEN_W,
      duration: 350,
      useNativeDriver: true,
    }).start();
    startTimer(); // Reset timer on manual navigation
  }, [banners.length, startTimer, translateX]);

  // Auto-advance
  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  if (!banners.length) return null;

  return (
    <View style={s.wrap}>
      {/* Slides */}
      <View style={s.overflow}>
        <Animated.View
          style={[
            s.track,
            { width: SCREEN_W * banners.length, transform: [{ translateX }] },
          ]}
        >
          {banners.map((banner) => {
            const onPress = resolveCta(banner);
            return (
              <TouchableOpacity
                key={banner.id}
                style={s.slide}
                activeOpacity={onPress ? 0.9 : 1}
                onPress={onPress ?? undefined}
              >
                <Image source={{ uri: banner.image_url }} style={s.image} resizeMode="cover" />

                {/* Gradient overlay */}
                <View style={s.overlay} />

                {/* Text */}
                {(banner.title || banner.subtitle) && (
                  <View style={s.textWrap}>
                    {banner.title && (
                      <Text style={s.title} numberOfLines={2}>{banner.title}</Text>
                    )}
                    {banner.subtitle && (
                      <Text style={s.subtitle} numberOfLines={1}>{banner.subtitle}</Text>
                    )}
                    {onPress && (
                      <View style={s.ctaBtn}>
                        <Text style={s.ctaBtnText}>View →</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>

      {/* Dot indicators */}
      {banners.length > 1 && (
        <View style={s.dots}>
          {banners.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
              <View style={[s.dot, i === index && s.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginBottom: hp(2),
    // Center the entire banner horizontally with consistent margins
    marginHorizontal: HORIZONTAL_MARGIN,
  },
  overflow: {
    overflow: 'hidden',
    borderRadius: wp(4),
  },
  track: { flexDirection: 'row', height: BANNER_H },
  // Slide width matches the translation step (SCREEN_W)
  slide: {
    width: SCREEN_W,
    height: BANNER_H,
    position: 'relative',
  },
  image: {
    width: '100%', // Fill the full slide width
    height: '100%',
    borderRadius: wp(4),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: wp(4),
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  textWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: wp(4),
    gap: hp(0.5),
  },
  title: { fontSize: wp(5), fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  subtitle: { fontSize: wp(3.3), color: 'rgba(255,255,255,0.85)' },
  ctaBtn: {
    alignSelf: 'flex-start',
    marginTop: hp(0.8),
    backgroundColor: '#fff',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.7),
    borderRadius: wp(50),
  },
  ctaBtnText: { fontSize: wp(3.2), fontWeight: '700', color: '#111827' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(1.5),
    marginTop: hp(1),
  },
  dot: {
    width: wp(1.8),
    height: wp(1.8),
    borderRadius: wp(1),
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: wp(4),
    backgroundColor: '#3F51B5',
    borderRadius: wp(1),
  },
});