import React, { useRef, useEffect } from 'react';
import {
  View, Modal, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar as RNStatusBar,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { X } from 'lucide-react-native';
import { wp } from '../utilities/dimensions';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STATUS_BAR_H = RNStatusBar.currentHeight ?? 44;

export default function VideoLightbox({ visible, url, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!visible && videoRef.current) videoRef.current.pauseAsync().catch(() => {});
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.container}>
        <TouchableOpacity
          style={s.closeBtn} onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={wp(6)} color="#fff" />
        </TouchableOpacity>
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={s.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay useNativeControls isLooping={false}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeBtn:  {
    position: 'absolute', top: STATUS_BAR_H + 8, right: wp(4), zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8,
  },
  video:     { width: SCREEN_W, height: SCREEN_H * 0.75 },
});