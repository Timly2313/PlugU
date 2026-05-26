import { supabase } from '../lib/supabase';
import { uploadMediaToSupabase } from '../services/imageService';

export const onboardingService = {

  uploadAvatar: async (userId, imageUri) => {
    if (!imageUri) return null;
    return uploadMediaToSupabase(imageUri, userId, 'avatars', 'image');
  },

  saveProfile: async (userId, formData, avatarUrl) => {
    const trimmedData = {
      display_name:         formData.fullName.trim()            || null,
      username:             formData.username.trim()            || null,
      personal_email:       formData.email.trim().toLowerCase() || null,
      phone:                formData.phone.trim()               || null,
      date_of_birth:        formData.dateOfBirth.trim()         || null,
      location:             formData.location.trim()            || null,
      bio:                  formData.bio.trim()                 || null,
      occupation:           formData.occupation.trim()          || null,
      onboarding_completed: true,
      updated_at:           new Date().toISOString(),
    };

    // Only include avatar if we uploaded one
    if (avatarUrl) trimmedData.avatar_url = avatarUrl;

    // Strip nulls so we don't overwrite existing DB values with null
    Object.keys(trimmedData).forEach((key) => {
      if (trimmedData[key] === null || trimmedData[key] === '') {
        delete trimmedData[key];
      }
    });

    // onboarding_completed must always be set
    trimmedData.onboarding_completed = true;

    const { data, error } = await supabase
      .from('profiles')
      .update(trimmedData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};