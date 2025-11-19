import React from 'react';
import {  View,  Text,  ScrollView,  TouchableOpacity,  StyleSheet} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const onBack = () => {
    router.back();
  };

  return (
    <ScreenWrapper bg="#F9FAFB">
       <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={wp(5)} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.section}>
              <Text style={styles.updateDate}>Last updated: November 7, 2025</Text>
              <Text style={styles.paragraph}>
                Welcome to Marketplace. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we handle your personal data and your privacy rights.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Information We Collect</Text>
              <Text style={styles.paragraph}>
                We collect and process the following types of information:
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Personal identification information (name, email address, phone number)</Text>
                <Text style={styles.listItem}>• Location data (city, state)</Text>
                <Text style={styles.listItem}>• Listing information (photos, descriptions, prices)</Text>
                <Text style={styles.listItem}>• Messages and communications</Text>
                <Text style={styles.listItem}>• Device and usage information</Text>
                <Text style={styles.listItem}>• Reviews and ratings</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
              <Text style={styles.paragraph}>
                We use your information to:
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Provide and maintain our marketplace services</Text>
                <Text style={styles.listItem}>• Process your transactions and manage listings</Text>
                <Text style={styles.listItem}>• Communicate with you about your account and listings</Text>
                <Text style={styles.listItem}>• Improve and personalize your experience</Text>
                <Text style={styles.listItem}>• Ensure security and prevent fraud</Text>
                <Text style={styles.listItem}>• Comply with legal obligations</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Information Sharing</Text>
              <Text style={styles.paragraph}>
                We do not sell your personal information. We may share your information with other users (e.g., when you message a seller), service providers who help us operate our platform, and law enforcement when required by law.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Data Security</Text>
              <Text style={styles.paragraph}>
                We implement appropriate security measures to protect your personal data. However, no method of transmission over the internet is 100% secure. We strive to use commercially acceptable means to protect your data.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Your Rights</Text>
              <Text style={styles.paragraph}>
                You have the right to:
              </Text>
              <View style={styles.list}>
                <Text style={styles.listItem}>• Access your personal data</Text>
                <Text style={styles.listItem}>• Correct inaccurate data</Text>
                <Text style={styles.listItem}>• Request deletion of your data</Text>
                <Text style={styles.listItem}>• Object to processing of your data</Text>
                <Text style={styles.listItem}>• Request data portability</Text>
                <Text style={styles.listItem}>• Withdraw consent at any time</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Cookies and Tracking</Text>
              <Text style={styles.paragraph}>
                We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
              <Text style={styles.paragraph}>
                Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal data, please contact us.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
              <Text style={styles.paragraph}>
                We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Contact Us</Text>
              <Text style={styles.paragraph}>
                If you have any questions about this privacy policy, please contact us at:
              </Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactText}>Email: privacy@marketplace.com</Text>
                <Text style={styles.contactText}>Phone: +1 (555) 100-2000</Text>
                <Text style={styles.contactText}>Address: 123 Market Street, San Francisco, CA 94105</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
  },
  card: {
    paddingHorizontal: wp(2),
  
  },
  section: {
    marginBottom: hp(3),
  },
  updateDate: {
    fontSize: wp(3.5),
    color: '#6B7280',
    marginBottom: hp(1.5),
  },
  paragraph: {
    fontSize: wp(3.5),
    color: '#6B7280',
    lineHeight: hp(2.5),
  },
  sectionTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#111827',
    marginBottom: hp(1),
  },
  list: {
    marginTop: hp(0.5),
    gap: hp(0.5),
  },
  listItem: {
    fontSize: wp(3.5),
    color: '#6B7280',
    lineHeight: hp(2.2),
    marginLeft: wp(2),
  },
  contactInfo: {
    marginTop: hp(1),
    gap: hp(0.5),
  },
  contactText: {
    fontSize: wp(3.5),
    color: '#3F51B5',
    lineHeight: hp(2.2),
  },
});