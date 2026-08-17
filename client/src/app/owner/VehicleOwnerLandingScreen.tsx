import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../../components/ui/BackButton';

interface VehicleOwnerLandingScreenProps {
  onBack: () => void;
  onContinueAsGuest: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

const THEME = {
  background: '#F4F6F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  primaryDark: '#003380',
  accent: '#F5A524',
  success: '#10B981',
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE'
};

export default function VehicleOwnerLandingScreen({
  onBack,
  onContinueAsGuest,
  onLogin,
  onRegister
}: VehicleOwnerLandingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <BackButton variant="ghost" label="Home" onPress={onBack} />
        <View style={styles.headerBrand}>
          <View style={styles.headerBrandIcon}>
            <Ionicons name="car-sport" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.headerBrandTitle}>AutoDoc</Text>
        </View>
        <TouchableOpacity style={styles.loginHeaderBtn} onPress={onLogin}>
          <Text style={styles.loginHeaderBtnText}>Log In</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroRoleBadge}>
              <Ionicons name="person" size={14} color="#0046AD" />
              <Text style={styles.heroRoleBadgeText}>VEHICLE OWNER PORTAL</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Smart Vehicle Management in Your Pocket</Text>
          <Text style={styles.heroSubtitle}>
            Track inspection reports, schedule maintenance with certified workshops, store digital vehicle documents, and access 24/7 roadside emergency help.
          </Text>

          {/* Call to Actions */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onContinueAsGuest} activeOpacity={0.85}>
              <Ionicons name="flash-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Explore Dashboard (Guest)</Text>
            </TouchableOpacity>

            <View style={styles.splitBtnRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={onLogin} activeOpacity={0.85}>
                <Ionicons name="log-in-outline" size={18} color="#0046AD" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryBtnText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtnAccent} onPress={onRegister} activeOpacity={0.85}>
                <Ionicons name="person-add-outline" size={18} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryBtnAccentText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Feature Highlights Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Everything You Need for Your Car</Text>
          <Text style={styles.sectionSubtitle}>Designed to keep your vehicle running smoothly and safely.</Text>
        </View>

        <View style={styles.featureList}>
          {/* Feature 1 */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIconContainer, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="car-sport" size={24} color="#0284C7" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Digital Garage & Documents</Text>
              <Text style={styles.featureDescription}>
                Store registration certificate (RC), insurance policies, PUC emission test records, and warranty details securely.
              </Text>
            </View>
          </View>

          {/* Feature 2 */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="clipboard-outline" size={24} color="#D97706" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Inspection Reports & Assessments</Text>
              <Text style={styles.featureDescription}>
                Access comprehensive 50-point vehicle condition scores, photo documentation, and technician repair recommendations.
              </Text>
            </View>
          </View>

          {/* Feature 3 */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="calendar-outline" size={24} color="#16A34A" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Easy Service Booking</Text>
              <Text style={styles.featureDescription}>
                Browse certified local workshops, select preferred time slots, compare service pricing, and track live job progress.
              </Text>
            </View>
          </View>

          {/* Feature 4 */}
          <View style={styles.featureCard}>
            <View style={[styles.featureIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>24/7 Roadside Emergency Help</Text>
              <Text style={styles.featureDescription}>
                One-tap assistance for battery jumpstarts, flat tire replacements, towing services, and roadside breakdown repairs.
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Launch Banner */}
        <TouchableOpacity style={styles.bottomBanner} onPress={onContinueAsGuest} activeOpacity={0.9}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bottomBannerTitle}>Ready to start?</Text>
            <Text style={styles.bottomBannerSubtitle}>Hop into your owner workspace right away.</Text>
          </View>
          <View style={styles.bottomBannerArrowBtn}>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerBrandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerBrandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text
  },
  loginHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: THEME.blueBg,
    borderWidth: 1,
    borderColor: THEME.blueBorder
  },
  loginHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primary
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  heroCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  heroBadgeRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  heroRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  heroRoleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0046AD',
    letterSpacing: 0.5
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.text,
    lineHeight: 30,
    marginBottom: 10
  },
  heroSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 20,
    marginBottom: 20
  },
  actionButtonsContainer: {
    gap: 10
  },
  primaryBtn: {
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  splitBtnRow: {
    flexDirection: 'row',
    gap: 10
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.primary
  },
  secondaryBtnAccent: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14
  },
  secondaryBtnAccentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  sectionHeader: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 13,
    color: THEME.textSecondary
  },
  featureList: {
    gap: 12,
    marginBottom: 24
  },
  featureCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14
  },
  featureIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  featureContent: {
    flex: 1
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4
  },
  featureDescription: {
    fontSize: 13,
    color: THEME.textSecondary,
    lineHeight: 18
  },
  bottomBanner: {
    backgroundColor: THEME.text,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  bottomBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2
  },
  bottomBannerSubtitle: {
    fontSize: 12,
    color: '#94A3B8'
  },
  bottomBannerArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
