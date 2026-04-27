import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Mail, Lock, ShoppingBag, Eye, EyeOff } from 'lucide-react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { hp, wp } from '../utilities/dimensions';
import { router } from 'expo-router';
import { useAuth } from "../context/authContext";

const LoginScreen = () => {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const waveAnim1 = useState(new Animated.Value(5))[0];
  const waveAnim2 = useState(new Animated.Value(0))[0];
  const waveAnim3 = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const bounceAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    startWaveAnimations();
    startEntranceAnimations();
  }, []);

  const startWaveAnimations = () => {
    const createWaveAnimation = (animValue, duration) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createWaveAnimation(waveAnim1, 10000).start();
    createWaveAnimation(waveAnim2, 15000).start();
    createWaveAnimation(waveAnim3, 20000).start();
  };

  const startEntranceAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const wave1TranslateY = waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const wave2TranslateY = waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const wave3TranslateY = waveAnim3.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const fadeTranslateY = fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  const bounceScale = bounceAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.1, 1] });

  const onSignUpClick = () => router.replace('/SignUpScreen');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    try {
      await signIn({ email: email.trim().toLowerCase(), password });
      // No manual navigation here — _layout.js handles routing
      // once isAuthenticated + profile are resolved
    } catch (error) {
      Alert.alert('Login failed', error.message);
    }
  };

  return (
    <ScreenWrapper bg="#f8fafc">
      {/* Animated Wave Background */}
      <View style={styles.waveContainer}>
        <Animated.View style={[styles.wave, styles.wave1, { transform: [{ translateY: wave1TranslateY }] }]} />
        <Animated.View style={[styles.wave, styles.wave2, { transform: [{ translateY: wave2TranslateY }] }]} />
        <Animated.View style={[styles.wave, styles.wave3, { transform: [{ translateY: wave3TranslateY }] }]} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View
          style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: fadeTranslateY }] }]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Animated.View style={[styles.logo, { transform: [{ scale: bounceScale }] }]}>
                <ShoppingBag size={wp(10)} color="#3F51B5" />
              </Animated.View>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.form}>
              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={wp(4.5)} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={wp(4.5)} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword
                      ? <EyeOff size={wp(4.5)} color="#9ca3af" />
                      : <Eye size={wp(4.5)} color="#9ca3af" />
                    }
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
                <Text style={styles.footerLink} onPress={onSignUpClick}>Sign Up</Text>
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  waveContainer: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: hp(50),
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#3F51B5',
  },
  wave1: {
    opacity: 0.3,
    borderTopLeftRadius: wp(35),
    borderTopRightRadius: wp(35),
    transform: [{ scaleX: 1.2 }],
  },
  wave2: {
    opacity: 0.5,
    borderTopLeftRadius: wp(40),
    borderTopRightRadius: wp(40),
    transform: [{ scaleX: 1.1 }],
  },
  wave3: {
    opacity: 1,
    borderTopLeftRadius: wp(45),
    borderTopRightRadius: wp(45),
    transform: [{ scaleX: 1.0 }],
  },
  formContainer: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  logo: {
    backgroundColor: 'white',
    padding: wp(3),
    borderRadius: wp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(5.5),
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: hp(0.3),
  },
  subtitle: {
    fontSize: wp(3.8),
    color: '#6b7280',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: wp(6),
    padding: wp(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 12,
    marginBottom: hp(1.5),
  },
  inputContainer: {
    marginBottom: hp(1.5),
  },
  label: {
    fontSize: wp(3.8),
    color: '#374151',
    marginBottom: hp(0.8),
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: wp(2.5),
    zIndex: 10,
  },
  input: {
    flex: 1,
    height: hp(5.5),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: wp(2.5),
    paddingLeft: wp(9),
    paddingRight: wp(2.5),
    fontSize: wp(3.8),
    backgroundColor: '#f9fafb',
    color: '#1f2937',
  },
  passwordInput: {
    paddingRight: wp(9),
  },
  eyeButton: {
    position: 'absolute',
    right: wp(2.5),
    padding: wp(0.8),
  },
  submitButton: {
    backgroundColor: '#3F51B5',
    borderRadius: wp(2.5),
    paddingVertical: hp(1.8),
    alignItems: 'center',
    marginTop: hp(2),
    shadowColor: '#3F51B5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: wp(4.2),
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: wp(3.8),
    color: '#cfcfcf',
  },
  footerLink: {
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default LoginScreen;