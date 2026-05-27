import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { createPostService } from '../services/createPostService';

export function useCreatePost(user) {
  const [content,        setContent]        = useState('');
  const [media,          setMedia]          = useState([]);
  const [tags,           setTags]           = useState([]);
  const [tagInput,       setTagInput]       = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const addMedia = useCallback((type, assets) => {
    const picked = assets.map((asset) => ({
      id:       `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      localUri: asset.uri,
      asset,
    }));
    setMedia((prev) => [...prev, ...picked]);
  }, []);

  const removeMedia = useCallback((id) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addTag = useCallback(() => {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags((prev) => [...prev, t]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((t) => {
    setTags((prev) => prev.filter((x) => x !== t));
  }, []);

  const submit = useCallback(async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }
    if (!content.trim() && media.length === 0) {
      Alert.alert('Empty post', 'Add some text or media before posting.');
      return;
    }

    setSubmitting(true);
    try {
      const mediaUrls = await createPostService.uploadMedia(
        media, user.id, setUploadProgress
      );

      setUploadProgress('Publishing post…');
      await createPostService.createPost({
        userId:    user.id,
        content:   content.trim(),
        mediaUrls,
        tags,
      });

      router.back();
    } catch (err) {
      console.error('[useCreatePost] submit error:', err);
      Alert.alert('Error', err.message || 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  }, [user, content, media, tags]);

  const canSubmit = (content.trim().length > 0 || media.length > 0) && !submitting;

  return {
    content, setContent,
    media,
    tags, tagInput, setTagInput,
    submitting, uploadProgress,
    canSubmit,
    addMedia, removeMedia,
    addTag, removeTag,
    submit,
  };
}