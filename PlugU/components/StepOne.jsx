import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import AvatarPicker from './AvatarPicker';

export default function StepOne({ formData, onChange, profileImage, isUploading, onImageSelected }) {
  return (
    <View style={s.wrap}>
      <AvatarPicker
        imageUri={profileImage}
        isUploading={isUploading}
        onImageSelected={onImageSelected}
      />

      <View style={s.group}>
        <Text style={s.label}>Full Name <Text style={s.star}>*</Text></Text>
        <View style={s.inputWrap}>
          <User size={20} color="#9CA3AF" style={s.icon} />
          <TextInput
            style={s.input}
            placeholder="Timly"
            placeholderTextColor="#9CA3AF"
            value={formData.fullName}
            onChangeText={(v) => onChange('fullName', v)}
          />
        </View>
      </View>

      <View style={s.group}>
        <Text style={s.label}>Username <Text style={s.star}>*</Text></Text>
        <View style={s.inputWrap}>
          <Text style={s.at}>@</Text>
          <TextInput
            style={[s.input, { paddingLeft: 4 }]}
            placeholder="timlyonline"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            value={formData.username}
            onChangeText={(v) => onChange('username', v)}
          />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:      { gap: 24 },
  group:     { gap: 8 },
  label:     { fontSize: 14, fontWeight: '500', color: '#374151' },
  star:      { color: '#EF4444' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#fff', height: 48 },
  icon:      { marginLeft: 12 },
  at:        { fontSize: 16, color: '#9CA3AF', marginLeft: 12 },
  input:     { flex: 1, paddingHorizontal: 12, fontSize: 16, color: '#111827' },
});