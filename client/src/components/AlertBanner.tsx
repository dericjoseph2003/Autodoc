import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface AlertBannerProps {
  type: 'emergency' | 'profile' | 'document';
  title: string;
  subtitle?: string;
  details?: string[];
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export default function AlertBanner({
  type,
  title,
  subtitle,
  details,
  actionLabel,
  onAction,
  onDismiss,
}: AlertBannerProps) {
  const getBannerStyle = () => {
    switch (type) {
      case 'emergency':
        return {
          containerBg: '#FEF2F2',
          borderColor: '#F87171',
          iconName: 'alert-octagon' as const,
          iconColor: '#DC2626',
          iconBg: '#FEE2E2',
          titleColor: '#991B1B',
          textColor: '#7F1D1D',
          btnBg: '#DC2626',
          btnTextColor: '#FFFFFF',
        };
      case 'profile':
        return {
          containerBg: '#FFFFFF',
          borderColor: '#F5A524',
          iconName: 'user-check' as const,
          iconColor: '#F5A524',
          iconBg: '#FEF3C7',
          titleColor: '#0F172A',
          textColor: '#475569',
          btnBg: '#F5A524',
          btnTextColor: '#FFFFFF',
        };
      case 'document':
      default:
        return {
          containerBg: '#FFFBEB',
          borderColor: '#F5A524',
          iconName: 'alert-triangle' as const,
          iconColor: '#D97706',
          iconBg: '#FEF3C7',
          titleColor: '#92400E',
          textColor: '#B45309',
          btnBg: '#D97706',
          btnTextColor: '#FFFFFF',
        };
    }
  };

  const styleConfig = getBannerStyle();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: styleConfig.containerBg,
          borderColor: styleConfig.borderColor,
          borderWidth: type === 'profile' ? 1 : 0.5,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.leftGroup}>
          <View style={[styles.iconBox, { backgroundColor: styleConfig.iconBg }]}>
            <Feather name={styleConfig.iconName} size={20} color={styleConfig.iconColor} />
          </View>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: styleConfig.titleColor }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: styleConfig.textColor }]}>{subtitle}</Text>
            ) : null}
          </View>
        </View>

        {onDismiss ? (
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {details && details.length > 0 ? (
        <View style={styles.detailsBox}>
          {details.map((item, index) => (
            <View key={index} style={styles.detailRow}>
              <Text style={[styles.bullet, { color: styleConfig.textColor }]}>•</Text>
              <Text style={[styles.detailText, { color: styleConfig.textColor }]}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: styleConfig.btnBg }]}
          onPress={onAction}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionBtnText, { color: styleConfig.btnTextColor }]}>
            {actionLabel}
          </Text>
          <Feather name="arrow-right" size={14} color={styleConfig.btnTextColor} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  dismissBtn: {
    padding: 2,
  },
  detailsBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#00000010',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 14,
    marginRight: 6,
    lineHeight: 16,
  },
  detailText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
