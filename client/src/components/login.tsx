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
import { api, setToken } from '../services/api';
import BackButton from './ui/BackButton';
import GoogleSignInButton from './GoogleSignInButton';

const THEME = {
  background: '#F4F6F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  inputBg: '#EEF2F6',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  accent: '#F5A524',
  success: '#10B981',
  error: '#EF4444',
  buttonBg: '#EEF2F6'
};

export interface LoginProps {
  onSuccessAuth: (user: any, token: string) => void;
  onPendingApproval: () => void;
  onBackToLanding: () => void;
  onGoToRegister: () => void;
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
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setAuthError('');
    if (!email || !password) {
      setAuthError('Please fill in email and password');
      return;
    }
    try {
      setLoading(true);
      const res = await api.login({ email: email.trim(), password });
      
      if (!res.user || !res.user.role) {
        throw new Error('User role missing from login credentials');
      }

      setToken(res.token);
      onSuccessAuth(res.user, res.token);

      if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).PasswordCredential) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: email,
            password: password,
            name: res.user?.name || email
          });
          if (navigator.credentials && navigator.credentials.store) {
            navigator.credentials.store(cred).catch(() => {});
          }
        } catch (_) {}
      }
    } catch (err: any) {
      if (err.code === 'pending_approval') {
        onPendingApproval();
      } else {
        setAuthError(err.message || 'Invalid email or password');
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
        setAuthError(err.message || 'Google authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME.accent} />
        </View>
      )}

      <View style={styles.authCard}>
        <View style={{ marginBottom: 16, alignItems: 'flex-start' }}>
          <BackButton
            variant="ghost"
            label="Landing"
            onPress={onBackToLanding}
          />
        </View>

        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>🚗</Text>
          </View>
          <Text style={styles.logoText}>AutoDoc</Text>
        </View>

        {/* Introduction card */}
        <View style={styles.landingInfoCard}>
          <Text style={styles.landingInfoTitle}>Welcome to AutoDoc</Text>
          <Text style={styles.landingInfoText}>
            Access your account to manage your vehicle assessments, service appointments, roadside assistance, and workshop operations.
          </Text>
        </View>

        {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="name@example.com"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="username"
          textContentType="username"
          // @ts-ignore
          name="username"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            textContentType="password"
            // @ts-ignore
            name="password"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(p => !p)}>
            <Text style={styles.eyeBtnText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {onGoToForgotPassword && (
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => onGoToForgotPassword(email)}
          >
            <Text style={styles.forgotBtnText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Log In</Text>
        </TouchableOpacity>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={(msg) => setAuthError(msg)}
          disabled={loading}
          label="Sign in with Google"
        />

        <TouchableOpacity
          style={styles.switchAuthContainer}
          onPress={onGoToRegister}
        >
          <Text style={styles.switchAuthText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    alignItems: 'center'
  },
  loaderContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  authCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 20
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10
  },
  logoIcon: {
    backgroundColor: THEME.buttonBg,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoIconText: {
    fontSize: 24
  },
  logoText: {
    color: THEME.text,
    fontSize: 24,
    fontWeight: 'bold'
  },
  landingInfoCard: {
    backgroundColor: '#F9FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  landingInfoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6
  },
  landingInfoText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16
  },
  label: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#1E1E1E',
    fontSize: 14,
    borderWidth: 0
  },
  passwordContainer: {
    width: '100%',
    height: 48,
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    color: '#1E1E1E',
    fontSize: 14
  },
  eyeBtn: {
    padding: 8
  },
  eyeBtnText: {
    fontSize: 16
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8
  },
  forgotBtnText: {
    color: THEME.accent,
    fontSize: 12,
    fontWeight: '600'
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: THEME.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },
  switchAuthContainer: {
    marginTop: 16,
    alignItems: 'center'
  },
  switchAuthText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: '600'
  },
  errorText: {
    color: THEME.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12
  }
});
