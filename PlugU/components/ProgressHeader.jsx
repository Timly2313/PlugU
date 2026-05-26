import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default function ProgressHeader({ step, totalSteps }) {
  const titles = {
    1: 'Tell us about yourself',
    2: 'Contact Information',
    3: 'Complete Your Profile',
  };
  const subtitles = {
    1: "Let's start with the basics",
    2: 'How can others reach you?',
    3: 'Add some details about yourself',
  };

  return (
    <View style={s.header}>
      <View style={s.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[s.bar, i < step ? s.barActive : s.barInactive]}
          />
        ))}
      </View>
      <View style={s.textWrap}>
        <Text style={s.stepLabel}>Step {step} of {totalSteps}</Text>
        <Text style={s.title}>{titles[step]}</Text>
        <Text style={s.subtitle}>{subtitles[step]}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  bar:         { flex: 1, height: 4, borderRadius: 2 },
  barActive:   { backgroundColor: '#fff' },
  barInactive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  textWrap:    { gap: 8 },
  stepLabel:   { fontSize: 12, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 },
  title:       { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle:    { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
});