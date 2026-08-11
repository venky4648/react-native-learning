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

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { login, loginWithMicrosoft } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      await login(email, password);
      setLoading(false);
      router.replace('/');
    } catch (err: any) {
      setLoading(false);
      setErrors((prev) => ({
        ...prev,
        general: err.message || 'Login failed. Please check your credentials.',
      }));
    }
  };

  const handleMicrosoftLogin = async () => {
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
                onPress={() => router.replace('/')}
                style={styles.backButton}
              >
                <ThemedText type="smallBold" style={{ color: '#007AFF' }}>
                  ← Back
                </ThemedText>
              </TouchableOpacity>
              <ThemedText type="subtitle" style={styles.title}>
                Welcome Back 👋
              </ThemedText>
              <ThemedText
                type="small"
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                Sign in to your account to continue
              </ThemedText>
            </View>

            {/* Form */}
            <View style={styles.form}>
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
                placeholder="Enter your password"
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

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.forgotPassword}
                onPress={() => {}}
              >
                <ThemedText type="smallBold" style={{ color: '#007AFF' }}>
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>

              {errors.general ? (
                <ThemedText type="small" style={styles.errorText}>
                  {errors.general}
                </ThemedText>
              ) : null}

              <ThemedButton
                title="Log In"
                loading={loading}
                onPress={handleLogin}
                style={styles.loginButton}
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
                loading={msLoading}
                onPress={handleMicrosoftLogin}
              />
            </View>

            {/* Footer / Switch to Signup */}
            <View style={styles.footer}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Don't have an account?{' '}
              </ThemedText>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/signup')}
              >
                <ThemedText type="smallBold" style={{ color: '#007AFF' }}>
                  Sign Up
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
    marginBottom: Spacing.five,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.one,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  loginButton: {
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
