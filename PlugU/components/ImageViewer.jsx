import React from 'react';
import {
  View, Image, TouchableOpacity,
  Modal, Animated, StyleSheet, Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function ImageViewer({ visible, uri, animValue, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[s.overlay, { opacity: animValue }]}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <X size={wp(5.5)} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={1} style={s.imgWrap} onPress={onClose}>
          {uri && (
            <Image source={{ uri }} style={s.img} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn:{ position: 'absolute', top: hp(6), right: wp(5), width: wp(10), height: wp(10), borderRadius: wp(5), backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  imgWrap: { width: SCREEN_W, height: SCREEN_W },
  img:     { width: '100%', height: '100%' },
});