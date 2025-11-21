import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, ImageIcon, Video, X, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { hp, wp } from '../utilities/dimensions';
import { router } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';

export default function CreatePostScreen({ onSubmit }) {
  const onBack = () => router.back();

  const [postContent, setPostContent] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => ({
        id: Math.random().toString(),
        type: 'image',
        url: asset.uri,
        asset,
      }));
      setUploadedMedia((prev) => [...prev, ...newImages]);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newVideos = result.assets.map((asset) => ({
        id: Math.random().toString(),
        type: 'video',
        url: asset.uri,
        asset,
      }));
      setUploadedMedia((prev) => [...prev, ...newVideos]);
    }
  };

  const removeMedia = (id) => setUploadedMedia((prev) => prev.filter((m) => m.id !== id));

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => setTags((prev) => prev.filter((tag) => tag !== tagToRemove));

  const handleSubmit = () => {
    const images = uploadedMedia.filter((m) => m.type === 'image').map((m) => m.url);
    const videos = uploadedMedia.filter((m) => m.type === 'video').map((m) => m.url);

    const postData = {
      id: Date.now().toString(),
      author: { name: 'John Doe', avatar: 'JD' },
      content: postContent,
      images: images.length > 0 ? images : undefined,
      videos: videos.length > 0 ? videos : undefined,
      tags: tags.length > 0 ? tags : undefined,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: 'Just now',
      isLiked: false,
    };

    onSubmit?.(postData);
  };

  const canSubmit = postContent.trim() || uploadedMedia.length > 0;

  return (
    <ScreenWrapper>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <ArrowLeft size={wp(5)} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Post</Text>
          </View>
        </View>

        {/* Content */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: hp(12) }} // Space for fixed button
          >
            <View style={styles.content}>
              {/* Post Content */}
              <View style={styles.section}>
                <TextInput
                  style={styles.textArea}
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChangeText={setPostContent}
                  multiline
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Media Upload Buttons */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add to your post</Text>
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
              </View>

              {/* Uploaded Media Preview */}
              {uploadedMedia.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Media ({uploadedMedia.length})</Text>
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
                        <View style={styles.mediaTypeBadge}>
                          <Text style={styles.mediaTypeText}>
                            {media.type === 'image' ? 'Image' : 'Video'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Tags Section */}
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
                    placeholder="Type a tag and press Enter (max 10 tags)"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={handleAddTag}
                    placeholderTextColor="#9CA3AF"
                  />
                )}
                <Text style={styles.tagCount}>{tags.length}/10 tags</Text>
              </View>

              {/* Post Tips */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Post Tips</Text>
                <View style={styles.tipsList}>
                  <Text style={styles.tip}>• Keep your posts respectful and relevant</Text>
                  <Text style={styles.tip}>• Use tags to help others find your content</Text>
                  <Text style={styles.tip}>• Add photos or videos to make posts more engaging</Text>
                  <Text style={styles.tip}>• Avoid posting personal information</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Fixed Post Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.postButton, !canSubmit && styles.postButtonDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: wp(3) 
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
    color: '#111827' 
  },
  scrollView: { 
    flex: 1 
  },
  content: { 
    padding: wp(4), 
    gap: hp(2) 
  },
  section: {
    backgroundColor: 'white',
    borderRadius: wp(4),
    padding: wp(4),
    elevation: 1,
  },
  textArea: { 
    minHeight: hp(15), 
    fontSize: wp(3.5), 
    color: '#111827', 
    textAlignVertical: 'top' 
  },
  sectionTitle: { 
    fontSize: wp(4), 
    fontWeight: '600', 
    color: '#111827', 
    marginBottom: hp(1.5) 
  },
  mediaButtons: { 
    flexDirection: 'row', 
    gap: wp(3) 
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3F51B5',
    borderRadius: wp(4),
    paddingVertical: hp(1.2),
    gap: wp(2),
  },
  mediaButtonText: { 
    color: '#3F51B5', 
    fontSize: wp(3.5), 
    fontWeight: '500' 
  },
  mediaGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: wp(3) 
  },
  mediaItem: {
    width: (wp(100) - wp(4) * 2 - wp(4) * 2 - wp(3)) / 2,
    aspectRatio: 1,
    borderRadius: wp(4),
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  mediaImage: { 
    width: '100%', 
    height: '100%' 
  },
  videoContainer: { 
    width: '100%', 
    height: '100%', 
    backgroundColor: '#E5E7EB', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  videoPlaceholder: { 
    color: '#6B7280', 
    fontSize: wp(3.5) 
  },
  removeMediaButton: { 
    position: 'absolute', 
    top: wp(2), 
    right: wp(2), 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: wp(2), 
    padding: wp(1) 
  },
  mediaTypeBadge: { 
    position: 'absolute', 
    bottom: wp(2), 
    left: wp(2), 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    borderRadius: wp(2), 
    paddingHorizontal: wp(2), 
    paddingVertical: hp(0.5) 
  },
  mediaTypeText: { 
    color: 'white', 
    fontSize: wp(2.5) 
  },
  tagsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: wp(2), 
    marginBottom: hp(1.5) 
  },
  tag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: wp(1.5), 
    backgroundColor: '#E8EAF6', 
    borderRadius: wp(50), 
    paddingHorizontal: wp(3), 
    paddingVertical: hp(0.8) 
  },
  tagText: { 
    color: '#3F51B5', 
    fontSize: wp(3) 
  },
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
  tagCount: { 
    fontSize: wp(2.5), 
    color: '#6B7280' 
  },
  tipsList: { 
    gap: hp(0.5) 
  },
  tip: { 
    fontSize: wp(3.5), 
    color: '#6B7280', 
    lineHeight: hp(2.2) 
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: wp(4),
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  postButton: { 
    backgroundColor: '#3F51B5', 
    borderRadius: wp(4), 
    paddingVertical: hp(1.5), 
    alignItems: 'center' 
  },
  postButtonDisabled: { 
    backgroundColor: '#9CA3AF' 
  },
  postButtonText: { 
    color: 'white', 
    fontSize: wp(4), 
    fontWeight: '600' 
  },
});