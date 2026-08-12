import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { MicrosoftButton } from '@/components/microsoft-button';
import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { signInWithMicrosoft } from '@/services/msal-service';

export default function SignupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { signup, loginWithMicrosoft } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Full Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      await signup(name, email, password);
      setLoading(false);
      router.replace('/');
    } catch (err: any) {
      setLoading(false);
      setErrors((prev) => ({
        ...prev,
        general: err.message || 'Registration failed. Please try again.',
      }));
    }
  };

  const handleMicrosoftSignup = async () => {
    setMsLoading(true);
    setErrors({});
    try {
      const msProfile = await signInWithMicrosoft();
      await loginWithMicrosoft(msProfile);
      setMsLoading(false);
      router.replace('/');
    } catch (err: any) {
      setMsLoading(false);
      setErrors((prev) => ({
        ...prev,
        general: err.message || 'Microsoft Sign-In failed. Please try again.',
      }));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ThemedText type="smallBold" style={{ color: '#007AFF' }}>
                  ← Back
                </ThemedText>
              </TouchableOpacity>
              <ThemedText type="subtitle" style={styles.title}>
                Create Account
              </ThemedText>
              <ThemedText
                type="small"
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                Fill in your details to get started
              </ThemedText>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <ThemedInput
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                autoCapitalize="words"
                error={errors.name}
              />

              <ThemedInput
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email}
              />

              <ThemedInput
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                secureTextEntry={!showPassword}
                error={errors.password}
                rightIcon={
                  <ThemedText type="small" style={{ color: '#007AFF' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </ThemedText>
                }
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              <ThemedInput
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                secureTextEntry={!showPassword}
                error={errors.confirmPassword}
              />

              {errors.general ? (
                <ThemedText type="small" style={styles.errorText}>
                  {errors.general}
                </ThemedText>
              ) : null}

              <ThemedButton
                title="Sign Up"
                loading={loading}
                onPress={handleSignup}
                style={styles.signupButton}
              />

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: theme.backgroundSelected }]} />
                <ThemedText type="small" style={[styles.dividerText, { color: theme.textSecondary }]}>
                  OR
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: theme.backgroundSelected }]} />
              </View>

              {/* Microsoft Button */}
              <MicrosoftButton
                title="Sign up with Microsoft"
                loading={msLoading}
                onPress={handleMicrosoftSignup}
              />
            </View>

            {/* Footer / Switch to Login */}
            <View style={styles.footer}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/login')}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary }}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                >
                  Already have an account?{' '}
                  <ThemedText type="smallBold" style={{ color: '#007AFF' }}>
                    Log In
                  </ThemedText>
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: Spacing.three,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  signupButton: {
    marginTop: Spacing.one,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.two,
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.five,
  },
});
