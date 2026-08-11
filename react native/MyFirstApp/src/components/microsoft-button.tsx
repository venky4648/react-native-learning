import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type MicrosoftButtonProps = TouchableOpacityProps & {
  title?: string;
  loading?: boolean;
};

/**
 * Microsoft 4-Square Logo SVG replacement using native View blocks
 */
function MicrosoftLogo() {
  return (
    <View style={styles.logoGrid}>
      <View style={styles.logoRow}>
        <View style={[styles.square, { backgroundColor: '#F25022' }]} />
        <View style={[styles.square, { backgroundColor: '#7FBA00' }]} />
      </View>
      <View style={styles.logoRow}>
        <View style={[styles.square, { backgroundColor: '#00A4EF' }]} />
        <View style={[styles.square, { backgroundColor: '#FFB900' }]} />
      </View>
    </View>
  );
}

export function MicrosoftButton({
  title = 'Sign in with Microsoft',
  loading = false,
  disabled,
  style,
  ...rest
}: MicrosoftButtonProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.backgroundSelected,
        },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={theme.text} />
      ) : (
        <View style={styles.content}>
          <MicrosoftLogo />
          <ThemedText type="smallBold" style={styles.text}>
            {title}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  logoGrid: {
    width: 20,
    height: 20,
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  square: {
    width: 9,
    height: 9,
  },
});
