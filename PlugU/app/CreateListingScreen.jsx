import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, StyleSheet, KeyboardAvoidingView, Platform,} from 'react-native';
import { ArrowLeft, ImageIcon, Video, X, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { hp, wp } from '../utilities/dimensions';
import { router } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';

export default function CreateListingScreen({ onSubmit }) {
  const onBack = () => router.back();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // IMAGE PICKER
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll permission needed');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  // VIDEO PICKER
  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newVideos = result.assets.map((a) => ({
        id: Math.random().toString(),
        type: 'video',
        url: a.uri,
        asset: a,
      }));
      setUploadedMedia((prev) => [...prev, ...newVideos]);
    }
  };

  const removeMedia = (id) => {
    setUploadedMedia((prev) => prev.filter((m) => m.id !== id));
  };

  // TAGS
  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags((prev) => [...prev, t]);
      setTagInput('');
    }
  };

  const removeTag = (t) => {
    setTags((prev) => prev.filter((tag) => tag !== t));
  };

  // SUBMIT LISTING
  const handleSubmit = () => {
    const images = uploadedMedia.filter((m) => m.type === 'image').map((m) => m.url);
    const videos = uploadedMedia.filter((m) => m.type === 'video').map((m) => m.url);

    const listingData = {
      id: Date.now().toString(),
      title,
      price,
      category,
      condition,
      description,
      images,
      videos,
      tags,
      timestamp: new Date().toISOString(),
    };

    onSubmit?.(listingData);
  };

  const canSubmit =
    title.trim() || description.trim() || uploadedMedia.length > 0 || price.trim();

  return (
    <ScreenWrapper>
        <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ArrowLeft size={wp(5)} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Listing</Text>
        </View>
      </View>

      {/* CONTENT */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // adjust based on header/footer height
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: hp(12) }} // leave space for fixed button
        >
          <View style={styles.content}>

            {/* MEDIA */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos / Videos</Text>
              <View style={styles.mediaButtons}>
                <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
                  <ImageIcon size={wp(5)} color="#3F51B5" />
                  <Text style={styles.mediaButtonText}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaButton} onPress={pickVideo}>
                  <Video size={wp(5)} color="#3F51B5" />
                  <Text style={styles.mediaButtonText}>Video</Text>
                </TouchableOpacity>
              </View>

              {uploadedMedia.length > 0 && (
                <View style={styles.mediaGrid}>
                  {uploadedMedia.map((media) => (
                    <View key={media.id} style={styles.mediaItem}>
                      {media.type === 'image' ? (
                        <Image source={{ uri: media.url }} style={styles.mediaImage} />
                      ) : (
                        <View style={styles.videoContainer}>
                          <Text style={styles.videoPlaceholder}>Video</Text>
                        </View>
                      )}
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
              <Text style={styles.sectionTitle}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter item name"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.sectionTitle, { marginTop: hp(2) }]}>Price</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter price (e.g. 250)"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={[styles.sectionTitle, { marginTop: hp(2) }]}>Category</Text>
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

              <Text style={[styles.sectionTitle, { marginTop: hp(2) }]}>Description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your item"
                multiline
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
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

      {/* FIXED SUBMIT BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>Create Listing</Text>
        </TouchableOpacity>
      </View>
    </View>
    </ScreenWrapper>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
  backButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: wp(5),  fontWeight: 'bold', color: '#111827' },
  scrollView: { flex: 1 },
  content: { padding: wp(4), gap: hp(2) },
  section: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(4),
    elevation: 1,
  },
  sectionTitle: { fontSize: wp(4), fontWeight: '600', color: '#111827', marginBottom: hp(1) },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(3),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    fontSize: wp(3.5),
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: hp(18),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(3),
    padding: wp(3),
    fontSize: wp(3.5),
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  mediaButtons: { flexDirection: 'row', gap: wp(3) },
  mediaButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3F51B5',
    borderRadius: wp(4),
    paddingVertical: hp(1.1),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(2),
  },
  mediaButtonText: { color: '#3F51B5', fontSize: wp(3.5), fontWeight: '500' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(3), marginTop: hp(1) },
  mediaItem: {
    width: (wp(100) - wp(16)) / 2,
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: wp(4),
    overflow: 'hidden',
  },
  mediaImage: { width: '100%', height: '100%' },
  videoContainer: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: { color: '#6B7280' },
  removeMediaButton: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: wp(1),
    borderRadius: wp(2),
  },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2), marginBottom: hp(1) },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    backgroundColor: '#E8EAF6',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: wp(50),
  },
  tagText: { color: '#3F51B5', fontSize: wp(3) },
  tagInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: wp(3),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    fontSize: wp(3.5),
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: hp(0.5),
  },
  tagCount: { fontSize: wp(2.6), color: '#6B7280' },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: wp(4),
    backgroundColor:"#f9fafb",
   
  },
  submitButton: {
    backgroundColor: '#3F51B5',
    paddingVertical: hp(1.5),
    borderRadius: wp(4),
    alignItems: 'center',
  },
  submitDisabled: { backgroundColor: '#9CA3AF' },
  submitText: { color: 'white', fontSize: wp(4), fontWeight: '600' },
});
