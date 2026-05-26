import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react-native';

const Field = ({ label, required, icon: Icon, ...inputProps }) => (
  <View style={s.group}>
    <Text style={s.label}>
      {label}{required && <Text style={s.star}> *</Text>}
    </Text>
    <View style={s.inputWrap}>
      <Icon size={20} color="#9CA3AF" style={s.icon} />
      <TextInput style={s.input} placeholderTextColor="#9CA3AF" {...inputProps} />
    </View>
  </View>
);

export default function StepTwo({ formData, onChange }) {
  return (
    <View style={s.wrap}>
      <Field
        label="Email Address" required
        icon={Mail}
        placeholder="timly@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(v) => onChange('email', v)}
      />
      <Field
        label="Phone Number" required
        icon={Phone}
        placeholder="+27 700 000 000"
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(v) => onChange('phone', v)}
      />
      <Field
        label="Location"
        icon={MapPin}
        placeholder="Auckland Park, Johannesburg"
        value={formData.location}
        onChangeText={(v) => onChange('location', v)}
      />
      <Field
        label="Date of Birth"
        icon={Calendar}
        placeholder="YYYY-MM-DD"
        value={formData.dateOfBirth}
        onChangeText={(v) => onChange('dateOfBirth', v)}
      />
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
  input:     { flex: 1, paddingHorizontal: 12, fontSize: 16, color: '#111827' },
});