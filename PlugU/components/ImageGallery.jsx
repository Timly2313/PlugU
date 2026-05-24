import React from 'react';
import {
  View, Image, TouchableOpacity, Text, StyleSheet, Dimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ImageGallery({ images, currentIndex, onPrev, onNext, onDotPress }) {
  return (
    <View style={s.wrap}>
      {images.length > 0 ? (
        <Image
          source={{ uri: images[currentIndex] }}
          style={s.image}
          resizeMode="cover"
        />
      ) : (
        <View style={s.placeholder}>
          <Text style={s.placeholderText}>No images</Text>
        </View>
      )}

      {images.length > 1 && (
        <>
          <TouchableOpacity style={s.navLeft} onPress={onPrev}>
            <ChevronLeft size={wp(5)} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={s.navRight} onPress={onNext}>
            <ChevronRight size={wp(5)} color="#374151" />
          </TouchableOpacity>

          <View style={s.dots}>
            {images.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => onDotPress(i)}
                style={[s.dot, i === currentIndex && s.dotActive]}
              />
            ))}
          </View>

          <View style={s.badge}>
            <Text style={s.badgeText}>{currentIndex + 1}/{images.length}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:            { position: 'relative', backgroundColor: '#F3F4F6' },
  image:           { width: SCREEN_W, height: hp(38) },
  placeholder:     { width: SCREEN_W, height: hp(38), alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB' },
  placeholderText: { color: '#9CA3AF', fontSize: wp(3.5) },
  navLeft: {
    position: 'absolute', left: wp(3), top: '50%',
    transform: [{ translateY: -wp(4.5) }],
    width: wp(9), height: wp(9),
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: wp(4.5), alignItems: 'center', justifyContent: 'center', elevation: 3,
  },
  navRight: {
    position: 'absolute', right: wp(3), top: '50%',
    transform: [{ translateY: -wp(4.5) }],
    width: wp(9), height: wp(9),
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: wp(4.5), alignItems: 'center', justifyContent: 'center', elevation: 3,
  },
  dots: {
    position: 'absolute', bottom: hp(2), left: 0, right: 0,
    justifyContent: 'center', flexDirection: 'row', gap: wp(1.5),
  },
  dot:       { width: wp(1.8), height: wp(1.8), borderRadius: wp(1), backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: wp(4), backgroundColor: '#fff' },
  badge: {
    position: 'absolute', top: hp(1.5), right: wp(3),
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: wp(3), paddingVertical: hp(0.5), borderRadius: wp(50),
  },
  badgeText: { color: '#fff', fontSize: wp(3), fontWeight: '500' },
});