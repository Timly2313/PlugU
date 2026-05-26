import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { onboardingService } from '../services/onboardingService';

const TOTAL_STEPS = 3;

const INITIAL_FORM = {
  fullName:    '',
  username:    '',
  email:       '',
  phone:       '',
  dateOfBirth: '',
  location:    '',
  bio:         '',
  occupation:  '',
};

export function useOnboarding(user, refreshProfile, onComplete, onSkip) {
  const [step,          setStep]          = useState(1);
  const [formData,      setFormData]      = useState(INITIAL_FORM);
  const [profileImage,  setProfileImage]  = useState(null);
  const [isUploading,   setIsUploading]   = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const isStepValid = useCallback(() => {
    if (step === 1) return formData.fullName.trim() !== '' && formData.username.trim() !== '';
    if (step === 2) return formData.email.trim() !== '' && formData.phone.trim() !== '';
    return true;
  }, [step, formData]);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const save = useCallback(async (isComplete = false) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to complete onboarding.');
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl = null;
      if (profileImage) {
        setIsUploading(true);
        try {
          avatarUrl = await onboardingService.uploadAvatar(user.id, profileImage);
        } finally {
          setIsUploading(false);
        }
      }

      await onboardingService.saveProfile(user.id, formData, avatarUrl);
      await refreshProfile();

      if (isComplete) {
        onComplete?.();
      } else {
        onSkip?.();
      }
    } catch (err) {
      console.error('[useOnboarding] save error:', err);
      Alert.alert('Error', err.message || 'Could not save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [user, profileImage, formData, refreshProfile, onComplete, onSkip]);

  const handleNext = useCallback(async () => {
    if (step < TOTAL_STEPS) {
      goNext();
    } else {
      await save(true);
    }
  }, [step, goNext, save]);

  const handleSkip = useCallback(() => save(false), [save]);

  return {
    step,
    formData,
    profileImage,
    setProfileImage,
    isUploading,
    setIsUploading,
    isSaving,
    handleChange,
    handleNext,
    handleBack: goBack,
    handleSkip,
    isStepValid,
    TOTAL_STEPS,
  };
}