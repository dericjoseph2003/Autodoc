import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, setToken } from '../services/api';
import BackButton from './ui/BackButton';
import GoogleSignInButton from './GoogleSignInButton';

const THEME = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderFocus: '#0046AD',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  error: '#EF4444'
};

export interface LoginProps {
  onSuccessAuth: (user: any, token: string) => void;
  onPendingApproval: () => void;
  onBackToLanding: () => void;
  onGoToRegister: (role?: 'owner' | 'service_center') => void;
  onGoToForgotPassword?: (email?: string) => void;
}

export default function Login({
  onSuccessAuth,
  onPendingApproval,
  onBackToLanding,
  onGoToRegister,
  onGoToForgotPassword
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setAuthError('');
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({ email: cleanEmail, password });

      if (res.user && res.token) {
        setToken(res.token);
        onSuccessAuth(res.user, res.token);

        if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).PasswordCredential) {
          try {
            const cred = new (window as any).PasswordCredential({
              id: cleanEmail,
              password: password,
              name: res.user?.name || cleanEmail
            });
            if (navigator.credentials && navigator.credentials.store) {
              navigator.credentials.store(cred).catch(() => {});
            }
          } catch (_) {}
        }
      } else {
        throw new Error('Login credentials invalid.');
      }
    } catch (err: any) {
      if (err.code === 'pending_approval' || (err.message && err.message.toLowerCase().includes('awaiting admin approval'))) {
        onPendingApproval();
      } else {
        setAuthError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      setLoading(true);
      setAuthError('');
      const res = await api.googleLogin(idToken, 'owner');

      if (res.status === 'pending_approval') {
        setToken(null);
        onPendingApproval();
        return;
      }
      setToken(res.token);
      onSuccessAuth(res.user, res.token);
    } catch (err: any) {
      if (err.code === 'pending_approval') {
        onPendingApproval();
      } else {
        setAuthError(err.message || 'Google authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.mainContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.authCard}>
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={THEME.primary} />
          </View>
        )}

        {/* Top Navigation */}
        <View style={styles.topNavRow}>
          <BackButton
            variant="ghost"
            label="Back"
            onPress={onBackToLanding}
          />
          <View style={styles.brandRow}>
            <View style={styles.brandIconBox}>
              <Ionicons name="car-sport" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>AutoDoc</Text>
          </View>
        </View>

        {/* Welcome Header */}
        <View style={styles.headerBox}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>
            Enter your credentials to access your account.
          </Text>
        </View>

        {authError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={THEME.error} />
            <Text style={styles.errorBannerText}>{authError}</Text>
          </View>
        ) : null}

        {/* Email Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View
            style={[
              styles.inputContainer,
              focusedField === 'email' && styles.inputFocused
            ]}
          >
            <TextInput
              style={styles.textInput}
              placeholder="name@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            {onGoToForgotPassword && (
              <TouchableOpacity
                onPress={() => onGoToForgotPassword(email)}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>
          <View
            style={[
              styles.inputContainer,
              focusedField === 'password' && styles.inputFocused
            ]}
          >
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(p => !p)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign In Action Button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Google OAuth Option */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={(msg) => setAuthError(msg)}
          disabled={loading}
          label="Continue with Google"
        />

        {/* Footer Registration Links */}
        <View style={styles.footerBox}>
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => onGoToRegister('owner')}
            activeOpacity={0.7}
          >
            <Text style={styles.footerLinkText}>
              Don't have an account? <Text style={styles.footerLinkBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryLink}
            onPress={() => onGoToRegister('service_center')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryLinkText}>
              Service Center owner? <Text style={styles.secondaryLinkBold}>Partner Portal</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3
  },
  loaderOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    borderRadius: 16
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
  },
  headerBox: {
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B'
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1
  },
  inputGroup: {
    marginBottom: 16
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0046AD'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    height: 46
  },
  inputFocused: {
    borderColor: '#0046AD',
    borderWidth: 1.5
  },
  textInput: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: '#0F172A'
  },
  eyeBtn: {
    padding: 6
  },
  primaryButton: {
    height: 46,
    backgroundColor: '#0046AD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6
  },
  buttonDisabled: {
    opacity: 0.55
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0'
  },
  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'lowercase'
  },
  footerBox: {
    marginTop: 18,
    alignItems: 'center',
    gap: 8
  },
  footerLink: {
    paddingVertical: 4
  },
  footerLinkText: {
    fontSize: 13,
    color: '#64748B'
  },
  footerLinkBold: {
    color: '#0046AD',
    fontWeight: '700'
  },
  secondaryLink: {
    paddingVertical: 4
  },
  secondaryLinkText: {
    fontSize: 12,
    color: '#64748B'
  },
  secondaryLinkBold: {
    color: '#0046AD',
    fontWeight: '600'
  }
});
