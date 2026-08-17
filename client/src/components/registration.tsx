import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { api, setToken } from '../services/api';
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validatePhone,
  getPasswordCriteria
} from '../utils/validation';
import BackButton from './ui/BackButton';
import GoogleSignInButton from './GoogleSignInButton';
import ServiceCenterRegisterNavigator from '../../screens/serviceCenter/ServiceCenterRegisterNavigator';

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

export interface RegistrationProps {
  initialRole?: 'owner' | 'service_center';
  onSuccessAuth: (user: any, token: string) => void;
  onPendingApproval: () => void;
  onBackToLogin: () => void;
}

export default function Registration({
  initialRole = 'owner',
  onSuccessAuth,
  onPendingApproval,
  onBackToLogin
}: RegistrationProps) {
  const [authRole, setAuthRole] = useState<'owner' | 'service_center' | 'admin'>(initialRole);

  useEffect(() => {
    if (initialRole) {
      setAuthRole(initialRole);
    }
  }, [initialRole]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Field validation & touched state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Service Center Registration Flow state
  const [showPartnerRegisterFlow, setShowPartnerRegisterFlow] = useState(false);
  const [googleAccountDetails, setGoogleAccountDetails] = useState<any>(null);

  const handleBlur = (field: 'name' | 'email' | 'password' | 'phone') => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    let res: { isValid: boolean; error?: string };
    if (field === 'name') res = validateFullName(name);
    else if (field === 'email') res = validateEmail(email);
    else if (field === 'password') res = validatePassword(password);
    else res = validatePhone(phone);

    if (!res.isValid && res.error) {
      const errMessage: string = res.error;
      setFieldErrors(prev => ({ ...prev, [field]: errMessage }));
    } else {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const nameRes = validateFullName(name);
  const emailRes = validateEmail(email);
  const passwordRes = validatePassword(password);
  const phoneRes = validatePhone(phone);

  const isFormValid = nameRes.isValid && emailRes.isValid && passwordRes.isValid && phoneRes.isValid;

  const validateAuthForm = () => {
    const errors: { [key: string]: string } = {};
    if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;
    if (!emailRes.isValid && emailRes.error) errors.email = emailRes.error;
    if (!passwordRes.isValid && passwordRes.error) errors.password = passwordRes.error;
    if (!phoneRes.isValid && phoneRes.error) errors.phone = phoneRes.error;
    return errors;
  };

  const handleRegister = async () => {
    setAuthError('');
    setFieldErrors({});
    setTouchedFields({ name: true, email: true, password: true, phone: true });

    const errors = validateAuthForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setAuthError('Please fix all form validation errors before submitting.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        role: authRole
      });

      if (res.status === 'pending_approval') {
        setToken(null);
        onPendingApproval();
        return;
      }

      setToken(res.token);
      onSuccessAuth(res.user, res.token);
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        const errMap: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          if (e.field) errMap[e.field] = e.message;
        });
        setFieldErrors(errMap);
        setAuthError('Validation failed on server. Please review the highlighted fields.');
      } else {
        setAuthError(err.message || 'Unable to register with these details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      setLoading(true);
      setAuthError('');
      const res = await api.googleLogin(idToken, authRole);

      if (authRole === 'service_center') {
        setGoogleAccountDetails({
          name: res.user?.name || name || 'Service Center Partner',
          email: res.user?.email || email,
          googleId: res.user?.googleId,
          phone: res.user?.phone || 'Not provided'
        });
        setShowPartnerRegisterFlow(true);
        return;
      }

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

  const renderLabelWithBadge = (title: string, isValid: boolean, isTouched?: boolean) => (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{title}</Text>
      {isValid && (isTouched || title === 'Password') ? (
        <View style={styles.validBadge}>
          <Text style={styles.validBadgeText}>✓ Valid</Text>
        </View>
      ) : null}
    </View>
  );

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
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME.accent} />
        </View>
      )}

      {showPartnerRegisterFlow ? (
        <ServiceCenterRegisterNavigator
          accountDetails={googleAccountDetails || { name: name.trim(), email: email.trim(), password, phone: phone.trim() }}
          onCancel={() => {
            setShowPartnerRegisterFlow(false);
            setGoogleAccountDetails(null);
          }}
          onFinish={() => {
            setShowPartnerRegisterFlow(false);
            setGoogleAccountDetails(null);
            setName('');
            setEmail('');
            setPassword('');
            setPhone('');
            setAuthRole('owner');
            setFieldErrors({});
            onBackToLogin();
          }}
        />
      ) : (
        <View style={styles.authCard}>
          <View style={{ marginBottom: 16, alignItems: 'flex-start' }}>
            <BackButton
              variant="card"
              label="Back to Login"
              onPress={onBackToLogin}
            />
          </View>

          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>🚗</Text>
            </View>
            <Text style={styles.logoText}>AutoDoc</Text>
          </View>

          <Text style={styles.authTitle}>Create your secure account</Text>
          <Text style={styles.authSubtitle}>Professional vehicle assessments at your fingertips.</Text>

          {/* Account Type Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, authRole === 'owner' && styles.toggleBtnActive]}
              onPress={() => { setAuthRole('owner'); setFieldErrors({}); setAuthError(''); }}
            >
              <Text style={[styles.toggleBtnText, authRole === 'owner' && styles.toggleBtnTextActive]}>Owner Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, authRole === 'service_center' && styles.toggleBtnActive]}
              onPress={() => { setAuthRole('service_center'); setFieldErrors({}); setAuthError(''); }}
            >
              <Text style={[styles.toggleBtnText, authRole === 'service_center' && styles.toggleBtnTextActive]}>Service Center Owner</Text>
            </TouchableOpacity>
          </View>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          {renderLabelWithBadge('Full Name', nameRes.isValid, touchedFields.name)}
          <TextInput
            style={[
              styles.input,
              touchedFields.name && nameRes.isValid && styles.inputValid,
              (fieldErrors.name || (touchedFields.name && !nameRes.isValid)) && styles.inputError
            ]}
            placeholder="John Doe"
            placeholderTextColor="#666"
            value={name}
            onBlur={() => handleBlur('name')}
            onChangeText={(val) => {
              setName(val);
              if (touchedFields.name) {
                const r = validateFullName(val);
                setFieldErrors(prev => ({ ...prev, name: r.error || '' }));
              }
            }}
          />
          {fieldErrors.name ? <Text style={styles.fieldErrorText}>⚠️ {fieldErrors.name}</Text> : null}

          {renderLabelWithBadge('Email Address', emailRes.isValid, touchedFields.email)}
          <TextInput
            style={[
              styles.input,
              touchedFields.email && emailRes.isValid && styles.inputValid,
              (fieldErrors.email || (touchedFields.email && !emailRes.isValid)) && styles.inputError
            ]}
            placeholder="name@example.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            // @ts-ignore
            name="email"
            value={email}
            onBlur={() => handleBlur('email')}
            onChangeText={(val) => {
              setEmail(val);
              if (touchedFields.email) {
                const r = validateEmail(val);
                setFieldErrors(prev => ({ ...prev, email: r.error || '' }));
              }
            }}
          />
          {fieldErrors.email ? <Text style={styles.fieldErrorText}>⚠️ {fieldErrors.email}</Text> : null}

          {renderLabelWithBadge('Password', passwordRes.isValid, touchedFields.password)}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.passwordInput,
                touchedFields.password && passwordRes.isValid && styles.inputValid,
                (fieldErrors.password || (touchedFields.password && !passwordRes.isValid)) && styles.inputError
              ]}
              placeholder="••••••••"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              textContentType="newPassword"
              // @ts-ignore
              name="new-password"
              value={password}
              onBlur={() => handleBlur('password')}
              onChangeText={(val) => {
                setPassword(val);
                if (touchedFields.password) {
                  const r = validatePassword(val);
                  setFieldErrors(prev => ({ ...prev, password: r.error || '' }));
                }
              }}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(p => !p)}>
              <Text style={styles.eyeBtnText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {fieldErrors.password ? <Text style={styles.fieldErrorText}>⚠️ {fieldErrors.password}</Text> : null}
          {renderPasswordChecklist(password)}

          {renderLabelWithBadge('Phone Number', phoneRes.isValid, touchedFields.phone)}
          <TextInput
            style={[
              styles.input,
              touchedFields.phone && phoneRes.isValid && styles.inputValid,
              (fieldErrors.phone || (touchedFields.phone && !phoneRes.isValid)) && styles.inputError
            ]}
            placeholder="9876543210"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onBlur={() => handleBlur('phone')}
            onChangeText={(val) => {
              const cleaned = val.replace(/\D/g, '').slice(0, 10);
              setPhone(cleaned);
              if (touchedFields.phone) {
                const r = validatePhone(cleaned);
                setFieldErrors(prev => ({ ...prev, phone: r.error || '' }));
              }
            }}
          />
          {fieldErrors.phone ? <Text style={styles.fieldErrorText}>⚠️ {fieldErrors.phone}</Text> : null}

          {authRole === 'owner' ? (
            <TouchableOpacity
              style={[styles.primaryButton, (!isFormValid || loading) && styles.disabledButton]}
              disabled={!isFormValid || loading}
              onPress={handleRegister}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryButtonText, !isFormValid && styles.disabledButtonText]}>
                Sign Up →
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, (!isFormValid || loading) && styles.disabledButton]}
              disabled={!isFormValid || loading}
              onPress={() => {
                setAuthError('');
                setTouchedFields({ name: true, email: true, password: true, phone: true });
                const errors = validateAuthForm();
                if (Object.keys(errors).length > 0) {
                  setFieldErrors(errors);
                  setAuthError('Please correct the highlighted errors below.');
                  return;
                }
                setShowPartnerRegisterFlow(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryButtonText, !isFormValid && styles.disabledButtonText]}>
                Next →
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchAuthContainer}
            onPress={onBackToLogin}
          >
            <Text style={styles.switchAuthText}>Already have an account? Log In</Text>
          </TouchableOpacity>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(msg) => setAuthError(msg)}
            disabled={loading}
            label="Sign up with Google"
          />
        </View>
      )}
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6
  },
  label: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600'
  },
  validBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  validBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700'
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#1E1E1E',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  inputValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4'
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
  },
  fieldErrorText: {
    color: THEME.error,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4
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
  passwordChecklistContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  passwordChecklistTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6
  },
  passwordChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3
  },
  passwordChecklistIcon: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  metIcon: {
    color: '#10B981'
  },
  unmetIcon: {
    color: '#94A3B8'
  },
  passwordChecklistText: {
    fontSize: 11
  },
  metText: {
    color: '#166534',
    fontWeight: '600'
  },
  unmetText: {
    color: '#64748B'
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
    backgroundColor: '#94A3B8'
  },
  disabledButtonText: {
    color: '#E2E8F0'
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
