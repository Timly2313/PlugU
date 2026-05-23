import React, { useEffect, useRef, useState } from 'react';
import {
  View, StyleSheet, TouchableWithoutFeedback, ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Volume2, VolumeX, Play } from 'lucide-react-native';
import { wp } from '../utilities/dimensions';

export default function InFeedVideo({ url, style, isVisible, onLongPress }) {
  const [muted,   setMuted]   = useState(true);
  const [ready,   setReady]   = useState(false);
  const [playing, setPlaying] = useState(false);

  const player = useVideoPlayer(url, (p) => {
    p.loop    = true;
    p.muted   = true;
    p.volume  = 1;
  });

  // Auto-play / pause based on feed visibility
  useEffect(() => {
    if (!player) return;
    if (isVisible) {
      player.play();
    } else {
      player.pause();
      player.seekBy(-player.currentTime); // reset to start
    }
  }, [isVisible, player]);

  // Sync mute state to player
  useEffect(() => {
    if (!player) return;
    player.muted = muted;
  }, [muted, player]);

  // Track playing state for the pause overlay
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('playingChange', ({ isPlaying }) => {
      setPlaying(isPlaying);
      if (!ready && isPlaying) setReady(true);
    });
    const readySub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setReady(true);
    });
    return () => {
      sub.remove();
      readySub.remove();
    };
  }, [player]);

  return (
    <TouchableWithoutFeedback
      onPress={() => setMuted((m) => !m)}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <View style={[style, { backgroundColor: '#000' }]}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Mute badge */}
        <View style={s.muteBadge}>
          {muted
            ? <VolumeX size={wp(3.5)} color="#fff" />
            : <Volume2 size={wp(3.5)} color="#fff" />}
        </View>

        {/* Loading spinner */}
        {!ready && (
          <View style={s.overlay}>
            <ActivityIndicator color="#fff" size="small" />
          </View>
        )}

        {/* Paused hint */}
        {ready && !playing && isVisible && (
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