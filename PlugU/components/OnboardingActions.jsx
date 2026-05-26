import React from 'react';
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';

export default function OnboardingActions({
  step,
  totalSteps,
  isSaving,
  isStepValid,
  onNext,
  onBack,
  onSkip,
}) {
  const isLast = step === totalSteps;

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        style={[s.primary, (!isStepValid || isSaving) && s.primaryDisabled]}
        onPress={onNext}
        disabled={!isStepValid || isSaving}
        activeOpacity={0.85}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={s.primaryText}>{isLast ? 'Complete Profile' : 'Continue'}</Text>
            <ArrowRight size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      <View style={s.secondary}>
        {step > 1 && (
          <TouchableOpacity style={s.outline} onPress={onBack} disabled={isSaving}>
            <Text style={s.outlineText}>Back</Text>
          </TouchableOpacity>
        )}
        {onSkip && (
          <TouchableOpacity style={s.ghost} onPress={onSkip} disabled={isSaving}>
            <Text style={s.ghostText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:            { marginTop: 32, gap: 16 },
  primary:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3F51B5', borderRadius: 12, height: 48, gap: 8, elevation: 2 },
  primaryDisabled: { opacity: 0.5 },
  primaryText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondary:       { flexDirection: 'row', gap: 12 },
  outline:         { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, height: 48, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  outlineText:     { color: '#374151', fontSize: 14, fontWeight: '500' },
  ghost:           { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, height: 48 },
  ghostText:       { color: '#6B7280', fontSize: 14, fontWeight: '500' },
});