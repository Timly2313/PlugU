import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, Alert, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { ArrowLeft, ImageIcon, X, MapPin } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { hp, wp } from '../utilities/dimensions';
import { router } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/authContext';
import { uploadMediaToSupabase } from '../services/imageService';

export default function CreateListingScreen() {
  const onBack = () => router.back();
  const { user, profile } = useAuth();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // ─── Image picker ─────────────────────────────────────────────────────────

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll permission needed');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newImages = result.assets.map((a) => ({
        id: Math.random().toString(),
        type: 'image',
        url: a.uri,
        asset: a,
      }));
      setUploadedMedia((prev) => [...prev, ...newImages]);
    }
  };

  const removeMedia = (id) => {
    setUploadedMedia((prev) => prev.filter((m) => m.id !== id));
  };

  // ─── Location ─────────────────────────────────────────────────────────────

  const requestLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is needed to auto-fill your location.');
        return;
      }
      const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = coords.coords;
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const locationString = [place.district, place.city].filter(Boolean).join(', ');
      setLatitude(lat);
      setLongitude(lng);
      setLocation(locationString || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (e) {
      Alert.alert('Error', 'Could not get your location. Please enter it manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const clearLocation = () => {
    setLocation('');
    setLatitude(null);
    setLongitude(null);
  };

  // ─── Tags ─────────────────────────────────────────────────────────────────

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags((prev) => [...prev, t]);
      setTagInput('');
    }
  };

  const removeTag = (t) => setTags((prev) => prev.filter((tag) => tag !== t));

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!user || !profile) { Alert.alert('Error', 'You must be logged in'); return; }
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (!description.trim()) { Alert.alert('Error', 'Description is required'); return; }
    if (!category.trim()) { Alert.alert('Error', 'Category is required'); return; }

    setIsSubmitting(true);
    try {
      const mediaUrls = [];
      for (const media of uploadedMedia) {
        const publicUrl = await uploadMediaToSupabase(media.url, user.id, 'listing-images', media.type);
        mediaUrls.push(publicUrl);
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: price ? Number(price) : undefined,
        currency: 'ZAR',
        category: category.trim(),
        condition: condition ? [condition] : null,
        images: mediaUrls,
        location: location.trim() || profile.location || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        tags,
      };

      const { data, error } = await supabase.functions.invoke('create_listing', { body: payload });
      if (error) throw error;

      if (data?.listing?.moderation?.flagged) {
        Alert.alert(
          'Listing Created',
          'Your listing was created but is under review. It may be temporarily hidden until moderation is complete.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      Alert.alert('Success', 'Listing created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Create listing error:', error);
      if (error?.message?.includes('community guidelines')) {
        Alert.alert('Content Rejected', 'Your listing was rejected because it violates community guidelines.');
      } else if (error?.message?.includes('Validation')) {
        Alert.alert('Validation Error', error.message.replace('Validation: ', ''));
      } else {
        Alert.alert('Error', error.message || 'Failed to create listing. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !isSubmitting &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    category.trim().length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      <View style={styles.container}>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeft size={wp(5)} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Listing</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: hp(12) }}
          >
            <View style={styles.content}>

              {/* MEDIA */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                  <ImageIcon size={wp(5)} color="#3F51B5" />
                  <Text style={styles.mediaButtonText}>Add Photos</Text>
                </TouchableOpacity>

                {uploadedMedia.length > 0 && (
                  <View style={styles.mediaGrid}>
                    {uploadedMedia.map((media) => (
                      <View key={media.id} style={styles.mediaItem}>
                        <Image source={{ uri: media.url }} style={styles.mediaImage} />
                        <TouchableOpacity
                          style={styles.removeMediaButton}
                          onPress={() => removeMedia(media.id)}
                        >
                          <X size={wp(4)} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* MAIN FIELDS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter item name"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={[styles.sectionTitle, { marginTop: hp(2) }]}>Price (ZAR)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter price (e.g. 250)"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />

                <Text style={[styles.sectionTitle, { marginTop: hp(2) }]}>Category *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Electronics, Clothing"
                  value={category}
                  onChangeText={setCategory}
                />

                <Text style={[styles.sectionTitle, { marginTop: hp(2) }]}>Condition</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. New, Used"
                  value={condition}
                  onChangeText={setCondition}
                />

                <Text style={[styles.sectionTitle, { marginTop: hp(2) }]}>Description *</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe your item"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                />
              </View>

              {/* LOCATION */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.locationRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="City, Province"
                    value={location}
                    onChangeText={(text) => {
                      setLocation(text);
                      setLatitude(null);
                      setLongitude(null);
                    }}
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
                    : <MapPin size={wp(4)} color="#3F51B5" />
                  }
                  <Text style={styles.detectLocationText}>
                    {isLocating ? 'Detecting...' : 'Use my current location'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* TAGS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tags (optional)</Text>
                <View style={styles.tagsContainer}>
                  {tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)}>
                        <X size={wp(3.5)} color="#3F51B5" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                {tags.length < 10 && (
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Type a tag and press Enter (max 10)"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                    placeholderTextColor="#9CA3AF"
                  />
                )}
                <Text style={styles.tagCount}>{tags.length}/10 tags</Text>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* SUBMIT */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? 'Creating listing...' : 'Create Listing'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    paddingHorizontal: wp(4), flexDirection: 'row', alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
  backButton: {
    width: wp(9), height: wp(9), borderRadius: wp(4.5),
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: wp(5), fontWeight: 'bold', color: '#111827' },
  scrollView: { flex: 1 },
  content: { padding: wp(4), gap: hp(2) },
  section: { backgroundColor: 'white', borderRadius: wp(4), padding: wp(4), elevation: 1 },
  sectionTitle: { fontSize: wp(4), fontWeight: '600', color: '#111827', marginBottom: hp(1) },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: wp(3),
    paddingHorizontal: wp(3), paddingVertical: hp(1),
    fontSize: wp(3.5), color: '#111827', backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: hp(18), borderWidth: 1, borderColor: '#E5E7EB', borderRadius: wp(3),
    padding: wp(3), fontSize: wp(3.5), color: '#111827', backgroundColor: '#F9FAFB',
  },
  mediaButton: {
    borderWidth: 1, borderColor: '#3F51B5', borderRadius: wp(4),
    paddingVertical: hp(1.1), flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: wp(2),
  },
  mediaButtonText: { color: '#3F51B5', fontSize: wp(3.5), fontWeight: '500' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(3), marginTop: hp(1.5) },
  mediaItem: {
    width: (wp(100) - wp(20)) / 2, aspectRatio: 1,
    backgroundColor: '#F3F4F6', borderRadius: wp(4), overflow: 'hidden',
  },
  mediaImage: { width: '100%', height: '100%' },
  removeMediaButton: {
    position: 'absolute', top: wp(2), right: wp(2),
    backgroundColor: 'rgba(0,0,0,0.6)', padding: wp(1), borderRadius: wp(2),
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(1) },
  clearLocationBtn: { padding: wp(2) },
  detectLocationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: wp(2),
    paddingVertical: hp(1), paddingHorizontal: wp(2),
    borderWidth: 1, borderColor: '#C7D2FE', borderRadius: wp(3),
    backgroundColor: '#EEF2FF', alignSelf: 'flex-start',
  },
  detectLocationText: { color: '#3F51B5', fontSize: wp(3.5), fontWeight: '500' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2), marginBottom: hp(1) },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: wp(1),
    backgroundColor: '#E8EAF6', paddingHorizontal: wp(3),
    paddingVertical: hp(0.8), borderRadius: wp(50),
  },
  tagText: { color: '#3F51B5', fontSize: wp(3) },
  tagInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: wp(3),
    paddingHorizontal: wp(3), paddingVertical: hp(1),
    fontSize: wp(3.5), color: '#111827', backgroundColor: '#F9FAFB', marginBottom: hp(0.5),
  },
  tagCount: { fontSize: wp(2.6), color: '#6B7280' },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: wp(4), backgroundColor: '#F9FAFB' },
  submitButton: {
    backgroundColor: '#3F51B5', paddingVertical: hp(1.5), borderRadius: wp(4), alignItems: 'center',
  },
  submitDisabled: { backgroundColor: '#9CA3AF' },
  submitText: { color: 'white', fontSize: wp(4), fontWeight: '600' },
});
