import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap | string;
  number: string | number;
  label: string;
  iconColor?: string;
  iconBg?: string;
  onPress?: () => void;
}

export default function StatCard({
  icon,
  number,
  label,
  iconColor = '#185FA5',
  iconBg = '#185FA515',
  onPress
}: StatCardProps) {
  const isFeatherIcon = typeof icon === 'string' && icon in Feather.glyphMap;

  const content = (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          {isFeatherIcon ? (
            <Feather name={icon as any} size={18} color={iconColor} />
          ) : (
            <Text style={styles.emojiText}>{String(icon)}</Text>
          )}
        </View>
        <Text style={styles.number}>{number}</Text>
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.wrapper}>{content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minWidth: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 16,
  },
  number: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
});
