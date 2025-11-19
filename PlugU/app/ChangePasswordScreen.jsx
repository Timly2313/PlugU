import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet
} from 'react-native';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions'; 
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';

const ChangePasswordScreen = ({ onSave }) => {

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');

  const onBack = () => {
    router.back();
  };

  // Password strength requirements
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const isPasswordStrong =
    hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  const passwordsMatch = newPassword === confirmPassword && newPassword !== '';

  const handleSubmit = () => {
    setError('');

    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }

    if (!isPasswordStrong) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('New passwords do not match');
      return;
    }

    onSave();
  };

  const PasswordRequirement = ({ met, text }) => (
    <View style={styles.requirementRow}>
      {met ? (
        <CheckCircle2 size={hp(1.8)} color="#16a34a" />
      ) : (
        <XCircle size={hp(1.8)} color="#d1d5db" />
      )}
      <Text style={[styles.requirementText, met && styles.requirementMet]}>
        {text}
      </Text>
    </View>
  );

  const PasswordInput = ({
    label,
    value,
    onChangeText,
    showPassword,
    setShowPassword,
    placeholder
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <Lock size={hp(1.8)} color="#9ca3af" style={styles.inputIcon} />

        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="oneTimeCode"   
        />

        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
        >
          {showPassword ? (
            <EyeOff size={hp(1.8)} color="#9ca3af" />
          ) : (
            <Eye size={hp(1.8)} color="#9ca3af" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper bg="#f9fafb">

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={hp(2.5)} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Choose a strong password to keep your account secure. Your password should be unique.
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorCard}>
              <XCircle size={hp(1.8)} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Current Password */}
          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            showPassword={showCurrentPassword}
            setShowPassword={setShowCurrentPassword}
            placeholder="Enter current password"
          />

          {/* New Password */}
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            showPassword={showNewPassword}
            setShowPassword={setShowNewPassword}
            placeholder="Enter new password"
          />

          {/* Requirements */}
          {newPassword ? (
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>

              <PasswordRequirement met={hasMinLength} text="At least 8 characters" />
              <PasswordRequirement met={hasUpperCase} text="One uppercase letter" />
              <PasswordRequirement met={hasLowerCase} text="One lowercase letter" />
              <PasswordRequirement met={hasNumber} text="One number" />
              <PasswordRequirement met={hasSpecialChar} text="One special character" />
            </View>
          ) : null}

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>

            <View style={styles.inputWrapper}>
              <Lock size={hp(1.8)} color="#9ca3af" style={styles.inputIcon} />

              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="#9ca3af"
                textContentType="oneTimeCode"
              />

              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? (
                  <EyeOff size={hp(1.8)} color="#9ca3af" />
                ) : (
                  <Eye size={hp(1.8)} color="#9ca3af" />
                )}
              </TouchableOpacity>
            </View>

            {confirmPassword ? (
              <View style={styles.matchIndicator}>
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 size={hp(1.8)} color="#16a34a" />
                    <Text style={styles.matchText}>Passwords match</Text>
                  </>
                ) : (
                  <>
                    <XCircle size={hp(1.8)} color="#dc2626" />
                    <Text style={styles.mismatchText}>Passwords do not match</Text>
                  </>
                )}
              </View>
            ) : null}
          </View>

          {/* Security Tips */}
          <View style={styles.securityCard}>
            <Text style={styles.securityTitle}>Security Tips</Text>
            <Text style={styles.tipText}>• Don't reuse passwords</Text>
            <Text style={styles.tipText}>• Use a password manager</Text>
            <Text style={styles.tipText}>• Change your password regularly</Text>
            <Text style={styles.tipText}>• Never share your password</Text>
          </View>

          {/* Spacer */}
          <View style={{ height: hp(12) }} />

        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isPasswordStrong || !passwordsMatch || !currentPassword}
            style={[
              styles.saveButton,
              (!isPasswordStrong || !passwordsMatch || !currentPassword) && styles.saveButtonDisabled
            ]}
          >
            <Text style={styles.saveButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  backButton: { padding: hp(0.5), marginRight: wp(3) },
  headerTitle: { fontSize: hp(2.2), fontWeight: 'bold', color: '#111827' },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: wp(4), paddingBottom: hp(2) },

  infoCard: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: hp(1.5),
    padding: hp(2),
    marginTop: hp(2),
    marginBottom: hp(2)
  },

  infoText: { fontSize: hp(1.8), color: '#1e3a8a' },

  errorCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: hp(1.5),
    padding: hp(2),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(2),
  },

  errorText: { fontSize: hp(1.8), color: '#991b1b', flex: 1 },

  inputContainer: { marginBottom: hp(1.5) },
  label: { fontSize: hp(1.8), fontWeight: '500', color: '#374151', marginBottom: hp(0.8) },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: hp(1.2),
    backgroundColor: '#F3F3F5',
    height: hp(5.5),
  },

  inputIcon: { marginLeft: wp(3) },

  textInput: {
    flex: 1,
    paddingHorizontal: wp(3),
    fontSize: hp(1.7),
    color: '#111827',
    height: '100%',
  },

  eyeButton: { padding: wp(2.5) },

  requirementsCard: {
    backgroundColor: '#fff',
    borderRadius: hp(1.5),
    padding: hp(2),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },

  requirementsTitle: { fontSize: hp(1.8), fontWeight: '600', color: '#111827' },

  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2) },
  requirementText: { fontSize: hp(1.6), color: '#6b7280' },
  requirementMet: { color: '#16a34a' },

  matchIndicator: { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginTop: hp(0.8) },
  matchText: { color: '#16a34a', fontSize: hp(1.6) },
  mismatchText: { color: '#dc2626', fontSize: hp(1.6) },

  securityCard: {
    backgroundColor: '#fff',
    borderRadius: hp(1.5),
    padding: hp(2),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },

  securityTitle: { fontSize: hp(1.8), fontWeight: '600', marginBottom: hp(1) },
  tipText: { fontSize: hp(1.6), color: '#6b7280' },

  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },

  saveButton: {
    backgroundColor: '#3F51B5',
    borderRadius: hp(1.2),
    paddingVertical: hp(1.8),
    alignItems: 'center',
  },

  saveButtonDisabled: { backgroundColor: '#9ca3af', opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: hp(1.8), fontWeight: '600' },
});

export default ChangePasswordScreen;
