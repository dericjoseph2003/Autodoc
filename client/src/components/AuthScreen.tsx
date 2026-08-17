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
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { validatePassword, getPasswordCriteria } from '../utils/validation';
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
  error: '#EF4444'
};

export interface AuthScreenProps {
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
  const [selectedRole, setSelectedRole] = useState<'owner' | 'service_center'>(initialRole);
  const [loading, setLoading] = useState(false);

  // Forgot Password Flow States
  const [forgotStep, setForgotStep] = useState<'email' | 'verify_otp' | 'new_password' | 'success'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [devOtpNotice, setDevOtpNotice] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  const handleRequestOtp = async () => {
    setForgotError('');
    setDevOtpNotice('');
    const trimmedEmail = forgotEmail.trim();

    if (!trimmedEmail) {
      setForgotError('Please enter your registered email address');
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
        setDevOtpNotice(`[DEV MODE] Verification OTP: ${res.devOtp}`);
      }
      setForgotStep('verify_otp');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send reset code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setForgotError('');
    const trimmedOtp = forgotOtp.trim();

    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setForgotError('Verification code must be exactly 6 digits.');
      return;
    }

    try {
      setLoading(true);
      await api.verifyOtp({
        email: forgotEmail.trim(),
        otp: trimmedOtp
      });
      setForgotStep('new_password');
    } catch (err: any) {
      setForgotError(err.message || 'Invalid verification code. Please check your email inbox.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setForgotError('');
    const trimmedOtp = forgotOtp.trim();

    if (!forgotNewPassword) {
      setForgotError('New password is required.');
      return;
    }
    if (!validatePassword(forgotNewPassword).isValid) {
      setForgotError('New password does not meet all security criteria.');
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
      { key: 'minLength', label: '8+ characters' },
      { key: 'hasUpper', label: 'Uppercase (A-Z)' },
      { key: 'hasLower', label: 'Lowercase (a-z)' },
      { key: 'hasNumber', label: 'Number (0-9)' },
      { key: 'hasSpecial', label: 'Special symbol' }
    ];

    return (
      <View style={styles.checklistCard}>
        <Text style={styles.checklistTitle}>Password Strength Checklist:</Text>
        <View style={styles.checklistGrid}>
          {items.map(item => {
            const met = (criteria as any)[item.key];
            return (
              <View key={item.key} style={styles.checklistItem}>
                <Ionicons
                  name={met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={13}
                  color={met ? THEME.success : '#94A3B8'}
                />
                <Text style={[styles.checklistText, met && styles.checklistTextMet]}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. LOGIN SCREEN */}
      {currentScreen === 'login' && (
        <Login
          onSuccessAuth={onSuccessAuth}
          onPendingApproval={onPendingApproval}
          onBackToLanding={onBackToLanding}
          onGoToRegister={(role) => {
            if (role) setSelectedRole(role);
            setCurrentScreen('signup');
          }}
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

      {/* 2. REGISTRATION SCREEN (Supports Owner & Service Center) */}
      {currentScreen === 'signup' && (
        <Registration
          initialRole={selectedRole}
          onSuccessAuth={onSuccessAuth}
          onPendingApproval={onPendingApproval}
          onBackToLogin={() => setCurrentScreen('login')}
          onBackToLanding={onBackToLanding}
        />
      )}

      {/* 3. FORGOT PASSWORD FLOW */}
      {currentScreen === 'forgot_password' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
          <View style={styles.authCard}>
            {loading && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={THEME.primary} />
              </View>
            )}

            {/* Back Button & Header */}
            <View style={styles.topNavRow}>
              <BackButton
                variant="ghost"
                label="Sign In"
                onPress={() => setCurrentScreen('login')}
              />
              <View style={styles.brandRow}>
                <View style={styles.brandIconBox}>
                  <Ionicons name="car-sport" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.brandText}>AutoDoc</Text>
              </View>
            </View>

            {/* Step: Email Request */}
            {forgotStep === 'email' && (
              <View>
                <View style={styles.headerBox}>
                  <Text style={styles.title}>Reset Password</Text>
                  <Text style={styles.subtitle}>
                    Enter the email associated with your account and we'll send a 6-digit verification code.
                  </Text>
                </View>

                {forgotError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color={THEME.error} />
                    <Text style={styles.errorBannerText}>{forgotError}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Registered Email</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="name@example.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleRequestOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Send Reset Code</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Enter Verification Code */}
            {forgotStep === 'verify_otp' && (
              <View>
                <View style={styles.headerBox}>
                  <Text style={styles.title}>Check Your Email Inbox</Text>
                  <Text style={styles.subtitle}>
                    We sent a 6-digit verification code to <Text style={{ fontWeight: '700', color: '#0F172A' }}>{forgotEmail}</Text>. Enter the code below to activate password resetting options.
                  </Text>
                </View>

                {devOtpNotice ? (
                  <View style={styles.devNoticeCard}>
                    <Ionicons name="code-slash" size={16} color="#B45309" />
                    <Text style={styles.devNoticeText}>{devOtpNotice}</Text>
                  </View>
                ) : null}

                {forgotError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color={THEME.error} />
                    <Text style={styles.errorBannerText}>{forgotError}</Text>
                  </View>
                ) : null}

                {/* 6-Digit OTP */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>6-Digit Verification Code</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="key-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { letterSpacing: 6, fontWeight: '800', fontSize: 18 }]}
                      placeholder="123456"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={6}
                      value={forgotOtp}
                      onChangeText={setForgotOtp}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Verify Code & Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendLink}
                  onPress={handleRequestOtp}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendLinkText}>Didn't receive code? Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Enter New Password (Activated after OTP verification) */}
            {forgotStep === 'new_password' && (
              <View>
                <View style={styles.headerBox}>
                  <Text style={styles.title}>Set New Password</Text>
                  <Text style={styles.subtitle}>
                    Email code verified successfully for <Text style={{ fontWeight: '700', color: '#0F172A' }}>{forgotEmail}</Text>. Enter your new password below.
                  </Text>
                </View>

                {forgotError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color={THEME.error} />
                    <Text style={styles.errorBannerText}>{forgotError}</Text>
                  </View>
                ) : null}

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Min. 8 characters"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showForgotNewPassword}
                      value={forgotNewPassword}
                      onChangeText={setForgotNewPassword}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowForgotNewPassword(p => !p)}>
                      <Ionicons name={showForgotNewPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {renderPasswordChecklist(forgotNewPassword)}

                {/* Confirm New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showForgotConfirmPassword}
                      value={forgotConfirmPassword}
                      onChangeText={setForgotConfirmPassword}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowForgotConfirmPassword(p => !p)}>
                      <Ionicons name={showForgotConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Update Password & Sign In</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              </View>
            )}

            {/* Step: Success */}
            {forgotStep === 'success' && (
              <View style={styles.successBox}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-circle" size={48} color={THEME.success} />
                </View>
                <Text style={styles.successTitle}>Password Reset Complete!</Text>
                <Text style={styles.successSubtitle}>
                  {forgotSuccessMsg || 'Your password has been successfully updated. You can now sign in with your new password.'}
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setCurrentScreen('login')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Proceed to Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
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
  container: {
    flex: 1,
    backgroundColor: THEME.background
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
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginTop: 10
  },
  loaderOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    borderRadius: 20
  },
  topNavRow: {
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
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0046AD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2
  },
  headerBox: {
    marginBottom: 20
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1
  },
  devNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16
  },
  devNoticeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700'
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48
  },
  inputIcon: {
    marginRight: 8
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#0F172A'
  },
  eyeBtn: {
    padding: 6
  },
  checklistCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 14
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6
  },
  checklistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '45%'
  },
  checklistText: {
    fontSize: 11,
    color: '#64748B'
  },
  checklistTextMet: {
    color: '#15803D',
    fontWeight: '600'
  },
  primaryButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#0046AD',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0046AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  buttonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  resendLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 4
  },
  resendLinkText: {
    fontSize: 12,
    color: '#0046AD',
    fontWeight: '600'
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 12
  },
  successIconCircle: {
    marginBottom: 16
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center'
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20
  }
});
