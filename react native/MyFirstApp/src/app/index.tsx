import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Hero */}
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            {user ? `Welcome, ${user.name}! 👋` : 'Welcome to MyApp'}
          </ThemedText>
        </ThemedView>

        {/* Logged In View */}
        {user ? (
          <View
            style={[
              styles.profileCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
            ]}
          >
            <ThemedText type="subtitle" style={styles.profileTitle}>
              Logged In User Profile
            </ThemedText>

            <View style={styles.infoRow}>
              <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                FULL NAME
              </ThemedText>
              <ThemedText type="default" style={styles.infoText}>
                {user.name}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText type="smallBold" style={{ color: theme.textSecondary }}>
                EMAIL ADDRESS
              </ThemedText>
              <ThemedText type="default" style={styles.infoText}>
                {user.email}
              </ThemedText>
            </View>

            <ThemedButton
              title="Log Out"
              variant="outline"
              onPress={logout}
              style={styles.logoutButton}
            />
          </View>
        ) : (
          /* Logged Out View */
          <View style={styles.authButtons}>
            <ThemedButton
              title="Log In"
              variant="primary"
              onPress={() => router.push('/login')}
            />
            <ThemedButton
              title="Sign Up"
              variant="outline"
              onPress={() => router.push('/signup')}
            />
          </View>
        )}
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
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
  },
  authButtons: {
    width: '100%',
    gap: Spacing.two,
  },
  profileCard: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.three,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  infoRow: {
    gap: 4,
  },
  infoText: {
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: Spacing.two,
  },
});