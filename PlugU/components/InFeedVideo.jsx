import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, TouchableWithoutFeedback, ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Volume2, VolumeX, Play } from 'lucide-react-native';
import { wp } from '../utilities/dimensions';

export default function InFeedVideo({ url, style, isVisible, onLongPress }) {
  const videoRef            = useRef(null);
  const [muted,  setMuted]  = useState(true);
  const [status, setStatus] = useState({});
  const [ready,  setReady]  = useState(false);

  useEffect(() => {
    if (!videoRef.current || !ready) return;
    if (isVisible) {
      videoRef.current.playAsync().catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
      videoRef.current.setPositionAsync(0).catch(() => {});
    }
  }, [isVisible, ready]);

  return (
    <TouchableWithoutFeedback
      onPress={() => setMuted((m) => !m)}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <View style={[style, { backgroundColor: '#000' }]}>
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isMuted={muted}
          isLooping
          shouldPlay={false}
          onPlaybackStatusUpdate={setStatus}
          onReadyForDisplay={() => setReady(true)}
        />
        <View style={s.muteBadge}>
          {muted
            ? <VolumeX size={wp(3.5)} color="#fff" />
            : <Volume2 size={wp(3.5)} color="#fff" />}
        </View>
        {!ready && (
          <View style={s.overlay}>
            <ActivityIndicator color="#fff" size="small" />
          </View>
        )}
        {ready && !status.isPlaying && isVisible && (
          <View style={s.overlay}>
            <Play size={wp(10)} color="#fff" fill="#fff" />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  muteBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12, padding: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
});