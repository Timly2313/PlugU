import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function AvatarPicker({ imageUri, isUploading, onImageSelected }) {
  const handlePick = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos.');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        onImageSelected(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  return (
    <View style={s.wrap}>
      <View style={s.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.image} />
        ) : (
          <LinearGradient colors={['#3F51B5', '#5C6BC0']} style={s.placeholder}>
            <User size={48} color="#fff" />
          </LinearGradient>
        )}
        <TouchableOpacity
          style={s.cameraBtn}
          onPress={handlePick}
          disabled={isUploading}
        >
          {isUploading
            ? <ActivityIndicator size="small" color="#3F51B5" />
            : <Camera size={20} color="#3F51B5" />}
        </TouchableOpacity>
      </View>
      <Text style={s.hint}>Upload profile picture</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:        { alignItems: 'center', marginBottom: 8 },
  imageWrap:   { position: 'relative', marginBottom: 8 },
  image:       { width: 112, height: 112, borderRadius: 56, borderWidth: 4, borderColor: 'rgba(63,81,181,0.2)' },
  placeholder: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(63,81,181,0.2)' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#3F51B5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  hint: { fontSize: 12, color: '#6B7280' },
});