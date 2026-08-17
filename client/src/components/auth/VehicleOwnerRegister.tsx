import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, setToken } from '../../services/api';
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validatePhone,
  getPasswordCriteria
} from '../../utils/validation';
import GoogleSignInButton from '../GoogleSignInButton';

const THEME = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderFocus: '#0046AD',
  inputBg: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  primaryHover: '#00378A',
  success: '#10B981',
  error: '#EF4444'
};

export interface VehicleOwnerRegisterProps {
  onSuccessAuth: (user: any, token: string) => void;
  onBackToLogin: () => void;
  onSwitchToServiceCenter?: () => void;
}

export default function VehicleOwnerRegister({
  onSuccessAuth,
  onBackToLogin,
  onSwitchToServiceCenter
}: VehicleOwnerRegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBlur = (field: 'name' | 'email' | 'phone' | 'password' | 'confirmPassword') => {
    setFocusedField(null);
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    let res: { isValid: boolean; error?: string };

    if (field === 'name') res = validateFullName(name);
    else if (field === 'email') res = validateEmail(email);
    else if (field === 'phone') res = validatePhone(phone);
    else if (field === 'password') res = validatePassword(password);
    else {
      res = confirmPassword === password && confirmPassword.length > 0
        ? { isValid: true }
        : { isValid: false, error: 'Passwords do not match' };
    }

    if (!res.isValid && res.error) {
      setFieldErrors(prev => ({ ...prev, [field]: res.error || '' }));
    } else {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const nameRes = validateFullName(name);
  const emailRes = validateEmail(email);
  const phoneRes = validatePhone(phone);
  const passwordRes = validatePassword(password);
  const confirmMatches = password.length > 0 && confirmPassword === password;

  const isFormValid = nameRes.isValid && emailRes.isValid && phoneRes.isValid && passwordRes.isValid && confirmMatches;

  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '#CBD5E1' };
    const criteria = getPasswordCriteria(pwd);
    let count = 0;
    if (criteria.minLength) count++;
    if (criteria.hasUpper) count++;
    if (criteria.hasLower) count++;
    if (criteria.hasNumber) count++;
    if (criteria.hasSpecial) count++;

    if (count <= 2) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (count <= 4) return { score: 2, label: 'Medium', color: '#F59E0B' };
    return { score: 3, label: 'Strong', color: '#10B981' };
  };

  const strength = calculatePasswordStrength(password);

  const handleRegister = async () => {
    setAuthError('');
    setFieldErrors({});
    setTouchedFields({
      name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    });

    const errors: Record<string, string> = {};
    if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;
    if (!emailRes.isValid && emailRes.error) errors.email = emailRes.error;
    if (!phoneRes.isValid && phoneRes.error) errors.phone = phoneRes.error;
    if (!passwordRes.isValid && passwordRes.error) errors.password = passwordRes.error;
    if (!confirmMatches) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: 'owner'
      });

      if (res.token && res.user) {
        setToken(res.token);
        onSuccessAuth(res.user, res.token);
      } else {
        throw new Error(res.message || 'Registration completed, please log in.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      setLoading(true);
      setAuthError('');
      const res = await api.googleLogin(idToken, 'owner');
      setToken(res.token);
      onSuccessAuth(res.user, res.token);
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      )}

      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.formTitle}>Create Account</Text>
        <Text style={styles.formSubtitle}>
          Sign up to manage your vehicles, bookings, and service records.
        </Text>
      </View>

      {authError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={THEME.error} />
          <Text style={styles.errorBannerText}>{authError}</Text>
        </View>
      ) : null}

      {/* Full Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <View
          style={[
            styles.inputContainer,
            focusedField === 'name' && styles.inputFocused,
            touchedFields.name && !nameRes.isValid && styles.inputError
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder="John Doe"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
            }}
            onFocus={() => setFocusedField('name')}
            onBlur={() => handleBlur('name')}
            autoCapitalize="words"
          />
        </View>
        {touchedFields.name && fieldErrors.name ? (
          <Text style={styles.fieldErrorText}>{fieldErrors.name}</Text>
        ) : null}
      </View>

      {/* Email Address */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <View
          style={[
            styles.inputContainer,
            focusedField === 'email' && styles.inputFocused,
            touchedFields.email && !emailRes.isValid && styles.inputError
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder="name@example.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
            }}
            onFocus={() => setFocusedField('email')}
            onBlur={() => handleBlur('email')}
          />
        </View>
        {touchedFields.email && fieldErrors.email ? (
          <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
        ) : null}
      </View>

      {/* Phone Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <View
          style={[
            styles.inputContainer,
            focusedField === 'phone' && styles.inputFocused,
            touchedFields.phone && !phoneRes.isValid && styles.inputError
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder="10-digit mobile number"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
            }}
            onFocus={() => setFocusedField('phone')}
            onBlur={() => handleBlur('phone')}
          />
        </View>
        {touchedFields.phone && fieldErrors.phone ? (
          <Text style={styles.fieldErrorText}>{fieldErrors.phone}</Text>
        ) : null}
      </View>

      {/* Password */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <View
          style={[
            styles.inputContainer,
            focusedField === 'password' && styles.inputFocused,
            touchedFields.password && !passwordRes.isValid && styles.inputError
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder="At least 8 characters"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
            }}
            onFocus={() => setFocusedField('password')}
            onBlur={() => handleBlur('password')}
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

        {/* Minimalist Live Password Strength Bar */}
        {password.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBarsRow}>
              <View style={[styles.strengthBar, { backgroundColor: strength.score >= 1 ? strength.color : '#E2E8F0' }]} />
              <View style={[styles.strengthBar, { backgroundColor: strength.score >= 2 ? strength.color : '#E2E8F0' }]} />
              <View style={[styles.strengthBar, { backgroundColor: strength.score >= 3 ? strength.color : '#E2E8F0' }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
          </View>
        )}

        {touchedFields.password && fieldErrors.password ? (
          <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
        ) : null}
      </View>

      {/* Confirm Password */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password</Text>
        <View
          style={[
            styles.inputContainer,
            focusedField === 'confirmPassword' && styles.inputFocused,
            touchedFields.confirmPassword && !confirmMatches && styles.inputError
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder="Re-enter your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
            }}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => handleBlur('confirmPassword')}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowConfirmPassword(p => !p)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>
        {touchedFields.confirmPassword && !confirmMatches && confirmPassword.length > 0 ? (
          <Text style={styles.fieldErrorText}>Passwords do not match</Text>
        ) : null}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, (!isFormValid || loading) && styles.submitButtonDisabled]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.submitButtonText}>Create Account</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Button */}
      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={(msg) => setAuthError(msg)}
        disabled={loading}
        label="Continue with Google"
      />

      {/* Footer Links */}
      <View style={styles.footerBox}>
        <TouchableOpacity style={styles.footerLink} onPress={onBackToLogin} activeOpacity={0.7}>
          <Text style={styles.footerLinkText}>
            Already have an account? <Text style={styles.footerLinkBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>

        {onSwitchToServiceCenter && (
          <TouchableOpacity style={styles.secondaryLink} onPress={onSwitchToServiceCenter} activeOpacity={0.7}>
            <Text style={styles.secondaryLinkText}>
              Registering as a service center? <Text style={styles.secondaryLinkBold}>Partner Sign up</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%'
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
    zIndex: 99
  },
  headerBox: {
    marginBottom: 24
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 6
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6
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
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
    backgroundColor: '#FFFBFB'
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
  fieldErrorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500'
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: 10
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600'
  },
  submitButton: {
    height: 46,
    backgroundColor: '#0046AD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  submitButtonDisabled: {
    opacity: 0.55
  },
  submitButtonText: {
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
