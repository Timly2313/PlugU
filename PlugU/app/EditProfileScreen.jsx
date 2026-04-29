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
import {
  ArrowLeft,
  User,
  Mail,
  MapPin,
  Phone,
  Camera,
  Globe,
  Briefcase,
  Calendar,
  X,
} from 'lucide-react-native';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper from '../components/ScreenWrapper';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../context/authContext';
import { uploadMediaToSupabase } from '../services/imageService';
import DateTimePicker from '@react-native-community/datetimepicker';

// ─── Section header component ────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
    <View style={styles.sectionHeaderLine} />
  </View>
);

// ─── Input field component ────────────────────────────────────────────────────
const InputField = ({ label, icon: Icon, editable = true, required, hint, ...props }) => (
  <View style={styles.inputSection}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.requiredDot}> *</Text>}
      </Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
    <View style={[styles.inputContainer, !editable && styles.inputDisabled]}>
      {Icon && <Icon size={wp(4)} color="#9CA3AF" style={styles.inputIcon} />}
      <TextInput
        style={styles.textInput}
        placeholderTextColor="#9CA3AF"
        editable={editable}
        {...props}
      />
    </View>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();

  // ── Basic info
  const [displayName, setDisplayName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');          // personal_email
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [occupation, setOccupation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── Location
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // ── Images
  const [profileImage, setProfileImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);

  // ── UI
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // ── Populate from profile
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setUserName(profile.username ?? '');
    setEmail(profile.personal_email ?? '');
    setPhone(profile.phone ?? '');
    setBio(profile.bio ?? '');
    setWebsite(profile.website ?? '');
    setOccupation(profile.occupation ?? '');
    setDateOfBirth(profile.date_of_birth ?? '');
    setLocation(profile.location ?? '');
    setLatitude(profile.latitude ?? null);
    setLongitude(profile.longitude ?? null);
    setProfileImage(profile.avatar_url ?? null);
    setBannerImage(profile.cover_image_url ?? null);
  }, [profile]);

  // ── GPS location
  const requestLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Enable location access in Settings to auto-detect your location.',
          [{ text: 'OK' }]
        );
        return;
      }
      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = coords.coords;
      setLatitude(lat);
      setLongitude(lng);
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (place) {
        const parts = [place.name,place.street, place.district, place.city].filter(Boolean);
        setLocation(parts.join(', '));
      }
    } catch (err) {
      Alert.alert('Location Error', 'Could not fetch your location. Please try again or type it manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const clearLocation = () => {
    setLocation('');
    setLatitude(null);
    setLongitude(null);
  };

  // ── Image picker
  const pickImage = async (options = {}) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photo library.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      ...options,
    });
    return result.canceled ? null : result.assets[0].uri;
  };

  const pickProfileImage = async () => {
    const uri = await pickImage({ allowsEditing: true, aspect: [1, 1] });
    if (uri) setProfileImage(uri);
  };

  const pickBannerImage = async () => {
    const uri = await pickImage({ allowsEditing: true, aspect: [3, 1] });
    if (uri) setBannerImage(uri);
  };

  // ── Save
  const onSave = async () => {
    const trimmedName = displayName.trim();
    const trimmedUsername = userName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) return Alert.alert('Validation', 'Display name is required.');
    if (!trimmedUsername) return Alert.alert('Validation', 'Username is required.');
    if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail))
      return Alert.alert('Validation', 'Please enter a valid email.');

    setIsSaving(true);
    try {
      let finalAvatarUrl = profileImage;
      let finalBannerUrl = bannerImage;

      if (profileImage?.startsWith('file://')) {
        finalAvatarUrl = await uploadMediaToSupabase(profileImage, user.id, 'avatars', 'image');
      }
      if (bannerImage?.startsWith('file://')) {
        finalBannerUrl = await uploadMediaToSupabase(bannerImage, user.id, 'cover-images', 'image');
      }

      const updates = {};
      const changed = (a, b) => a !== (b ?? '');

      if (changed(trimmedName, profile.display_name)) updates.display_name = trimmedName;
      if (changed(trimmedUsername, profile.username)) updates.username = trimmedUsername;
      if (changed(trimmedEmail, profile.personal_email)) updates.personal_email = trimmedEmail;
      if (changed(phone.trim(), profile.phone)) updates.phone = phone.trim();
      if (changed(bio.trim(), profile.bio)) updates.bio = bio.trim();
      if (changed(website.trim(), profile.website)) updates.website = website.trim();
      if (changed(occupation.trim(), profile.occupation)) updates.occupation = occupation.trim();
      if (changed(dateOfBirth.trim(), profile.date_of_birth)) updates.date_of_birth = dateOfBirth.trim() || null;
      if (changed(location.trim(), profile.location)) updates.location = location.trim();
      if (latitude !== profile.latitude) updates.latitude = latitude;
      if (longitude !== profile.longitude) updates.longitude = longitude;
      if (finalAvatarUrl !== profile.avatar_url) updates.avatar_url = finalAvatarUrl;
      if (finalBannerUrl !== profile.cover_image_url) updates.cover_image_url = finalBannerUrl;

      if (!Object.keys(updates).length) {
        Alert.alert('No changes', 'Nothing to save.');
        return;
      }

      updates.updated_at = new Date().toISOString();
      const { error } = await updateProfile(updates);
      if (error) throw error;

      await refreshProfile();
      Alert.alert('Saved', 'Your profile has been updated.', [{ text: 'OK' }]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || 'Could not save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render helpers
  const renderProfileImage = () => {
    if (profileImage) {
      return <Image source={{ uri: profileImage }} style={styles.profileImage} />;
    }
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (
      <View style={styles.defaultProfile}>
        <Text style={styles.defaultProfileText}>{initials || 'U'}</Text>
      </View>
    );
  };

  const renderBanner = () =>
    bannerImage
      ? <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
      : <View style={styles.defaultBanner} />;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScreenWrapper bg="#F9FAFB">
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isSaving}>
              <ArrowLeft size={wp(5)} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: wp(9) }} />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Banner ── */}
            <View style={styles.bannerSection}>
              <View style={styles.bannerContainer}>
                {renderBanner()}
                <View style={styles.bannerOverlay} />
                <TouchableOpacity
                  style={styles.bannerEditButton}
                  onPress={pickBannerImage}
                  disabled={isSaving || isUploadingBanner}
                >
                  {isUploadingBanner
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Camera size={wp(4.5)} color="#fff" />}
                </TouchableOpacity>
              </View>

              {/* ── Avatar overlapping banner ── */}
              <View style={styles.avatarRow}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarWrapper}>{renderProfileImage()}</View>
                  <TouchableOpacity
                    style={styles.avatarEditButton}
                    onPress={pickProfileImage}
                    disabled={isSaving || isUploadingProfile}
                  >
                    {isUploadingProfile
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Camera size={wp(3.5)} color="#fff" />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ── Form ── */}
            <View style={styles.formCard}>

              <SectionHeader title="Account" />

              <InputField
                label="Username"
                icon={User}
                value={userName}
                onChangeText={setUserName}
                placeholder="@username"
                autoCapitalize="none"
                editable={!isSaving}
                required
              />

              <InputField
                label="Display Name"
                icon={User}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your full name"
                editable={!isSaving}
                required
              />

              <SectionHeader title="Contact" />

              <InputField
                label="Personal Email"
                icon={Mail}
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSaving}
              />

              <InputField
                label="Phone"
                icon={Phone}
                value={phone}
                onChangeText={setPhone}
                placeholder="+27 700 000 0000"
                keyboardType="phone-pad"
                editable={!isSaving}
              />

              <InputField
                label="Website"
                icon={Globe}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yoursite.com"
                keyboardType="url"
                autoCapitalize="none"
                editable={!isSaving}
              />

              <SectionHeader title="About" />

              <InputField
                label="Occupation"
                icon={Briefcase}
                value={occupation}
                onChangeText={setOccupation}
                placeholder="e.g. Software Engineer"
                editable={!isSaving}
              />

              {/* ── Date of Birth ── */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowDatePicker(true)}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <Calendar size={wp(4)} color="#9CA3AF" style={styles.inputIcon} />
                  <Text style={[styles.textInput, !dateOfBirth && { color: '#9CA3AF' }]}>
                    {dateOfBirth || 'Select date of birth'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth ? new Date(dateOfBirth) : new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onValueChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (event.type === 'dismissed') {
                      setShowDatePicker(false);
                      return;
                    }
                    if (selectedDate) {
                      const iso = selectedDate.toISOString().split('T')[0];
                      setDateOfBirth(iso);
                      if (Platform.OS !== 'ios') setShowDatePicker(false);
                    }
                  }}
                />
              )}

              {/* ── Bio ── */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>Bio</Text>
                <View style={[styles.inputContainer, styles.bioContainer]}>
                  <TextInput
                    style={[styles.textInput, styles.bioInput]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell people about yourself…"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!isSaving}
                  />
                </View>
              </View>

              <SectionHeader title="Location" />

              {/* ── Location field ── */}
              <View style={styles.inputSection}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.locationRow}>
                  <TextInput
                    style={[styles.inputContainer, styles.textInput, { flex: 1 }]}
                    placeholder="Your Location"
                    placeholderTextColor="#9CA3AF"
                    value={location}
                    onChangeText={(text) => {
                      setLocation(text);
                      setLatitude(null);
                      setLongitude(null);
                    }}
                    editable={!isSaving}
                  />
                  {location.length > 0 && (
                    <TouchableOpacity style={styles.clearLocationBtn} onPress={clearLocation}>
                      <X size={wp(4)} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.detectLocationBtn}
                  onPress={requestLocation}
                  disabled={isLocating}
                >
                  {isLocating
                    ? <ActivityIndicator size="small" color="#3F51B5" />
                    : <MapPin size={wp(4)} color="#3F51B5" />}
                  <Text style={styles.detectLocationText}>
                    {isLocating ? 'Detecting...' : 'Use my current location'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.spacer} />
            </View>
          </ScrollView>

          {/* ── Fixed save button ── */}
          <View style={styles.fixedFooter}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={onSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScreenWrapper>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const INDIGO = '#3F51B5';
const INDIGO_DARK = '#1E1B4B';
const INDIGO_LIGHT = '#EEF0FF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Header — original white style
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  // Banner
  bannerSection: { marginBottom: hp(5) },
  bannerContainer: { position: 'relative', width: '100%', height: hp(18) },
  defaultBanner: { width: '100%', height: '100%', backgroundColor: INDIGO },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,27,75,0.25)',
  },
  bannerEditButton: {
    position: 'absolute',
    bottom: hp(1.2),
    right: wp(3.5),
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: wp(2.2),
    borderRadius: wp(3),
  },

  // Avatar
  avatarRow: {
    position: 'absolute',
    bottom: -hp(4.5),
    left: wp(4),
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: wp(3),
  },
  avatarContainer: { position: 'relative' },
  avatarWrapper: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    overflow: 'hidden',
    borderWidth: 3.5,
    borderColor: '#F4F5F9',
  },
  profileImage: { width: '100%', height: '100%' },
  defaultProfile: {
    width: '100%',
    height: '100%',
    backgroundColor: INDIGO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultProfileText: { color: '#fff', fontSize: wp(6), fontWeight: '600' },
  avatarEditButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: wp(7),
    height: wp(7),
    backgroundColor: INDIGO,
    borderRadius: wp(3.5),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F4F5F9',
  },
  // Form card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(5),
    borderTopRightRadius: wp(5),
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(12),
    minHeight: hp(60),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2.5),
    marginBottom: hp(1.5),
    gap: wp(2.5),
  },
  sectionHeaderText: {
    fontSize: wp(3.2),
    fontWeight: '700',
    color: INDIGO,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: INDIGO_LIGHT,
  },

  // Input
  inputSection: { marginBottom: hp(2) },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  label: { fontSize: wp(3.5), fontWeight: '500', color: '#374151' },
  requiredDot: { color: '#EF4444' },
  hint: { fontSize: wp(3), color: '#9CA3AF' },
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
  inputDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  bioContainer: { alignItems: 'flex-start', minHeight: hp(12) },
  inputIcon: { marginRight: wp(3) },
  textInput: {
    flex: 1,
    paddingVertical: hp(1.5),
    fontSize: wp(3.5),
    color: '#111827',
  },
  bioInput: {
    height: hp(10),
    textAlignVertical: 'top',
    paddingTop: hp(1.5),
  },

  // Location
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(1) },
  clearLocationBtn: { padding: wp(2) },
  detectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: wp(3),
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
  },
  detectLocationText: { color: '#3F51B5', fontSize: wp(3.5), fontWeight: '500' },

  spacer: { height: hp(4) },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // Footer save button
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: wp(3),
    paddingTop: hp(1.2),
    paddingBottom: Platform.OS === 'ios' ? hp(3.5) : hp(2),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: INDIGO,
    borderRadius: wp(4),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.55 },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: wp(3.8),
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});