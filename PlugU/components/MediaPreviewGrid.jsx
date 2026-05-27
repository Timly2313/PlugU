import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video, X } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

const THUMB = (wp(100) - wp(4) * 2 - wp(4) * 2 - wp(3)) / 2;

export default function MediaPreviewGrid({ media, onRemove, disabled }) {
  if (media.length === 0) return null;

  return (
    <View style={s.card}>
      <Text style={s.label}>Media ({media.length})</Text>
      <View style={s.grid}>
        {media.map((item) => (
          <View key={item.id} style={s.thumb}>
            {item.type === 'image' ? (
              <Image source={{ uri: item.localUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.videoInner]}>
                <Video size={wp(8)} color="#9CA3AF" />
                <Text style={s.videoLabel}>Video</Text>
              </View>
            )}
            <View style={s.badge}>
              <Text style={s.badgeText}>{item.type === 'image' ? 'IMG' : 'VID'}</Text>
            </View>
            <TouchableOpacity style={s.remove} onPress={() => onRemove(item.id)} disabled={disabled}>
              <X size={wp(3.5)} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:       { backgroundColor: '#fff', borderRadius: wp(4), padding: wp(4), elevation: 1 },
  label:      { fontSize: wp(3.8), fontWeight: '700', color: '#374151', marginBottom: hp(1.2) },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: wp(3) },
  thumb:      { width: THUMB, height: THUMB, borderRadius: wp(3), backgroundColor: '#F3F4F6', overflow: 'hidden' },
  videoInner: { alignItems: 'center', justifyContent: 'center', gap: hp(0.5), backgroundColor: '#E5E7EB' },
  videoLabel: { fontSize: wp(3), color: '#6B7280', fontWeight: '500' },
  badge:      { position: 'absolute', bottom: wp(2), left: wp(2), backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: wp(1.5), paddingHorizontal: wp(2), paddingVertical: hp(0.3) },
  badgeText:  { color: '#fff', fontSize: wp(2.2), fontWeight: '700', letterSpacing: 0.5 },
  remove:     { position: 'absolute', top: wp(2), right: wp(2), width: wp(7), height: wp(7), borderRadius: wp(3.5), backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});