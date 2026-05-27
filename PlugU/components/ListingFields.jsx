import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { hp, wp } from '../utilities/dimensions';

function Field({ label, required, ...inputProps }) {
  return (
    <View style={s.group}>
      <Text style={s.label}>
        {label}{required && <Text style={s.star}> *</Text>}
      </Text>
      <TextInput
        style={inputProps.multiline ? s.textArea : s.input}
        placeholderTextColor="#9CA3AF"
        {...inputProps}
      />
    </View>
  );
}

export default function ListingFields({
  title, setTitle,
  price, setPrice,
  category, setCategory,
  condition, setCondition,
  description, setDescription,
}) {
  return (
    <View style={s.section}>
      <Field label="Title" required placeholder="Enter item name" value={title} onChangeText={setTitle} />
      <Field label="Price (ZAR)" placeholder="250" keyboardType="numeric" value={price} onChangeText={setPrice} />
      <Field label="Category" required placeholder="e.g. Electronics, Clothing" value={category} onChangeText={setCategory} />
      <Field label="Condition" placeholder="e.g. New, Used" value={condition} onChangeText={setCondition} />
      <Field label="Description" required placeholder="Describe your item" value={description} onChangeText={setDescription} multiline />
    </View>
  );
}

const s = StyleSheet.create({
  section: { backgroundColor: '#fff', borderRadius: wp(4), padding: wp(4), elevation: 1, gap: hp(1.5) },
  group:   { gap: hp(0.8) },
  label:   { fontSize: wp(4), fontWeight: '600', color: '#111827' },
  star:    { color: '#EF4444' },
  input:   { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: wp(3), paddingHorizontal: wp(3), paddingVertical: hp(1), fontSize: wp(3.5), color: '#111827', backgroundColor: '#F9FAFB' },
  textArea:{ minHeight: hp(18), borderWidth: 1, borderColor: '#E5E7EB', borderRadius: wp(3), padding: wp(3), fontSize: wp(3.5), color: '#111827', backgroundColor: '#F9FAFB', textAlignVertical: 'top' },
});