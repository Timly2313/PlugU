import React, { useState } from 'react';
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
  Platform
} from 'react-native';
import { ArrowLeft, User, Mail, MapPin, Phone, Camera } from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@email.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [location, setLocation] = useState('Auckland Park');
  const [bannerImage, setBannerImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [description, setDescription] = useState('Hello! I am John, a passionate buyer and seller on PlugU. I love finding great deals and connecting with fellow community members.');

  // Navigation functions
  const onBack = () => {
    router.push("/ProfileScreen")
  };

  const onSave = () => {
    // Handle save logic here
    Alert.alert('Success', 'Profile updated successfully!');
    router.push("/ProfileScreen")
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to change your profile picture!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const pickBannerImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to change your banner!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setBannerImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    onSave();
  };

  return (
    <ScreenWrapper bg="#F9FAFB">
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
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
            {/* Banner Image */}
            <View style={styles.bannerSection}>
              <View style={styles.bannerContainer}>
                {bannerImage ? (
                  <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
                ) : (
                  <View style={styles.defaultBanner} />
                )}
                <TouchableOpacity 
                  style={styles.bannerEditButton}
                  onPress={pickBannerImage}
                >
                  <Camera size={wp(5)} color="#3F51B5" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Picture */}
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                {profileImage ? (
                  <View style={styles.profileImageWrapper}>
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                  </View>
                ) : (
                  <View style={styles.defaultProfile}>
                    <Text style={styles.defaultProfileText}>JD</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.profileEditButton}
                  onPress={pickProfileImage}
                >
                  <Camera size={wp(4)} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.profileHint}>Tap to change photo</Text>
            </View>

            {/* Name */}
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
                />
              </View>
            </View>

            {/* Email */}
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
                />
              </View>
            </View>

            {/* Phone */}
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
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Description</Text>
              <View style={[styles.inputContainer, styles.descriptionContainer]}>
                <TextInput
                  style={[styles.textInput, styles.descriptionInput]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter a brief description"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Location */}
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
                />
              </View>
            </View>

            {/* Spacer for fixed button */}
            <View style={styles.spacer} />
          </View>
        </ScrollView>

        {/* Fixed Save Button */}
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSubmit}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: '#3F51B5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  },
  saveButtonText: {
    color: 'white',
    fontSize: wp(3.5),
    fontWeight: '600',
  },
});