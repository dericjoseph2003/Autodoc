import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import BackButton from '../src/components/ui/BackButton';

// Design tokens matching index.tsx
const THEME = {
  background: '#F4F6F9',      // Premium light grey/blue from Autodoc
  card: '#FFFFFF',            // Pure white card background
  border: '#E2E8F0',          // Soft light slate border
  text: '#0F172A',            // Charcoal/Navy text from Autodoc
  textSecondary: '#64748B',   // Slate grey subtext
  primary: '#0046AD',         // Deep Royal Blue from Autodoc
  accent: '#F5A524',          // Amber accent
  accentLight: '#FEF3C7',
  buttonBg: '#EEF2F6',
};

export default function PendingApprovalScreen({ onBackToLogin }) {
  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      // Fallback for router-based navigation
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
        <View style={{ width: '100%', maxWidth: 440, marginBottom: 12, alignItems: 'flex-start' }}>
          <BackButton variant="card" label="Back to Login" onPress={handleBackToLogin} />
        </View>
        <View style={styles.card}>
          {/* Centered pending/clock icon container */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⏳</Text>
          </View>

          {/* Heading */}
          <Text style={styles.title}>Your account is under review</Text>

          {/* Subtext */}
          <Text style={styles.subtitle}>
            Your service center account has been registered and is currently awaiting admin approval. 
            You will be notified once your registration is approved. Thank you for your patience.
          </Text>

          {/* Full-width amber Back to Login button */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleBackToLogin}>
            <Text style={styles.primaryButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    // Soft premium shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: THEME.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
