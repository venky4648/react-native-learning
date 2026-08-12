import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; general?: string }>({});

  const handleNext = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Email verification failed.');
      }

      setEmailVerified(true);
    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed.');
      }

      Alert.alert('Success', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
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
                Reset Password
              </ThemedText>
              <ThemedText
                type="small"
                style={[styles.subtitle, { color: theme.textSecondary }]}
              >
                {emailVerified 
                  ? 'Enter your new password below to reset' 
                  : 'Enter your registered email address to continue'}
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
                editable={!emailVerified} // Disable email input after verification
              />

              {emailVerified && (
                <>
                  <ThemedInput
                    label="New Password"
                    placeholder="Enter new password"
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
                    label="Confirm New Password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    secureTextEntry={!showPassword}
                    error={errors.confirmPassword}
                  />
                </>
              )}

              {errors.general ? (
                <ThemedText type="small" style={styles.errorText}>
                  {errors.general}
                </ThemedText>
              ) : null}

              <ThemedButton
                title={emailVerified ? 'Submit' : 'Next'}
                loading={loading}
                onPress={emailVerified ? handleSubmit : handleNext}
                style={styles.submitButton}
              />
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
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  submitButton: {
    marginTop: Spacing.one,
  },
});
