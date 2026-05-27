import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  Alert, StyleSheet,
} from 'react-native';
import { ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { hp, wp } from '../utilities/dimensions';

export default function ImagePickerSection({ media, onAdd, onRemove }) {
  const pick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll permission needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:              ['images'],
      allowsMultipleSelection: true,
      quality:                 0.8,
    });
    if (!result.canceled) onAdd(result.assets);
  };

  return (
    <View style={s.section}>
      <Text style={s.title}>Photos</Text>
      <TouchableOpacity style={s.addBtn} onPress={pick}>
        <ImageIcon size={wp(5)} color="#3F51B5" />
        <Text style={s.addBtnText}>Add Photos</Text>
      </TouchableOpacity>

      {media.length > 0 && (
        <View style={s.grid}>
          {media.map((item) => (
            <View key={item.id} style={s.thumb}>
              <Image source={{ uri: item.url }} style={s.thumbImg} />
              <TouchableOpacity style={s.remove} onPress={() => onRemove(item.id)}>
                <X size={wp(4)} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const THUMB_W = (wp(100) - wp(20)) / 2;

const s = StyleSheet.create({
  section: { backgroundColor: '#fff', borderRadius: wp(4), padding: wp(4), elevation: 1 },
  title:   { fontSize: wp(4), fontWeight: '600', color: '#111827', marginBottom: hp(1) },
  addBtn:  { borderWidth: 1, borderColor: '#3F51B5', borderRadius: wp(4), paddingVertical: hp(1.1), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: wp(2) },
  addBtnText: { color: '#3F51B5', fontSize: wp(3.5), fontWeight: '500' },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: wp(3), marginTop: hp(1.5) },
  thumb:   { width: THUMB_W, aspectRatio: 1, backgroundColor: '#F3F4F6', borderRadius: wp(4), overflow: 'hidden' },
  thumbImg:{ width: '100%', height: '100%' },
  remove:  { position: 'absolute', top: wp(2), right: wp(2), backgroundColor: 'rgba(0,0,0,0.6)', padding: wp(1), borderRadius: wp(2) },
});