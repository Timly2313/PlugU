import React from 'react';
import { View, Text, TextInput, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Briefcase, User, Mail, Phone, MapPin } from 'lucide-react-native';

export default function StepThree({ formData, onChange, profileImage }) {
  return (
    <View style={s.wrap}>
      {/* Occupation */}
      <View style={s.group}>
        <Text style={s.label}>Occupation</Text>
        <View style={s.inputWrap}>
          <Briefcase size={20} color="#9CA3AF" style={s.icon} />
          <TextInput
            style={s.input}
            placeholder="Software Engineer"
            placeholderTextColor="#9CA3AF"
            value={formData.occupation}
            onChangeText={(v) => onChange('occupation', v)}
          />
        </View>
      </View>

      {/* Bio */}
      <View style={s.group}>
        <Text style={s.label}>Bio</Text>
        <View style={s.textareaWrap}>
          <TextInput
            style={s.textarea}
            placeholder="Tell us a bit about yourself..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
            value={formData.bio}
            onChangeText={(v) => onChange('bio', v)}
          />
        </View>
        <Text style={s.charCount}>{formData.bio.length}/500</Text>
      </View>

      {/* Summary */}
      <View style={s.summary}>
        <Text style={s.summaryTitle}>Profile Summary</Text>
        <View style={s.summaryRow}>
          <View style={s.avatarWrap}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={s.avatarImg} />
            ) : (
              <LinearGradient colors={['#3F51B5', '#5C6BC0']} style={s.avatarPlaceholder}>
                <User size={20} color="#fff" />
              </LinearGradient>
            )}
          </View>
          <View>
            <Text style={s.summaryName}>{formData.fullName || 'Your Name'}</Text>
            <Text style={s.summaryUsername}>@{formData.username || 'username'}</Text>
          </View>
        </View>

        {[
          { icon: Mail,   value: formData.email },
          { icon: Phone,  value: formData.phone },
          { icon: MapPin, value: formData.location },
        ].filter((r) => r.value).map(({ icon: Icon, value }, i) => (
          <View key={i} style={s.summaryItem}>
            <Icon size={16} color="#6B7280" />
            <Text style={s.summaryText}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:            { gap: 24 },
  group:           { gap: 8 },
  label:           { fontSize: 14, fontWeight: '500', color: '#374151' },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#fff', height: 48 },
  icon:            { marginLeft: 12 },
  input:           { flex: 1, paddingHorizontal: 12, fontSize: 16, color: '#111827' },
  textareaWrap:    { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#fff' },
  textarea:        { paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: '#111827', minHeight: 128, textAlignVertical: 'top' },
  charCount:       { fontSize: 10, color: '#9CA3AF', textAlign: 'right' },
  summary:         { backgroundColor: 'rgba(63,81,181,0.05)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(63,81,181,0.1)', gap: 12 },
  summaryTitle:    { fontSize: 16, fontWeight: '600', color: '#111827' },
  summaryRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap:      { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  avatarImg:       { width: '100%', height: '100%' },
  avatarPlaceholder:{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  summaryName:     { fontSize: 14, fontWeight: '500', color: '#111827' },
  summaryUsername: { fontSize: 12, color: '#6B7280' },
  summaryItem:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText:     { fontSize: 12, color: '#4B5563' },
});