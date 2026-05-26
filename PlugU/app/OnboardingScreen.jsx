import React from 'react';
import {
  View, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/authContext';
import { useOnboarding } from '../hooks/useOnboarding';
import ProgressHeader    from '../components/ProgressHeader';
import StepOne           from '../components/StepOne';
import StepTwo           from '../components/StepTwo';
import StepThree         from '../components/StepThree';
import OnboardingActions from '../components/OnboardingActions';

export default function OnboardingScreen({ onComplete, onSkip }) {
  const { user, refreshProfile } = useAuth();

  const {
    step,
    formData,
    profileImage,
    setProfileImage,
    isUploading,
    isSaving,
    handleChange,
    handleNext,
    handleBack,
    handleSkip,
    isStepValid,
    TOTAL_STEPS,
  } = useOnboarding(user, refreshProfile, onComplete, onSkip);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepOne
            formData={formData}
            onChange={handleChange}
            profileImage={profileImage}
            isUploading={isUploading}
            onImageSelected={setProfileImage}
          />
        );
      case 2:
        return <StepTwo formData={formData} onChange={handleChange} />;
      case 3:
        return (
          <StepThree
            formData={formData}
            onChange={handleChange}
            profileImage={profileImage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={['#3F51B5', '#5C6BC0']} style={s.gradient}>
      {/* Decorative circles — pointerEvents none so they never intercept touches */}
      <View style={s.deco1} pointerEvents="none" />
      <View style={s.deco2} pointerEvents="none" />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ProgressHeader step={step} totalSteps={TOTAL_STEPS} />

          {/* White card */}
          <View style={s.card}>
            {renderStep()}
            <OnboardingActions
              step={step}
              totalSteps={TOTAL_STEPS}
              isSaving={isSaving}
              isStepValid={isStepValid()}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={onSkip ? handleSkip : null}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  flex:     { flex: 1 },
  scroll:   { flexGrow: 1 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginTop: 8,
  },
  // Moved outside ScrollView and given pointerEvents="none" directly on the View
  deco1: {
    position: 'absolute', top: 40, left: 40,
    width: 128, height: 128, borderRadius: 64,
    backgroundColor: 'rgba(255,255,255,0.1)',
    opacity: 0.5,
    zIndex: -1, // behind everything
  },
  deco2: {
    position: 'absolute', bottom: 80, right: 40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    opacity: 0.5,
    zIndex: -1, 
  },
});

