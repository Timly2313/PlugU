import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import InFeedVideo from './InFeedVideo';
import { isVideo } from '../utilities/communityUtils';

export default function MediaCell({ url, style, isVisible, onImagePress, onVideoLongPress }) {
  if (isVideo(url)) {
    return (
      <InFeedVideo
        url={url}
        style={style}
        isVisible={isVisible}
        onLongPress={() => onVideoLongPress(url)}
      />
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onImagePress}>
      <Image source={{ uri: url }} style={style} resizeMode="cover" />
    </TouchableOpacity>
  );
}