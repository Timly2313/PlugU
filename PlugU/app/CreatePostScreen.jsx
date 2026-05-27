import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper      from '../components/ScreenWrapper';
import { useAuth }        from '../context/authContext';
import { useCreatePost }  from '../hooks/useCreatePost';
import AuthorRow          from '../components/AuthorRow';
import MediaPickerBar     from '../components/MediaPickerBar';
import MediaPreviewGrid   from '../components/MediaPreviewGrid';
import TagsInput          from '../components/TagsInput';

const PRIMARY = '#3F51B5';
const TIPS = [
  'Keep posts respectful and relevant to the community.',
  'Use tags to help others discover your content.',
  'Photos and videos make posts more engaging.',
  'Avoid sharing personal or sensitive information.',
];

export default function CreatePostScreen() {
  const { user, profile } = useAuth();

  const {
    content, setContent,
    media,
    tags, tagInput, setTagInput,
    submitting, uploadProgress,
    canSubmit,
    addMedia, removeMedia,
    addTag, removeTag,
    submit,
  } = useCreatePost(user);

  return (
    <ScreenWrapper bg="#F9FAFB">
      <StatusBar style="dark" />
      <View style={s.container}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} disabled={submitting}>
            <ArrowLeft size={wp(5)} color="#374151" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Create Post</Text>
          <Text style={[s.charCount, content.length > 900 && { color: '#EF4444' }]}>
            {content.length}/1000
          </Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <AuthorRow profile={profile} />

            {/* Text input */}
            <View style={s.card}>
              <TextInput
                style={s.textArea}
                placeholder="What's on your mind?"
                placeholderTextColor="#9CA3AF"
                value={content}
                onChangeText={(t) => t.length <= 1000 && setContent(t)}
                multiline
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            <MediaPickerBar onAdd={addMedia} disabled={submitting} />

            <MediaPreviewGrid media={media} onRemove={removeMedia} disabled={submitting} />

            <TagsInput
              tags={tags}
              tagInput={tagInput}
              onChangeInput={setTagInput}
              onAdd={addTag}
              onRemove={removeTag}
              disabled={submitting}
            />

            {/* Tips */}
            <View style={s.tipsCard}>
              <Text style={s.cardLabel}>Tips</Text>
              {TIPS.map((tip, i) => (
                <Text key={i} style={s.tip}>· {tip}</Text>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={s.footer}>
          {submitting && uploadProgress ? (
            <Text style={s.progress}>{uploadProgress}</Text>
          ) : null}
          <TouchableOpacity
            style={[s.postBtn, !canSubmit && s.postBtnDisabled]}
            onPress={submit}
            disabled={!canSubmit}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.postBtnText}>Post to Community</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },
  header:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: wp(4), paddingVertical: hp(1.5), borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: wp(3) },
  backBtn:      { width: wp(9), height: wp(9), borderRadius: wp(4.5), backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { flex: 1, fontSize: wp(5), fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  charCount:    { fontSize: wp(3), color: '#9CA3AF', fontWeight: '500' },
  scroll:       { padding: wp(4), gap: hp(1.5), paddingBottom: hp(14) },
  card:         { backgroundColor: '#fff', borderRadius: wp(4), padding: wp(4), elevation: 1 },
  textArea:     { minHeight: hp(14), fontSize: wp(3.8), color: '#111827', textAlignVertical: 'top', lineHeight: hp(2.5) },
  cardLabel:    { fontSize: wp(3.8), fontWeight: '700', color: '#374151', marginBottom: hp(1.2) },
  tipsCard:     { backgroundColor: '#F0F4FF', borderRadius: wp(4), padding: wp(4), elevation: 1 },
  tip:          { fontSize: wp(3.3), color: '#6B7280', lineHeight: hp(2.3), marginBottom: hp(0.3) },
  footer:       { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: wp(4), paddingTop: hp(1), paddingBottom: hp(3), backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: hp(0.8) },
  progress:     { fontSize: wp(3), color: '#6B7280', textAlign: 'center', fontWeight: '500' },
  postBtn:      { backgroundColor: PRIMARY, borderRadius: wp(3.5), paddingVertical: hp(1.7), alignItems: 'center' },
  postBtnDisabled: { backgroundColor: '#C7D2FE' },
  postBtnText:  { color: '#fff', fontSize: wp(4), fontWeight: '700' },
});