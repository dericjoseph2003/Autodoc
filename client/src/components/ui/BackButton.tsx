import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface BackButtonProps {
  onPress?: () => void;
  label?: string;
  showLabel?: boolean;
  variant?: 'card' | 'ghost' | 'pill' | 'light' | 'header';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  color?: string;
  size?: number;
}

export default function BackButton({
  onPress,
  label = 'Back',
  showLabel = true,
  variant = 'card',
  icon = 'arrow-back',
  style,
  textStyle,
  color,
  size = 18
}: BackButtonProps) {
  // Theme styling based on variant
  const getContainerStyle = () => {
    switch (variant) {
      case 'ghost':
        return styles.ghostContainer;
      case 'pill':
        return styles.pillContainer;
      case 'light':
        return styles.lightContainer;
      case 'header':
        return styles.headerContainer;
      case 'card':
      default:
        return styles.cardContainer;
    }
  };

  const getDefaultColor = () => {
    if (color) return color;
    switch (variant) {
      case 'ghost':
        return '#0046AD';
      case 'pill':
        return '#FFFFFF';
      case 'light':
        return '#1E293B';
      case 'header':
        return '#0F172A';
      case 'card':
      default:
        return '#0F172A';
    }
  };

  const iconColor = getDefaultColor();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.baseButton, getContainerStyle(), style]}
      accessibilityRole="button"
      accessibilityLabel={label ? `Go back, ${label}` : 'Go back'}
    >
      <Ionicons name={icon} size={size} color={iconColor} />
      {showLabel && label ? (
        <Text
          style={[
            styles.baseLabel,
            { color: iconColor },
            variant === 'pill' && styles.pillLabel,
            textStyle
          ]}
        >
          {label}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    minHeight: 40,
    cursor: Platform.OS === 'web' ? 'pointer' : 'auto'
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  ghostContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 6,
    paddingVertical: 4
  },
  pillContainer: {
    backgroundColor: '#0046AD',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  lightContainer: {
    backgroundColor: '#EEF2F6',
    borderRadius: 10
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  baseLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  pillLabel: {
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
