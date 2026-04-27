import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, ArrowRight, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from "../context/authContext";
import { uploadMediaToSupabase } from '../services/imageService';
import { useRouter } from "expo-router";

export default function OnboardingScreen({ onComplete, onSkip }) {
  const { user, updateProfile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    location: '',
    bio: '',
    occupation: '',
  });

  const requestMediaLibraryPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos.');
        return false;
      }
      return true;
    }
    return false;
  };

  const handleImageUpload = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission && Platform.OS !== 'web') return;

    try {
      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0].uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      await saveProfile(true); 
    }
  };

  // Central save function: if isCompleteSave, we require step1 & step2 fields (already validated)
  // For skip, we accept whatever is filled.
  const saveProfile = async (isCompleteSave = false) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to complete onboarding.');
      return;
    }

    setIsSaving(true);

    try {
      let profilePictureUrl = null;

      // Upload profile picture if selected
      if (profileImage) {
        profilePictureUrl = await uploadMediaToSupabase(
          profileImage,
          user.id,
          'avatars',
          'image'
        );
      }

      // Trim all text fields
      const trimmedData = {
        display_name: formData.fullName.trim(),
        username: formData.username.trim(),
        personal_email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        date_of_birth: formData.dateOfBirth.trim() || null,
        location: formData.location.trim() || null,
        bio: formData.bio.trim() || null,
        occupation: formData.occupation.trim() || null,
        avatar_url: profilePictureUrl,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      // Remove empty strings or null values
      Object.keys(trimmedData).forEach(key => {
        if (trimmedData[key] === undefined || trimmedData[key] === null || trimmedData[key] === '') {
          delete trimmedData[key];
        }
      });

      const { error } = await updateProfile(trimmedData);
      if (error) throw error;

      await refreshProfile();

      if (isCompleteSave) {
        Alert.alert('Success', 'Your profile has been created!', [
          { text: 'OK', onPress: () => onComplete?.() }
        ]);
       router.replace('/(tabs)/HomeScreen');
      } else {
        
        onSkip?.();
      }
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Upload Failed', error.message || 'Could not save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    await saveProfile(false);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepValid = () => {
    if (step === 1) return formData.fullName.trim() !== '' && formData.username.trim() !== '';
    if (step === 2) return formData.email.trim() !== '' && formData.phone.trim() !== '';
    return true;
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            {/* Profile Picture */}
            <View style={styles.profileImageContainer}>
              <View style={styles.imageWrapper}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <LinearGradient
                    colors={['#3F51B5', '#5C6BC0']}
                    style={styles.profileImagePlaceholder}
                  >
                    <User size={48} color="#FFFFFF" />
                  </LinearGradient>
                )}
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handleImageUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#3F51B5" />
                  ) : (
                    <Camera size={20} color="#3F51B5" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.uploadHint}>Upload profile picture</Text>
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Timly"
                  placeholderTextColor="#9CA3AF"
                  value={formData.fullName}
                  onChangeText={(text) => handleChange('fullName', text)}
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Username <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  style={[styles.input, styles.usernameInput]}
                  placeholder="timlyonline"
                  placeholderTextColor="#9CA3AF"
                  value={formData.username}
                  onChangeText={(text) => handleChange('username', text)}
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email Address <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="timly@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => handleChange('email', text)}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Phone Number <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Phone size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+27 700 000 000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => handleChange('phone', text)}
                />
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Auckland Park, Johannesburg"
                  placeholderTextColor="#9CA3AF"
                  value={formData.location}
                  onChangeText={(text) => handleChange('location', text)}
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <View style={styles.inputWrapper}>
                <Calendar size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={formData.dateOfBirth}
                  onChangeText={(text) => handleChange('dateOfBirth', text)}
                />
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            {/* Occupation */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occupation</Text>
              <View style={styles.inputWrapper}>
                <Briefcase size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Software Engineer"
                  placeholderTextColor="#9CA3AF"
                  value={formData.occupation}
                  onChangeText={(text) => handleChange('occupation', text)}
                />
              </View>
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <View style={styles.textareaWrapper}>
                <TextInput
                  style={styles.textarea}
                  placeholder="Tell us a bit about yourself..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={formData.bio}
                  onChangeText={(text) => handleChange('bio', text)}
                />
              </View>
              <Text style={styles.charCount}>{formData.bio.length}/500 characters</Text>
            </View>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Profile Summary</Text>
              <View style={styles.summaryContent}>
                <View style={styles.summaryProfileRow}>
                  <View style={styles.summaryAvatar}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.summaryAvatarImage} />
                    ) : (
                      <LinearGradient
                        colors={['#3F51B5', '#5C6BC0']}
                        style={styles.summaryAvatarPlaceholder}
                      >
                        <User size={20} color="#FFFFFF" />
                      </LinearGradient>
                    )}
                  </View>
                  <View>
                    <Text style={styles.summaryName}>{formData.fullName || 'Your Name'}</Text>
                    <Text style={styles.summaryUsername}>@{formData.username || 'username'}</Text>
                  </View>
                </View>
                {formData.email ? (
                  <View style={styles.summaryRow}>
                    <Mail size={16} color="#6B7280" />
                    <Text style={styles.summaryText}>{formData.email}</Text>
                  </View>
                ) : null}
                {formData.phone ? (
                  <View style={styles.summaryRow}>
                    <Phone size={16} color="#6B7280" />
                    <Text style={styles.summaryText}>{formData.phone}</Text>
                  </View>
                ) : null}
                {formData.location ? (
                  <View style={styles.summaryRow}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.summaryText}>{formData.location}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={['#3F51B5', '#5C6BC0']} style={styles.gradientContainer}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              {[1, 2, 3].map((s) => (
                <View key={s} style={[styles.progressBar, s <= step ? styles.progressBarActive : styles.progressBarInactive]} />
              ))}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.stepIndicator}>Step {step} of 3</Text>
              <Text style={styles.title}>
                {step === 1 && 'Tell us about yourself'}
                {step === 2 && 'Contact Information'}
                {step === 3 && 'Complete Your Profile'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 1 && "Let's start with the basics"}
                {step === 2 && 'How can others reach you?'}
                {step === 3 && 'Add some details about yourself'}
              </Text>
            </View>
          </View>

          {/* Content Card */}
          <View style={styles.contentCard}>
            {renderStepContent()}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, (!isStepValid() || isSaving) && styles.primaryButtonDisabled]}
                onPress={handleNext}
                disabled={!isStepValid() || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>{step === 3 ? 'Complete Profile' : 'Continue'}</Text>
                    <ArrowRight size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.secondaryButtons}>
                {step > 1 && (
                  <TouchableOpacity style={styles.outlineButton} onPress={handleBack} disabled={isSaving}>
                    <Text style={styles.outlineButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
                {onSkip && (
                  <TouchableOpacity style={styles.ghostButton} onPress={handleSkip} disabled={isSaving}>
                    <Text style={styles.ghostButtonText}>Skip for now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.decoration1} />
          <View style={styles.decoration2} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#FFFFFF',
  },
  progressBarInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextContainer: {
    gap: 8,
  },
  stepIndicator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginTop: 8,
  },
  stepContainer: {
    gap: 24,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  profileImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: 'rgba(63, 81, 181, 0.2)',
  },
  profileImagePlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(63, 81, 181, 0.2)',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3F51B5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    height: 48,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
  },
  atSign: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 12,
  },
  usernameInput: {
    paddingLeft: 4,
  },
  textareaWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  textarea: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 128,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  summaryCard: {
    backgroundColor: 'rgba(63, 81, 181, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(63, 81, 181, 0.1)',
    gap: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryContent: {
    gap: 12,
  },
  summaryProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  summaryAvatarImage: {
    width: '100%',
    height: '100%',
  },
  summaryAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  summaryUsername: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#4B5563',
  },
  buttonContainer: {
    marginTop: 32,
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3F51B5',
    borderRadius: 12,
    height: 48,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  outlineButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  ghostButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 48,
    backgroundColor: 'transparent',
  },
  ghostButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  decoration1: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  decoration2: {
    position: 'absolute',
    bottom: 80,
    right: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
});