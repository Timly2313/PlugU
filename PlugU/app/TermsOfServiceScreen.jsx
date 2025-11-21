import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';

export default function TermsOfServiceScreen() {
  const onBack = () => {
    router.back();
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
          <Text style={styles.headerTitle}>Terms of Service</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.section}>
                <Text style={styles.updateDate}>Last updated: November 7, 2025</Text>
                <Text style={styles.paragraph}>
                  Please read these Terms of Service carefully before using the Marketplace mobile application. By accessing or using our service, you agree to be bound by these Terms.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                <Text style={styles.paragraph}>
                  By creating an account and using Marketplace, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. User Accounts</Text>
                <Text style={styles.paragraph}>
                  When creating an account, you must:
                </Text>
                <View style={styles.list}>
                  <Text style={styles.listItem}>• Provide accurate and complete information</Text>
                  <Text style={styles.listItem}>• Be at least 18 years old</Text>
                  <Text style={styles.listItem}>• Maintain the security of your account</Text>
                  <Text style={styles.listItem}>• Notify us immediately of unauthorized access</Text>
                  <Text style={styles.listItem}>• Be responsible for all activities under your account</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Listing Guidelines</Text>
                <Text style={styles.paragraph}>
                  When creating listings, you must:
                </Text>
                <View style={styles.list}>
                  <Text style={styles.listItem}>• Have the legal right to sell the items</Text>
                  <Text style={styles.listItem}>• Provide accurate descriptions and photos</Text>
                  <Text style={styles.listItem}>• Set fair and honest prices</Text>
                  <Text style={styles.listItem}>• Not list prohibited items (weapons, illegal substances, etc.)</Text>
                  <Text style={styles.listItem}>• Honor your commitments to buyers</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Prohibited Conduct</Text>
                <Text style={styles.paragraph}>
                  You may not:
                </Text>
                <View style={styles.list}>
                  <Text style={styles.listItem}>• Post false, misleading, or fraudulent listings</Text>
                  <Text style={styles.listItem}>• Harass, threaten, or abuse other users</Text>
                  <Text style={styles.listItem}>• Violate any laws or regulations</Text>
                  <Text style={styles.listItem}>• Attempt to circumvent platform fees or policies</Text>
                  <Text style={styles.listItem}>• Create multiple accounts for fraudulent purposes</Text>
                  <Text style={styles.listItem}>• Scrape or collect user data without permission</Text>
                  <Text style={styles.listItem}>• Interfere with the proper functioning of the service</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>5. Transactions</Text>
                <Text style={styles.paragraph}>
                  Marketplace facilitates connections between buyers and sellers but is not a party to actual transactions. We do not guarantee the quality, safety, or legality of items listed. Users are responsible for their own transactions and should exercise caution.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>6. Fees and Payments</Text>
                <Text style={styles.paragraph}>
                  Currently, Marketplace is free to use. We reserve the right to introduce fees in the future with reasonable notice. Payment arrangements between buyers and sellers are their own responsibility.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
                <Text style={styles.paragraph}>
                  The Marketplace platform, including its design, features, and content, is owned by us and protected by intellectual property laws. You retain ownership of content you post but grant us a license to use, display, and distribute it on our platform.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>8. Dispute Resolution</Text>
                <Text style={styles.paragraph}>
                  While we encourage users to resolve disputes directly, we may assist with mediation. However, we are not obligated to resolve user disputes and recommend involving appropriate authorities when necessary.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
                <Text style={styles.paragraph}>
                  Marketplace is provided "as is" without warranties. We are not liable for any damages arising from your use of the service, including but not limited to failed transactions, lost profits, or data loss.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>10. Account Termination</Text>
                <Text style={styles.paragraph}>
                  We reserve the right to suspend or terminate accounts that violate these Terms. You may also delete your account at any time through the settings.
                </Text>
              </View> 

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
                <Text style={styles.paragraph}>
                  We may modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms. We will notify users of significant changes.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>12. Contact Information</Text>
                <Text style={styles.paragraph}>
                  For questions about these Terms, contact us at:
                </Text>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactText}>Email: legal@marketplace.com</Text>
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