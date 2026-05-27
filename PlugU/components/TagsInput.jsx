import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

const PRIMARY = '#3F51B5';

export default function TagsInput({ tags, tagInput, onChangeInput, onAdd, onRemove, disabled }) {
  return (
    <View style={s.card}>
      <Text style={s.label}>
        Tags <Text style={s.optional}>(optional · {tags.length}/10)</Text>
      </Text>

      {tags.length > 0 && (
        <View style={s.tagsWrap}>
          {tags.map((t) => (
            <View key={t} style={s.tag}>
              <Text style={s.tagText}>#{t}</Text>
              <TouchableOpacity
                onPress={() => onRemove(t)}
                disabled={disabled}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <X size={wp(3)} color={PRIMARY} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {tags.length < 10 && (
        <TextInput
          style={s.input}
          placeholder="Type a tag and press return…"
          placeholderTextColor="#9CA3AF"
          value={tagInput}
          onChangeText={onChangeInput}
          onSubmitEditing={onAdd}
          blurOnSubmit={false}
          returnKeyType="done"
          editable={!disabled}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:     { backgroundColor: '#fff', borderRadius: wp(4), padding: wp(4), elevation: 1 },
  label:    { fontSize: wp(3.8), fontWeight: '700', color: '#374151', marginBottom: hp(1.2) },
  optional: { fontWeight: '400', color: '#9CA3AF', fontSize: wp(3.2) },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2), marginBottom: hp(1.2) },
  tag:      { flexDirection: 'row', alignItems: 'center', gap: wp(1.5), backgroundColor: '#EEF2FF', borderRadius: wp(50), paddingHorizontal: wp(3), paddingVertical: hp(0.6) },
  tagText:  { color: PRIMARY, fontSize: wp(3.2), fontWeight: '600' },
  input:    { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: wp(3), paddingHorizontal: wp(3.5), paddingVertical: hp(1), fontSize: wp(3.5), color: '#111827', backgroundColor: '#F9FAFB' },
});