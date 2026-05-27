import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

export default function LocationSection({
  location, onChangeText, onDetect, onClear, isLocating,
}) {
  return (
    <View style={s.section}>
      <Text style={s.title}>Location</Text>
      <View style={s.row}>
        <TextInput
          style={s.input}
          placeholder="Suburb, City"
          value={location}
          onChangeText={onChangeText}
          placeholderTextColor="#9CA3AF"
        />
        {location.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={onClear}>
            <X size={wp(4)} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={s.detectBtn} onPress={onDetect} disabled={isLocating}>
        {isLocating
          ? <ActivityIndicator size="small" color="#3F51B5" />
          : <MapPin size={wp(4)} color="#3F51B5" />}
        <Text style={s.detectText}>
          {isLocating ? 'Detecting…' : 'Use my current location'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  section:    { backgroundColor: '#fff', borderRadius: wp(4), padding: wp(4), elevation: 1 },
  title:      { fontSize: wp(4), fontWeight: '600', color: '#111827', marginBottom: hp(1) },
  row:        { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(1) },
  input:      { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: wp(3), paddingHorizontal: wp(3), paddingVertical: hp(1), fontSize: wp(3.5), color: '#111827', backgroundColor: '#F9FAFB' },
  clearBtn:   { padding: wp(2) },
  detectBtn:  { flexDirection: 'row', alignItems: 'center', gap: wp(2), paddingVertical: hp(1), paddingHorizontal: wp(2), borderWidth: 1, borderColor: '#C7D2FE', borderRadius: wp(3), backgroundColor: '#EEF2FF', alignSelf: 'flex-start' },
  detectText: { color: '#3F51B5', fontSize: wp(3.5), fontWeight: '500' },
});