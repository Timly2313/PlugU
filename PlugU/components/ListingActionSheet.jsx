import React from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Alert,
} from 'react-native';
import { Pencil, Settings, Trash2, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import { STATUS_CONFIG } from '../utilities/profileUtils';

export default function ListingActionSheet({
  visible, listing,
  onClose, onDelete, onStatusPress,
}) {
  const sc = STATUS_CONFIG[listing?.status] ?? STATUS_CONFIG.active;

  const handleDelete = () => {
    onClose();
    Alert.alert(
      'Delete Listing',
      `Delete "${listing?.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(listing) },
      ]
    );
  };

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
          <Text style={s.title} numberOfLines={1}>{listing?.title}</Text>

          <View style={s.statusRow}>
            <View style={[s.statusPill, { backgroundColor: sc.bg }]}>
              <Text style={[s.statusPillText, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>

          {/* Edit */}
          <TouchableOpacity
            style={s.option}
            onPress={() => { onClose(); router.push({ pathname: '/CreateListingScreen', params: { listingId: listing?.id } }); }}
          >
            <View style={[s.optionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Pencil size={wp(4)} color="#3F51B5" />
            </View>
            <Text style={s.optionText}>Edit Listing</Text>
            <ChevronRight size={wp(4)} color="#D1D5DB" />
          </TouchableOpacity>

          {/* Change status */}
          <TouchableOpacity style={s.option} onPress={() => { onClose(); onStatusPress(); }}>
            <View style={[s.optionIcon, { backgroundColor: '#ECFDF5' }]}>
              <Settings size={wp(4)} color="#10B981" />
            </View>
            <Text style={s.optionText}>Change Status</Text>
            <ChevronRight size={wp(4)} color="#D1D5DB" />
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity style={[s.option, { borderBottomWidth: 0 }]} onPress={handleDelete}>
            <View style={[s.optionIcon, { backgroundColor: '#FEF2F2' }]}>
              <Trash2 size={wp(4)} color="#EF4444" />
            </View>
            <Text style={[s.optionText, { color: '#EF4444' }]}>Delete Listing</Text>
            <ChevronRight size={wp(4)} color="#FCA5A5" />
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: wp(7), borderTopRightRadius: wp(7), paddingHorizontal: wp(5), paddingBottom: hp(4), paddingTop: hp(1.5) },
  handle:        { width: wp(10), height: hp(0.5), backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: hp(2) },
  title:         { fontSize: wp(4.5), fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: hp(0.5) },
  statusRow:     { alignItems: 'center', marginBottom: hp(1.5) },
  statusPill:    { paddingHorizontal: wp(4), paddingVertical: hp(0.6), borderRadius: wp(50) },
  statusPillText:{ fontSize: wp(3), fontWeight: '600' },
  option:        { flexDirection: 'row', alignItems: 'center', paddingVertical: hp(1.5), borderBottomWidth: 1, borderBottomColor: '#F9FAFB', gap: wp(3) },
  optionIcon:    { width: wp(10), height: wp(10), borderRadius: wp(3), alignItems: 'center', justifyContent: 'center' },
  optionText:    { fontSize: wp(4), color: '#111827', fontWeight: '500', flex: 1 },
  cancelBtn:     { marginTop: hp(1.5), paddingVertical: hp(1.8), alignItems: 'center', borderRadius: wp(3), backgroundColor: '#F9FAFB' },
  cancelText:    { fontSize: wp(4), color: '#6B7280', fontWeight: '600' },
});