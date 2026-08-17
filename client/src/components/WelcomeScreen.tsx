import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const THEME = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  accent: '#F5A524'
};

export interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function WelcomeScreen({ onGetStarted, onLogin }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Header */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <View style={styles.brandIconBox}>
              <Ionicons name="car-sport" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>AutoDoc</Text>
          </View>

          <TouchableOpacity style={styles.loginPill} onPress={onLogin} activeOpacity={0.8}>
            <Text style={styles.loginPillText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Visual Image Card */}
        <View style={styles.heroImageContainer}>
          <Image
            source={require('../../assets/images/welcome_hero.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Headline & Value Proposition */}
        <View style={styles.textSection}>
          <Text style={styles.mainHeadline}>
            Smart Automotive Care & Workshop Platform
          </Text>
          <Text style={styles.subHeadline}>
            The complete ecosystem connecting vehicle owners with certified repair centers and emergency roadside services.
          </Text>
        </View>

        {/* Feature Cards Grid */}
        <View style={styles.featuresList}>
          {/* Feature 1 */}
          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="folder-outline" size={20} color="#0046AD" />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Digital Garage & Documents</Text>
              <Text style={styles.featureDescription}>
                Store RC, insurance policies, PUC certificates, and service histories in one place.
              </Text>
            </View>
          </View>

          {/* Feature 2 */}
          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="construct-outline" size={20} color="#16A34A" />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Certified Service Network</Text>
              <Text style={styles.featureDescription}>
                Book verified local workshops with bay tracking, transparent quotes, and live updates.
              </Text>
            </View>
          </View>

          {/* Feature 3 */}
          <View style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="warning-outline" size={20} color="#DC2626" />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>24/7 Roadside Rescue</Text>
              <Text style={styles.featureDescription}>
                Instant emergency breakdown assistance, flat tire help, battery jumpstarts, and towing.
              </Text>
            </View>
          </View>
        </View>

        {/* Primary CTA & Sign In Link */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={onGetStarted}
            activeOpacity={0.85}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInLink} onPress={onLogin} activeOpacity={0.7}>
            <Text style={styles.signInLinkText}>
              Already have an account? <Text style={styles.signInLinkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.2
  },
  loginPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF'
  },
  loginPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.primary
  },
  heroImageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  heroImage: {
    width: '100%',
    height: '100%'
  },
  textSection: {
    marginBottom: 20
  },
  mainHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.4,
    lineHeight: 30,
    marginBottom: 8
  },
  subHeadline: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 20
  },
  featuresList: {
    gap: 12,
    marginBottom: 24
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  featureTextBox: {
    flex: 1
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 2
  },
  featureDescription: {
    fontSize: 12,
    color: THEME.textSecondary,
    lineHeight: 17
  },
  actionContainer: {
    gap: 12
  },
  getStartedButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: THEME.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 6
  },
  signInLinkText: {
    fontSize: 13,
    color: THEME.textSecondary
  },
  signInLinkBold: {
    color: THEME.primary,
    fontWeight: '700'
  }
});
