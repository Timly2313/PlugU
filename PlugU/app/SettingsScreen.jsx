import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet
} from 'react-native';
import { ArrowLeft, Bell, Lock, Globe, HelpCircle, Shield, ChevronRight, Filter } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import ContactSupportModal from '../components/ContactSupportModal';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const settingsSections = [
  {
    title: 'Notifications',
    items: [
      { icon: Bell, label: 'Push Notifications', type: 'toggle', value: true },
      { icon: Bell, label: 'Email Notifications', type: 'toggle', value: false },
      { icon: Bell, label: 'SMS Notifications', type: 'toggle', value: true },
    ],
  },
  {
    title: 'Privacy & Security',
    items: [
      { icon: Lock, label: 'Change Password', type: 'link' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Filter, label: 'Feed Preferences', type: 'link' }, 
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help Center', type: 'link' },
      { icon: HelpCircle, label: 'Contact Support', type: 'link' },
      { icon: HelpCircle, label: 'Terms of Service', type: 'link' },
      { icon: HelpCircle, label: 'Privacy Policy', type: 'link' },
    ],
  },
];

export default function SettingsScreen() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: true,
    twoFactorAuth: false,
  });

  const onBack = () => {
    router.back();
  };

  const onHelpCenter = () => {
    router.push('/HelpCenterScreen');
  };

  const onPrivacyPolicy = () => {
    router.push('/PrivacyPolicyScreen');
  };

  const onTermsOfService = () => {
    router.push('/TermsOfServiceScreen');
  };

  const onChangePassword = () => {
    router.push('/ChangePasswordScreen');
  };

  const onFeedPreferences = () => { 
    router.push('/FeedPreferencesScreen');
  };

  const handleToggle = (settingKey, value) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: value
    }));
  };

  const getSettingValue = (label) => {
    switch (label) {
      case 'Push Notifications':
        return settings.pushNotifications;
      case 'Email Notifications':
        return settings.emailNotifications;
      case 'SMS Notifications':
        return settings.smsNotifications;
      case 'Two-Factor Authentication':
        return settings.twoFactorAuth;
      default:
        return false;
    }
  };

  const getSettingKey = (label) => {
    switch (label) {
      case 'Push Notifications':
        return 'pushNotifications';
      case 'Email Notifications':
        return 'emailNotifications';
      case 'SMS Notifications':
        return 'smsNotifications';
      case 'Two-Factor Authentication':
        return 'twoFactorAuth';
      default:
        return '';
    }
  };

  const handleItemClick = (item) => {
    const { label } = item;
    
    switch (label) {
      case 'Help Center':
        onHelpCenter();
        break;
      case 'Contact Support':
        setShowContactModal(true);
        break;
      case 'Privacy Policy':
        onPrivacyPolicy();
        break;
      case 'Terms of Service':
        onTermsOfService();
        break;
      case 'Change Password':
        onChangePassword();
        break;
      case 'Feed Preferences': // Added Feed Preferences case
        onFeedPreferences();
        break;
      default:
        break;
    }
  };

  const renderSectionItem = (item, index) => {
    const Icon = item.icon;

    if (item.type === 'toggle') {
      const settingKey = getSettingKey(item.label);
      const value = getSettingValue(item.label);
      
      return (
        <View
          key={index}
          style={styles.settingsItem}
        >
          <View style={styles.settingsItemLeft}>
            <Icon size={wp(5)} color="#6B7280" />
            <Text style={styles.settingsLabel}>{item.label}</Text>
          </View>
          <Switch
            value={value}
            onValueChange={(newValue) => handleToggle(settingKey, newValue)}
            trackColor={{ false: '#E5E7EB', true: '#3F51B5' }}
            thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
          />
        </View>
      );
    }
    
    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleItemClick(item)}
        style={styles.settingsItem}
        activeOpacity={0.7}
      >
        <View style={styles.settingsItemLeft}>
          <Icon size={wp(5)} color="#6B7280" />
          <Text style={styles.settingsLabel}>{item.label}</Text>
        </View>
        <View style={styles.settingsItemRight}>
          {item.value && (
            <Text style={styles.settingsValue}>{item.value}</Text>
          )}
          <ChevronRight size={wp(5)} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={wp(5)} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {settingsSections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionContent}>
                  {section.items.map(renderSectionItem)}
                </View>
              </View>
            ))}

            {/* App Version */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </View>
        </ScrollView>

        {showContactModal && (
          <ContactSupportModal
            visible={showContactModal}
            onClose={() => setShowContactModal(false)}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  backButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: wp(5),
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: wp(4),
    gap: hp(3),
  },
  section: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  sectionContent: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    flex: 1,
  },
  settingsLabel: {
    fontSize: wp(3.5),
    color: '#111827',
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  settingsValue: {
    fontSize: wp(3),
    color: '#6B7280',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: hp(2),
  },
  versionText: {
    fontSize: wp(3),
    color: '#6B7280',
  },
});