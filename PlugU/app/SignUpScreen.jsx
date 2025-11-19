import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Mail, Lock, User, ShoppingBag, Eye, EyeOff } from 'lucide-react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { hp, wp } from '../utilities/dimensions';
import { router } from 'expo-router';

const SignUpScreen = ({ onSignUp }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const waveAnim1 = useState(new Animated.Value(0))[0];
  const waveAnim2 = useState(new Animated.Value(0))[0];
  const waveAnim3 = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const bounceAnim = useState(new Animated.Value(0))[0];

  const onTermsClick = () => {
    router.push('/TermsOfServiceScreen');
  };

  const onPrivacyClick = () => {  
    router.push('/PrivacyPolicyScreen');
  };

  const onLoginClick = () => {
    router.replace("/LoginScreen");
  };

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

  const handleSubmit = () => {
    if (!agreeToTerms) {
      Alert.alert('Error', 'Please accept the Terms and Conditions');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    onSignUp();
  };

  const wave1TranslateY = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const wave2TranslateY = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const wave3TranslateY = waveAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  });

  const fadeTranslateY = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const bounceScale = bounceAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.1, 1],
  });

  return (
    <ScreenWrapper bg="#f8fafc">
                {/* Animated Wave Background */}
        <View style={styles.waveContainer}>
          <Animated.View
            style={[
              styles.wave,
              {
                transform: [{ translateY: wave1TranslateY }],
                opacity: 0.3,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              {
                transform: [{ translateY: wave2TranslateY }],
                opacity: 0.5,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              {
                transform: [{ translateY: wave3TranslateY }],
                opacity: 1,
              },
            ]}
          />
        </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >


        {/* Sign Up Form */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: fadeTranslateY }],
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Animated.View
                style={[
                  styles.logo,
                  {
                    transform: [{ scale: bounceScale }],
                  },
                ]}
              >
                <ShoppingBag size={wp(10)} color="#3F51B5" />
              </Animated.View>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join our marketplace community</Text>
            </View>

            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={wp(4.5)} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                    required
                  />
                </View>
              </View>

              {/* Email Input */}
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
                    required
                  />
                </View>
              </View>

              {/* Password Input */}
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
                    returnKeyType="next"
                    required
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={wp(4.5)} color="#9ca3af" />
                    ) : (
                      <Eye size={wp(4.5)} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={wp(4.5)} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    required
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={wp(4.5)} color="#9ca3af" />
                    ) : (
                      <Eye size={wp(4.5)} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    agreeToTerms && styles.checkboxChecked,
                  ]}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                >
                  {agreeToTerms && <View style={styles.checkboxInner} />}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.link} onPress={onTermsClick}>
                    Terms and Conditions
                  </Text>{' '}
                  and{' '}
                  <Text style={styles.link} onPress={onPrivacyClick}>
                    Privacy Policy
                  </Text>
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !agreeToTerms && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!agreeToTerms}
              >
                <Text style={styles.submitButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.footerLink} onPress={onLoginClick}>
                  Sign In
                </Text>
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
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(50), // Reduced from 60% to 50%
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#3F51B5',
    borderTopLeftRadius: wp(40), // Reduced curvature
    borderTopRightRadius: wp(40), // Reduced curvature
  },
  formContainer: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(4), // Reduced padding
    paddingVertical: hp(1), // Reduced padding
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: hp(2), // Reduced margin
  },
  logo: {
    backgroundColor: 'white',
    padding: wp(3), // Reduced padding
    borderRadius: wp(3), // Reduced border radius
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8, // Reduced shadow
    },
    shadowOpacity: 0.2, // Reduced opacity
    shadowRadius: 15, // Reduced radius
    elevation: 8, // Reduced elevation
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(2), // Reduced margin
  },
  title: {
    fontSize: wp(5.5), // Slightly smaller
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: hp(0.3), // Reduced margin
  },
  subtitle: {
    fontSize: wp(3.8), // Slightly smaller
    color: '#6b7280',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: wp(6), // Reduced border radius
    padding: wp(5), // Reduced padding
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15, // Reduced shadow
    },
    shadowOpacity: 0.2, // Reduced opacity
    shadowRadius: 25, // Reduced radius
    elevation: 12, // Reduced elevation
    marginBottom: hp(1.5), // Reduced margin
  },
  inputContainer: {
    marginBottom: hp(1.5), // Reduced margin
  },
  label: {
    fontSize: wp(3.8), // Slightly smaller
    color: '#374151',
    marginBottom: hp(0.8), // Reduced margin
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: wp(2.5), // Reduced padding
    zIndex: 10,
  },
  input: {
    flex: 1,
    height: hp(5.5), // Reduced height
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: wp(2.5), // Reduced border radius
    paddingLeft: wp(9), // Reduced padding
    paddingRight: wp(2.5), // Reduced padding
    fontSize: wp(3.8), // Slightly smaller
    backgroundColor: '#f9fafb',
    color: '#1f2937',
  },
  passwordInput: {
    paddingRight: wp(9), // Reduced padding
  },
  eyeButton: {
    position: 'absolute',
    right: wp(2.5), // Reduced padding
    padding: wp(0.8), // Reduced padding
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: hp(0.8), // Reduced margin
    marginBottom: hp(2.5), // Reduced margin
  },
  checkbox: {
    width: wp(4.5), // Smaller checkbox
    height: wp(4.5), // Smaller checkbox
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: wp(1),
    marginRight: wp(2.5), // Reduced margin
    marginTop: wp(0.3), // Reduced margin
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#3F51B5',
    backgroundColor: '#3F51B5',
  },
  checkboxInner: {
    width: wp(2.2), // Smaller inner
    height: wp(2.2), // Smaller inner
    backgroundColor: 'white',
    borderRadius: wp(0.4), // Reduced radius
  },
  termsText: {
    flex: 1,
    fontSize: wp(3.3), // Slightly smaller
    color: '#6b7280',
    lineHeight: wp(4.2), // Adjusted line height
  },
  link: {
    color: '#3F51B5',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3F51B5',
    borderRadius: wp(2.5), // Reduced border radius
    paddingVertical: hp(1.8), // Reduced padding
    alignItems: 'center',
    shadowColor: '#3F51B5',
    shadowOffset: {
      width: 0,
      height: 8, // Reduced shadow
    },
    shadowOpacity: 0.25, // Reduced opacity
    shadowRadius: 15, // Reduced radius
    elevation: 6, // Reduced elevation
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: wp(4.2), // Slightly smaller
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: wp(3.8), // Slightly smaller
    color: '#374151',
  },
  footerLink: {
    color: '#3F51B5',
    fontWeight: '500',
  },
});

export default SignUpScreen;