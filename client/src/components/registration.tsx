import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackButton from './ui/BackButton';
import VehicleOwnerRegister from './auth/VehicleOwnerRegister';
import ServiceCenterRegister from './auth/ServiceCenterRegister';

const THEME = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD'
};

export interface RegistrationProps {
  initialRole?: 'owner' | 'service_center';
  onSuccessAuth: (user: any, token: string) => void;
  onPendingApproval: () => void;
  onBackToLogin: () => void;
  onBackToLanding?: () => void;
}

export default function Registration({
  initialRole = 'owner',
  onSuccessAuth,
  onPendingApproval,
  onBackToLogin,
  onBackToLanding
}: RegistrationProps) {
  const [activeRole, setActiveRole] = useState<'owner' | 'service_center'>(initialRole);

  useEffect(() => {
    if (initialRole) {
      setActiveRole(initialRole);
    }
  }, [initialRole]);

  return (
    <ScrollView
      style={styles.mainContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.authCard}>
        {/* Top Back Navigation Bar */}
        <View style={styles.topNavRow}>
          <BackButton
            variant="ghost"
            label={onBackToLanding ? 'Back' : 'Sign In'}
            onPress={onBackToLanding || onBackToLogin}
          />

          <View style={styles.brandRow}>
            <View style={styles.brandIconBox}>
              <Ionicons name="car-sport" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>AutoDoc</Text>
          </View>
        </View>

        {/* Render Dedicated Role Registration Component */}
        {activeRole === 'owner' ? (
          <VehicleOwnerRegister
            onSuccessAuth={onSuccessAuth}
            onBackToLogin={onBackToLogin}
            onSwitchToServiceCenter={() => setActiveRole('service_center')}
          />
        ) : (
          <ServiceCenterRegister
            onPendingApproval={onPendingApproval}
            onBackToLogin={onBackToLogin}
            onSwitchToOwner={() => setActiveRole('owner')}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 32
  },
  authCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brandIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#0046AD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  brandText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2
  }
});
