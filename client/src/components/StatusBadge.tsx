import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.trim().toLowerCase();

  let badgeBg = '#F3F4F6';
  let badgeText = '#374151';

  if (normalized === 'pending' || normalized === 'pending approval') {
    badgeBg = '#FEF3C7'; // Amber Light
    badgeText = '#D97706'; // Amber Dark
  } else if (normalized === 'confirmed' || normalized === 'active' || normalized === 'approved') {
    badgeBg = '#D1FAE5'; // Green Light
    badgeText = '#059669'; // Green Dark
  } else if (normalized === 'completed') {
    badgeBg = '#DBEAFE'; // Blue Light
    badgeText = '#2563EB'; // Blue Dark
  } else if (normalized === 'suspended' || normalized === 'deactivated' || normalized === 'expired' || normalized === 'invalid') {
    badgeBg = '#FEE2E2'; // Red Light
    badgeText = '#DC2626'; // Red Dark
  }

  // Proper title casing
  const displayLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
      <Text style={[styles.text, { color: badgeText }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
    alignSelf: 'flex-start'
  },
  text: {
    fontSize: 11,
    fontWeight: 'bold'
  }
});
