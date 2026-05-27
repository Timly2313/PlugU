import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { ImageIcon, Video } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { hp, wp } from '../utilities/dimensions';

const PRIMARY = '#3F51B5';

export default function MediaPickerBar({ onAdd, disabled }) {
  const pick = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll access is needed to attach media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:            type === 'image' ? ['images'] : ['videos'],
      allowsMultipleSelection: true,
      quality:               0.8,
    });
    if (!result.canceled) onAdd(type, result.assets);
  };

  return (
    <View style={s.card}>
      <Text style={s.label}>Add to your post</Text>
      <View style={s.row}>
        <TouchableOpacity style={s.btn} onPress={() => pick('image')} disabled={disabled}>
          <ImageIcon size={wp(4.5)} color={PRIMARY} />
          <Text style={s.btnText}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btn} onPress={() => pick('video')} disabled={disabled}>
          <Video size={wp(4.5)} color={PRIMARY} />
          <Text style={s.btnText}>Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:    { backgroundColor: '#fff', borderRadius: wp(4), padding: wp(4), elevation: 1 },
  label:   { fontSize: wp(3.8), fontWeight: '700', color: '#374151', marginBottom: hp(1.2) },
  row:     { flexDirection: 'row', gap: wp(3) },
  btn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(2), borderWidth: 1.5, borderColor: PRIMARY, borderRadius: wp(3), paddingVertical: hp(1.2) },
  btnText: { color: PRIMARY, fontSize: wp(3.5), fontWeight: '600' },
});