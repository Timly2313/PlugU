import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Modal
} from 'react-native';
import { X, Phone, Mail, MapPin, Clock } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';

const supportTeam = [
  {
    name: 'Sarah Johnson',
    role: 'Customer Support Lead',
    phone: '+1 (555) 123-4567',
    email: 'sarah@marketplace.com',
  },
  {
    name: 'Michael Chen',
    role: 'Technical Support',
    phone: '+1 (555) 234-5678',
    email: 'michael@marketplace.com',
  },
  {
    name: 'Emma Davis',
    role: 'Account Specialist',
    phone: '+1 (555) 345-6789',
    email: 'emma@marketplace.com',
  },
];

export default function ContactSupportModal({ onClose }) {
  const handlePhonePress = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmailPress = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Contact Support</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={wp(5)} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Office Info */}
              <View style={styles.officeInfo}>
                <Text style={styles.officeTitle}>Headquarters</Text>
                <View style={styles.officeDetails}>
                  <View style={styles.detailRow}>
                    <MapPin size={wp(4)} color="white" />
                    <Text style={styles.detailText}>
                      123 Market Street, San Francisco, CA 94105
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Phone size={wp(4)} color="white" />
                    <Text style={styles.detailText}>+1 (555) 100-2000</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Mail size={wp(4)} color="white" />
                    <Text style={styles.detailText}>support@marketplace.com</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={wp(4)} color="white" />
                    <View>
                      <Text style={styles.detailText}>Mon-Fri: 9:00 AM - 6:00 PM PST</Text>
                      <Text style={styles.detailText}>Sat-Sun: 10:00 AM - 4:00 PM PST</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Support Team */}
              <View style={styles.supportTeam}>
                <Text style={styles.sectionTitle}>Support Team</Text>
                <View style={styles.teamList}>
                  {supportTeam.map((member, index) => (
                    <View key={index} style={styles.teamMember}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberRole}>{member.role}</Text>
                      <View style={styles.memberContacts}>
                        <TouchableOpacity 
                          style={styles.contactLink}
                          onPress={() => handlePhonePress(member.phone)}
                        >
                          <Phone size={wp(4)} color="#3F51B5" />
                          <Text style={styles.contactText}>{member.phone}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.contactLink}
                          onPress={() => handleEmailPress(member.email)}
                        >
                          <Mail size={wp(4)} color="#3F51B5" />
                          <Text style={styles.contactText}>{member.email}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Emergency */}
              <View style={styles.emergencySection}>
                <Text style={styles.emergencyTitle}>Emergency Support</Text>
                <Text style={styles.emergencyDescription}>
                  For urgent issues or safety concerns, call our 24/7 emergency line:
                </Text>
                <TouchableOpacity 
                  style={styles.emergencyLink}
                  onPress={() => handlePhonePress('+15559112000')}
                >
                  <Phone size={wp(5)} color="#DC2626" />
                  <Text style={styles.emergencyPhone}>+1 (555) 911-2000</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(4),
  },
  
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: wp(6),
    gap: hp(4),
  },
  officeInfo: {
    backgroundColor: '#3F51B5',
    borderRadius: wp(4),
    padding: wp(4),
  },
  officeTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: 'white',
    marginBottom: hp(1.5),
  },
  officeDetails: {
    gap: hp(1),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(2),
  },
  detailText: {
    fontSize: wp(3.5),
    color: 'white',
    flex: 1,
    lineHeight: hp(2),
  },
  supportTeam: {
    gap: hp(1.5),
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111827',
  },
  teamList: {
    gap: hp(2),
  },
  teamMember: {
    backgroundColor: '#F9FAFB',
    borderRadius: wp(4),
    padding: wp(4),
  },
  memberName: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp(0.25),
  },
  memberRole: {
    fontSize: wp(3.5),
    color: '#6B7280',
    marginBottom: hp(1),
  },
  memberContacts: {
    gap: hp(1),
  },
  contactLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  contactText: {
    fontSize: wp(3.5),
    color: '#3F51B5',
  },
  emergencySection: {
    backgroundColor: '#FEF2F2',
    borderRadius: wp(4),
    padding: wp(4),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: hp(0.5),
  },
  emergencyDescription: {
    fontSize: wp(3.5),
    color: '#DC2626',
    marginBottom: hp(1),
    lineHeight: hp(2),
  },
  emergencyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  emergencyPhone: {
    fontSize: wp(4.5),
    color: '#DC2626',
    fontWeight: '600',
  },
});