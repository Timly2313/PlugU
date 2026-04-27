import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, User, Mail, MapPin, Phone, Camera } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/authContext';
import { uploadMediaToSupabase } from '../services/imageService';

export default function EditProfileScreen() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();

  // Local state
  const [name, setName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');         
  const [profileImage, setProfileImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);

  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Populate form when profile is loaded
  useEffect(() => {
    if (!profile) return;

    setName(profile.display_name ?? '');
    setUserName(profile.username ?? '');
    setEmail(profile.personal_email ?? '');
    setPhone(profile.phone ?? '');
    setLocation(profile.location ?? '');
    setBio(profile.bio ?? '');
    setProfileImage(profile.avatar_url ?? null);
    setBannerImage(profile.cover_image_url ?? null);
  }, [profile]);

  const onBack = () => {
    router.back();
  };

  // Helper to pick an image
  const pickImage = async (options = { mediaTypes: 'images', allowsEditing: true, quality: 0.8 }) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photo library to change images.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

  const pickProfileImage = async () => {
    const uri = await pickImage({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (uri) setProfileImage(uri);
  };

  const pickBannerImage = async () => {
    const uri = await pickImage({ mediaTypes: 'images', allowsEditing: true, aspect: [3, 1], quality: 0.8 });
    if (uri) setBannerImage(uri);
  };

  // Save handler using AuthContext updateProfile
  const onSave = async () => {
    // Trim inputs
    const trimmedName = name.trim();
    const trimmedUsername = userName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedLocation = location.trim();
    const trimmedBio = bio.trim();

    // Basic validation
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Full name is required.');
      return;
    }
    if (!trimmedUsername) {
      Alert.alert('Validation Error', 'Username is required.');
      return;
    }
    if (!trimmedEmail) {
      Alert.alert('Validation Error', 'Email is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    setIsSaving(true);

    try {
      let finalAvatarUrl = profileImage;
      let finalBannerUrl = bannerImage;

      // Upload new profile image if it's a local file
      if (profileImage && profileImage.startsWith('file://')) {
        finalAvatarUrl = await uploadMediaToSupabase(
          profileImage,
          user.id,
          'avatars',
          'image'
        );
      }

      // Upload new banner image if it's a local file
      if (bannerImage && bannerImage.startsWith('file://')) {
        finalBannerUrl = await uploadMediaToSupabase(
          bannerImage,
          user.id,
          'cover-images',
          'image'
        );
      }

      // Prepare updates object (only include changed fields)
      const updates = {};
      if (trimmedName !== profile.display_name) updates.display_name = trimmedName;
      if (trimmedUsername !== profile.username) updates.username = trimmedUsername;
      if (trimmedEmail !== profile.personal_email) updates.personal_email = trimmedEmail;
      if (trimmedPhone !== profile.phone) updates.phone = trimmedPhone;
      if (trimmedLocation !== profile.location) updates.location = trimmedLocation;
      if (trimmedBio !== profile.bio) updates.bio = trimmedBio;
      if (finalAvatarUrl !== profile.avatar_url) updates.avatar_url = finalAvatarUrl;
      if (finalBannerUrl !== profile.cover_image_url) updates.cover_image_url = finalBannerUrl;

      if (Object.keys(updates).length === 0) {
        Alert.alert('No changes', 'You haven‘t changed any information.');
        setIsSaving(false);
        return;
      }

      updates.updated_at = new Date().toISOString();

      const { error } = await updateProfile(updates);
      if (error) throw error;

      // Refresh the global profile state
      await refreshProfile();

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK' }, 
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Update Failed', error.message || 'Could not update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to render image or placeholder
  const renderProfileImage = () => {
    if (profileImage) {
      return <Image source={{ uri: profileImage }} style={styles.profileImage} />;
    }
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return (
      <View style={styles.defaultProfile}>
        <Text style={styles.defaultProfileText}>{initials || 'U'}</Text>
      </View>
    );
  };

  const renderBanner = () => {
    if (bannerImage) {
      return <Image source={{ uri: bannerImage }} style={styles.bannerImage} />;
    }
    return <View style={styles.defaultBanner} />;
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScreenWrapper bg="#F9FAFB">
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={isSaving}>
              <ArrowLeft size={wp(5)} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.content}>
              {/* Banner Section */}
              <View style={styles.bannerSection}>
                <View style={styles.bannerContainer}>
                  {renderBanner()}
                  <TouchableOpacity
                    style={styles.bannerEditButton}
                    onPress={pickBannerImage}
                    disabled={isSaving || isUploadingBanner}
                  >
                    {isUploadingBanner ? (
                      <ActivityIndicator size="small" color="#3F51B5" />
                    ) : (
                      <Camera size={wp(5)} color="#3F51B5" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Profile Picture */}
              <View style={styles.profileSection}>
                <View style={styles.profileImageContainer}>
                  <View style={styles.profileImageWrapper}>
                    {renderProfileImage()}
                  </View>
                  <TouchableOpacity
                    style={styles.profileEditButton}
                    onPress={pickProfileImage}
                    disabled={isSaving || isUploadingProfile}
                  >
                    {isUploadingProfile ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Camera size={wp(4)} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.profileHint}>Tap to change photo</Text>
              </View>

              {/* Form Fields */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputContainer}>
                  <User size={wp(4)} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={userName}
                    onChangeText={setUserName}
                    placeholder="Enter your username"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <User size={wp(4)} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={wp(4)} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <Phone size={wp(4)} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Bio</Text>
                <View style={[styles.inputContainer, styles.descriptionContainer]}>
                  <TextInput
                    style={[styles.textInput, styles.descriptionInput]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us something about yourself"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.inputContainer}>
                  <MapPin size={wp(4)} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter your location"
                    placeholderTextColor="#9CA3AF"
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={styles.spacer} />
            </View>
          </ScrollView>

          {/* Fixed Save Button */}
          <View style={styles.fixedButtonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScreenWrapper>
    </>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  bannerSection: {
    marginBottom: hp(8),
  },
  bannerContainer: {
    position: 'relative',
    width: '100%',
    height: hp(16),
  },
  defaultBanner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3F51B5',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerEditButton: {
    position: 'absolute',
    bottom: hp(1),
    right: wp(3),
    backgroundColor: 'white',
    padding: wp(2),
    borderRadius: wp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -hp(10),
    marginBottom: hp(3),
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImageWrapper: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'white',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  defaultProfile: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultProfileText: {
    color: 'white',
    fontSize: wp(6),
    fontWeight: '600',
  },
  profileEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp(8),
    height: wp(8),
    backgroundColor: '#3F51B5',
    borderRadius: wp(4),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileHint: {
    fontSize: wp(3.5),
    color: '#6B7280',
    marginTop: hp(1),
  },
  inputSection: {
    marginBottom: hp(2),
    paddingHorizontal: wp(4),
  },
  label: {
    fontSize: wp(3.5),
    fontWeight: '500',
    color: '#374151',
    marginBottom: hp(1),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(4),
    paddingHorizontal: wp(4),
    minHeight: hp(6),
  },
  descriptionContainer: {
    alignItems: 'flex-start',
    minHeight: hp(12),
  },
  inputIcon: {
    marginRight: wp(3),
  },
  textInput: {
    flex: 1,
    paddingVertical: hp(1.5),
    fontSize: wp(3.5),
    color: '#111827',
  },
  descriptionInput: {
    height: hp(10),
    textAlignVertical: 'top',
    paddingTop: hp(1.5),
  },
  spacer: {
    height: hp(10),
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.5),
    paddingBottom: Platform.OS === 'ios' ? hp(2) : hp(0),
  },
  saveButton: {
    backgroundColor: '#3F51B5',
    borderRadius: wp(4),
    paddingVertical: hp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.75),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: wp(3.5),
    fontWeight: '600',
  },
});