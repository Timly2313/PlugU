import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import MediaCell from './MediaCell';
import { isVideo } from '../utilities/communityUtils';

const { width: SCREEN_W } = Dimensions.get('window');
const HALF_W = (SCREEN_W - 2) / 2;

/**
 * For a single image/video:
 *   - If the media is portrait (taller than wide, e.g. 9:16) → show at 9:16
 *   - Otherwise → show at 4:3 (landscape default)
 *
 * For multiple items the grid layout is fixed (no ratio detection needed).
 */
function useSingleMediaSize(url) {
  const [size, setSize] = useState({ width: SCREEN_W, height: SCREEN_W * 0.75 }); // 4:3 default

  useEffect(() => {
    if (!url) return;

    if (isVideo(url)) {
      // Videos default to 9:16 portrait — the player reports dimensions
      // via onVideoLayout; we pre-set 9:16 and let InFeedVideo override if needed
      setSize({ width: SCREEN_W, height: SCREEN_W * (1 / 1) });
      return;
    }

    Image.getSize(
      url,
      (w, h) => {
        if (w > 0 && h > 0) {
          const ratio = h / w;
          if (ratio > 1) {
            // Portrait — clamp to 9:16 max so extremely tall images don't fill the screen
            const clampedRatio = Math.min(ratio, 1 / 1);
            setSize({ width: SCREEN_W, height: SCREEN_W * clampedRatio });
          } else {
            // Landscape / square → 4:3
            setSize({ width: SCREEN_W, height: SCREEN_W * 0.75 });
          }
        }
      },
      () => {
        // On error keep the 4:3 default
        setSize({ width: SCREEN_W, height: SCREEN_W * 0.75 });
      }
    );
  }, [url]);

  return size;
}

// Wrapper so the hook can be called at component level for single-item case
function SingleMedia({ url, isVisible, onImagePress, onVideoLongPress }) {
  const size = useSingleMediaSize(url);

  return (
    <MediaCell
      url={url}
      style={{ width: size.width, height: size.height, backgroundColor: '#000' }}
      isVisible={isVisible}
      onImagePress={() => onImagePress(0)}
      onVideoLongPress={onVideoLongPress}
    />
  );
}

export default function MediaGrid({ urls, isVisible, onImagePress, onVideoLongPress }) {
  if (!urls || urls.length === 0) return null;
  const count = Math.min(urls.length, 4);

  // ── Single item — dynamic ratio ──────────────────────────────────────────────
  if (count === 1) {
    return (
      <SingleMedia
        url={urls[0]}
        isVisible={isVisible}
        onImagePress={onImagePress}
        onVideoLongPress={onVideoLongPress}
      />
    );
  }

  // ── Two items ────────────────────────────────────────────────────────────────
  if (count === 2) {
    return (
      <View style={s.row}>
        {urls.slice(0, 2).map((url, i) => (
          <MediaCell
            key={i} url={url} style={s.half}
            isVisible={isVisible}
            onImagePress={() => onImagePress(i)}
            onVideoLongPress={onVideoLongPress}
          />
        ))}
      </View>
    );
  }

  // ── Three items ──────────────────────────────────────────────────────────────
  if (count === 3) {
    return (
      <View style={s.row}>
        <MediaCell
          url={urls[0]} style={s.tallLeft}
          isVisible={isVisible}
          onImagePress={() => onImagePress(0)}
          onVideoLongPress={onVideoLongPress}
        />
        <View style={s.stackRight}>
          <MediaCell
            url={urls[1]} style={s.stackItem}
            isVisible={isVisible}
            onImagePress={() => onImagePress(1)}
            onVideoLongPress={onVideoLongPress}
          />
          <View style={s.stackDivider} />
          <MediaCell
            url={urls[2]} style={s.stackItem}
            isVisible={isVisible}
            onImagePress={() => onImagePress(2)}
            onVideoLongPress={onVideoLongPress}
          />
        </View>
      </View>
    );
  }

  // ── Four items — 2×2 ─────────────────────────────────────────────────────────
  return (
    <View style={s.grid2x2}>
      {urls.slice(0, 4).map((url, i) => (
        <MediaCell
          key={i} url={url}
          style={[
            s.grid2x2Item,
            (i === 1 || i === 3) && s.gapLeft,
            (i === 2 || i === 3) && s.gapTop,
          ]}
          isVisible={isVisible}
          onImagePress={() => onImagePress(i)}
          onVideoLongPress={onVideoLongPress}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row:          { flexDirection: 'row', gap: 2 },
  half:         { width: HALF_W, height: HALF_W, backgroundColor: '#000' },
  tallLeft:     { width: HALF_W, height: HALF_W, backgroundColor: '#000' },
  stackRight:   { flex: 1 },
  stackDivider: { height: 2, backgroundColor: '#fff' },
  stackItem:    { width: '100%', height: (HALF_W - 2) / 2, backgroundColor: '#000' },
  grid2x2:      { flexDirection: 'row', flexWrap: 'wrap' },
  grid2x2Item:  { width: HALF_W, height: HALF_W, backgroundColor: '#000' },
  gapLeft:      { borderLeftWidth: 2, borderColor: '#fff' },
  gapTop:       { borderTopWidth: 2,  borderColor: '#fff' },
});