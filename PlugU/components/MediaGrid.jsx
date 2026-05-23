import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MediaCell from './MediaCell';

const { width: SCREEN_W } = Dimensions.get('window');
const HALF_W = (SCREEN_W - 2) / 2;

export default function MediaGrid({ urls, isVisible, onImagePress, onVideoLongPress }) {
  if (!urls || urls.length === 0) return null;
  const count = Math.min(urls.length, 4);

  if (count === 1) {
    return (
      <MediaCell
        url={urls[0]}
        style={s.single}
        isVisible={isVisible}
        onImagePress={() => onImagePress(0)}
        onVideoLongPress={onVideoLongPress}
      />
    );
  }

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
  single:       { width: SCREEN_W, height: SCREEN_W * 0.75, backgroundColor: '#000' },
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