import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { hp, wp } from '../utilities/dimensions';
import ScreenWrapper          from '../components/ScreenWrapper';
import { useAuth }            from '../context/authContext';
import { useCreateListing }   from '../hooks/useCreateListing';
import ImagePickerSection     from '../components/ImagePickerSection';
import ListingFields          from '../components/ListingFields';
import LocationSection        from '../components/LocationSection';
import TagsInput              from '../components/TagsInput';

export default function CreateListingScreen() {
  const { user, profile } = useAuth();

  const {
    title, setTitle,
    price, setPrice,
    category, setCategory,
    condition, setCondition,
    description, setDescription,
    media, addMedia, removeMedia,
    tags, tagInput, setTagInput, addTag, removeTag,
    location, setLocation, clearLocation,
    isLocating, detectLocation,
    isSubmitting, canSubmit,
    submit,
  } = useCreateListing(user, profile);

  return (
    <ScreenWrapper>
      <StatusBar style="auto" />
      <View style={s.container}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={wp(5)} color="#374151" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Create Listing</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <ImagePickerSection
              media={media}
              onAdd={addMedia}
              onRemove={removeMedia}
            />

            <ListingFields
              title={title}             setTitle={setTitle}
              price={price}             setPrice={setPrice}
              category={category}       setCategory={setCategory}
              condition={condition}     setCondition={setCondition}
              description={description} setDescription={setDescription}
            />

            <LocationSection
              location={location}
              onChangeText={(text) => { setLocation(text); }}
              onDetect={detectLocation}
              onClear={clearLocation}
              isLocating={isLocating}
            />

            <TagsInput
              tags={tags}
              tagInput={tagInput}
              onChangeInput={setTagInput}
              onAdd={addTag}
              onRemove={removeTag}
              disabled={isSubmitting}
            />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.submitBtn, !canSubmit && s.submitDisabled]}
            disabled={!canSubmit}
            onPress={submit}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitText}>Create Listing</Text>}
          </TouchableOpacity>
        </View>

      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F9FAFB' },
  header:        { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: wp(4), paddingVertical: hp(1.5), flexDirection: 'row', alignItems: 'center' },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
  backBtn:       { width: wp(9), height: wp(9), borderRadius: wp(4.5), backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: wp(5), fontWeight: 'bold', color: '#111827' },
  scroll:        { padding: wp(4), gap: hp(2), paddingBottom: hp(12) },
  footer:        { position: 'absolute', bottom: 0, width: '100%', padding: wp(4), backgroundColor: '#F9FAFB' },
  submitBtn:     { backgroundColor: '#3F51B5', paddingVertical: hp(1.5), borderRadius: wp(4), alignItems: 'center' },
  submitDisabled:{ backgroundColor: '#9CA3AF' },
  submitText:    { color: '#fff', fontSize: wp(4), fontWeight: '600' },
});