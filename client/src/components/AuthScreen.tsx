import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { api } from '../services/api';
import {
  validatePassword,
  getPasswordCriteria
} from '../utils/validation';
import BackButton from './ui/BackButton';
import Login from './login';
import Registration from './registration';

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

interface AuthScreenProps {
  initialScreen?: 'login' | 'signup' | 'forgot_password';
  initialRole?: 'owner' | 'service_center';
  onSuccessAuth: (user: any, token: string) => void;
  onPendingApproval: () => void;
  onBackToLanding: () => void;
}

export default function AuthScreen({
  initialScreen = 'login',
  initialRole = 'owner',
  onSuccessAuth,
  onPendingApproval,
  onBackToLanding
}: AuthScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'signup' | 'forgot_password'>(initialScreen);
  const [loading, setLoading] = useState(false);

  // Forgot Password Flow States
  const [forgotStep, setForgotStep] = useState<'email' | 'reset' | 'success'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [devOtpNotice, setDevOtpNotice] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Forgot Password API Handlers
  const handleRequestOtp = async () => {
    setForgotError('');
    setDevOtpNotice('');
    const trimmedEmail = forgotEmail.trim();

    if (!trimmedEmail) {
      setForgotError('Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setForgotError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const res = await api.forgotPassword(trimmedEmail);
      if (res.devOtp) {
        setDevOtpNotice(`[DEV MODE] Verification OTP code: ${res.devOtp}`);
      }
      setForgotStep('reset');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotError('');
    const trimmedOtp = forgotOtp.trim();

    if (!trimmedOtp) {
      setForgotError('Verification code is required.');
      return;
    }
    if (trimmedOtp.length !== 6 || isNaN(Number(trimmedOtp))) {
      setForgotError('Verification code must be 6 digits.');
      return;
    }
    if (!forgotNewPassword) {
      setForgotError('New password is required.');
      return;
    }
    if (!validatePassword(forgotNewPassword).isValid) {
      setForgotError('New password does not meet security requirements.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.resetPassword({
        email: forgotEmail.trim(),
        otp: trimmedOtp,
        newPassword: forgotNewPassword
      });
      setForgotSuccessMsg(res.message || 'Password reset successful!');
      setForgotStep('success');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordChecklist = (pwd: string) => {
    const criteria = getPasswordCriteria(pwd);
    const items = [
      { key: 'minLength', label: 'At least 8 characters long' },
      { key: 'hasUpper', label: 'One uppercase letter (A-Z)' },
      { key: 'hasLower', label: 'One lowercase letter (a-z)' },
      { key: 'hasNumber', label: 'One number (0-9)' },
      { key: 'hasSpecial', label: 'One special character (!@#$%^&*)' }
    ];

    return (
      <View style={styles.passwordChecklistContainer}>
        <Text style={styles.passwordChecklistTitle}>Password must contain:</Text>
        {items.map(item => {
          const met = (criteria as any)[item.key];
          return (
            <View key={item.key} style={styles.passwordChecklistItem}>
              <Text style={[styles.passwordChecklistIcon, met ? styles.metIcon : styles.unmetIcon]}>
                {met ? '✓' : '○'}
              </Text>
              <Text style={[styles.passwordChecklistText, met ? styles.metText : styles.unmetText]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: THEME.background }}>
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME.accent} />
        </View>
      )}

      {/* STANDALONE LOGIN COMPONENT */}
      {currentScreen === 'login' && (
        <Login
          onSuccessAuth={onSuccessAuth}
          onPendingApproval={onPendingApproval}
          onBackToLanding={onBackToLanding}
          onGoToRegister={() => setCurrentScreen('signup')}
          onGoToForgotPassword={(userEmail) => {
            if (userEmail) setForgotEmail(userEmail);
            setForgotStep('email');
            setForgotError('');
            setDevOtpNotice('');
            setForgotOtp('');
            setForgotNewPassword('');
            setForgotConfirmPassword('');
            setCurrentScreen('forgot_password');
          }}
        />
      )}

      {/* STANDALONE REGISTRATION COMPONENT */}
      {currentScreen === 'signup' && (
        <Registration
          initialRole={initialRole}
          onSuccessAuth={onSuccessAuth}
          onPendingApproval={onPendingApproval}
          onBackToLogin={() => setCurrentScreen('login')}
        />
      )}

      {/* FORGOT PASSWORD SCREEN */}
      {currentScreen === 'forgot_password' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
          <View style={styles.authCard}>
            <View style={{ marginBottom: 16, alignItems: 'flex-start' }}>
              <BackButton
                variant="card"
                label="Back"
                onPress={() => {
                  if (forgotStep === 'reset') {
                    setForgotStep('email');
                  } else {
                    setCurrentScreen('login');
                  }
                  setForgotError('');
                }}
              />
            </View>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoIconText}>🚗</Text>
              </View>
              <Text style={styles.logoText}>AutoDoc</Text>
            </View>

            {forgotStep === 'email' && (
              <View>
                <Text style={styles.authTitle}>Reset your password</Text>
                <Text style={styles.authSubtitle}>
                  Enter your registered email address below. We'll send you a 6-digit verification code to set a new password.
                </Text>

                {forgotError ? <Text style={styles.errorText}>{forgotError}</Text> : null}

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={forgotEmail}
                  onChangeText={(val) => {
                    setForgotEmail(val);
                    if (forgotError) setForgotError('');
                  }}
                />

                <TouchableOpacity style={styles.primaryButton} onPress={handleRequestOtp}>
                  <Text style={styles.primaryButtonText}>Send Verification Code →</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchAuthContainer}
                  onPress={() => {
                    setCurrentScreen('login');
                    setForgotError('');
                  }}
                >
                  <Text style={styles.switchAuthText}>Back to Log In</Text>
                </TouchableOpacity>
              </View>
            )}

            {forgotStep === 'reset' && (
              <View>
                <Text style={styles.authTitle}>Enter Code & Reset Password</Text>
                <Text style={styles.authSubtitle}>
                  Verification code sent to <Text style={{ fontWeight: 'bold', color: THEME.text }}>{forgotEmail}</Text>
                </Text>

                {devOtpNotice ? (
                  <View style={styles.devNoticeContainer}>
                    <Text style={styles.devNoticeText}>{devOtpNotice}</Text>
                  </View>
                ) : null}

                {forgotError ? <Text style={styles.errorText}>{forgotError}</Text> : null}

                <Text style={styles.label}>6-Digit Verification Code</Text>
                <TextInput
                  style={[styles.input, { letterSpacing: 4, fontWeight: 'bold', fontSize: 18, textAlign: 'center' }]}
                  placeholder="123456"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={forgotOtp}
                  onChangeText={(val) => {
                    setForgotOtp(val);
                    if (forgotError) setForgotError('');
                  }}
                />

                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor="#666"
                    secureTextEntry={!showForgotNewPassword}
                    value={forgotNewPassword}
                    onChangeText={(val) => {
                      setForgotNewPassword(val);
                      if (forgotError) setForgotError('');
                    }}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowForgotNewPassword(p => !p)}>
                    <Text style={styles.eyeBtnText}>{showForgotNewPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {renderPasswordChecklist(forgotNewPassword)}

                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  secureTextEntry={!showForgotNewPassword}
                  value={forgotConfirmPassword}
                  onChangeText={(val) => {
                    setForgotConfirmPassword(val);
                    if (forgotError) setForgotError('');
                  }}
                />

                <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword}>
                  <Text style={styles.primaryButtonText}>Reset Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forgotBtn}
                  onPress={handleRequestOtp}
                >
                  <Text style={styles.forgotBtnText}>Resend Verification Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchAuthContainer}
                  onPress={() => {
                    setCurrentScreen('login');
                    setForgotError('');
                  }}
                >
                  <Text style={styles.switchAuthText}>Back to Log In</Text>
                </TouchableOpacity>
              </View>
            )}

            {forgotStep === 'success' && (
              <View style={styles.forgotSuccessCard}>
                <Text style={styles.successIcon}>🎉</Text>
                <Text style={styles.successTitle}>Password Reset Successful!</Text>
                <Text style={styles.successSubtitle}>
                  {forgotSuccessMsg || 'Your password has been updated successfully. You can now log in with your new password.'}
                </Text>

                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 24 }]}
                  onPress={() => {
                    setCurrentScreen('login');
                  }}
                >
                  <Text style={styles.primaryButtonText}>Log In to Your Account →</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  scrollContent: {
    padding: 16,
    alignItems: 'center'
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
    marginTop: 40
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  landingInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4
  },
  landingInfoText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 16
  },
  authTitle: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  authSubtitle: {
    color: THEME.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.buttonBg,
    borderRadius: 8,
    padding: 4,
    marginBottom: 20
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  toggleBtnText: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '600'
  },
  toggleBtnTextActive: {
    color: '#1E1E1E'
  },
  label: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  validBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: 'bold'
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
  inputValid: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4'
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center'
  },
  passwordInput: {
    width: '100%',
    height: 48,
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 48,
    color: '#1E1E1E',
    fontSize: 14
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
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
  disabledButton: {
    backgroundColor: '#CBD5E1',
    opacity: 0.7
  },
  disabledButtonText: {
    color: '#64748B'
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
  },
  passwordChecklistContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  passwordChecklistTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6
  },
  passwordChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  passwordChecklistIcon: {
    fontSize: 12,
    marginRight: 6,
    width: 16,
    textAlign: 'center'
  },
  metIcon: {
    color: '#10B981',
    fontWeight: 'bold'
  },
  unmetIcon: {
    color: '#94A3B8'
  },
  passwordChecklistText: {
    fontSize: 12
  },
  metText: {
    color: '#10B981',
    fontWeight: '500'
  },
  unmetText: {
    color: '#64748B'
  },
  devNoticeContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  devNoticeText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  forgotSuccessCard: {
    alignItems: 'center',
    paddingVertical: 16
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20
  }
});
