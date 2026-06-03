import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { X, Volume2, VolumeX } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function VideoLightbox({
  visible,
  url,
  onClose,
}) {
  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
    player.play();
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls
        />

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
        >
          <X size={24} color="#fff" />
        </TouchableOpacity>

        
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },

  video: {
    width,
    height,
  },

  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 30,
  },

  muteBtn: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 30,
  },
});