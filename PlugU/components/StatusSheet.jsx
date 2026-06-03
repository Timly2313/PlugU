import React from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
} from 'react-native';
import { hp, wp } from '../utilities/dimensions';
import { STATUS_CONFIG } from '../utilities/profileUtils';

export default function StatusSheet({ visible, listing, onClose, onSelect }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Change Status</Text>
          <Text style={s.sub} numberOfLines={1}>{listing?.title}</Text>

          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const isCurrent = listing?.status === key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.option, isCurrent && { borderColor: cfg.color, backgroundColor: cfg.bg }]}
                onPress={() => onSelect(key)}
              >
                <View style={[s.dot, { backgroundColor: cfg.color }]} />
                <Text style={[s.optionText, isCurrent && { color: cfg.color, fontWeight: '700' }]}>
                  {cfg.label}
                </Text>
                {isCurrent && (
                  <View style={[s.currentPill, { backgroundColor: cfg.color }]}>
                    <Text style={s.currentPillText}>Current</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: '#fff', borderTopLeftRadius: wp(7), borderTopRightRadius: wp(7), paddingHorizontal: wp(5), paddingBottom: hp(4), paddingTop: hp(1.5) },
  handle:         { width: wp(10), height: hp(0.5), backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: hp(2) },
  title:          { fontSize: wp(4.5), fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: hp(0.5) },
  sub:            { fontSize: wp(3.5), color: '#9CA3AF', textAlign: 'center', marginBottom: hp(1.5) },
  option:         { flexDirection: 'row', alignItems: 'center', paddingVertical: hp(1.5), paddingHorizontal: wp(3), borderRadius: wp(3), marginBottom: hp(0.8), borderWidth: 1.5, borderColor: '#F3F4F6', gap: wp(3) },
  dot:            { width: wp(2.5), height: wp(2.5), borderRadius: wp(1.5) },
  optionText:     { fontSize: wp(3.8), color: '#374151', flex: 1, fontWeight: '500' },
  currentPill:    { paddingHorizontal: wp(2.5), paddingVertical: hp(0.3), borderRadius: wp(50) },
  currentPillText:{ color: '#fff', fontSize: wp(2.5), fontWeight: '600' },
  cancelBtn:      { marginTop: hp(1), paddingVertical: hp(1.8), alignItems: 'center', borderRadius: wp(3), backgroundColor: '#F9FAFB' },
  cancelText:     { fontSize: wp(4), color: '#6B7280', fontWeight: '600' },
});