import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validatePhone,
  getPasswordCriteria
} from '../../utils/validation';

const THEME = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderFocus: '#16A34A',
  inputBg: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#16A34A',
  primaryDark: '#15803D',
  error: '#EF4444'
};

const WORKSHOP_CATEGORIES = [
  'Multi-brand Car Workshop',
  'Authorized Brand Service Center',
  'Two-Wheeler Workshop',
  'Detailing & Wash',
  'Towing & Roadside Partner'
];

const AVAILABLE_SERVICES = [
  'General Maintenance',
  'Engine Diagnostics',
  'Brake Service',
  'Tyres & Alignment',
  'Battery & Electrical',
  'Bodywork & Paint',
  'Detailing & Wash',
  'Roadside Assistance'
];

const OPERATING_HOUR_PRESETS = [
  '9:00 AM - 6:00 PM',
  '8:00 AM - 8:00 PM',
  '9:00 AM - 9:00 PM',
  '24 Hours Open'
];

export interface ServiceCenterRegisterProps {
  onPendingApproval: () => void;
  onBackToLogin: () => void;
  onSwitchToOwner?: () => void;
}

export default function ServiceCenterRegister({
  onPendingApproval,
  onBackToLogin,
  onSwitchToOwner
}: ServiceCenterRegisterProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Account Credentials
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Workshop & Location
  const [businessName, setBusinessName] = useState('');
  const [workshopCategory, setWorkshopCategory] = useState(WORKSHOP_CATEGORIES[0]);
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [operatingHours, setOperatingHours] = useState('9:00 AM - 6:00 PM');

  // Step 3: Services & Verification
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'General Maintenance',
    'Engine Diagnostics',
    'Brake Service'
  ]);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);

  // Focus & State
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<any>(null);

  // Step 1 Validation
  const contactNameRes = validateFullName(contactName);
  const emailRes = validateEmail(email);
  const phoneRes = validatePhone(phone);
  const passwordRes = validatePassword(password);
  const confirmMatches = password.length > 0 && confirmPassword === password;

  const isStep1Valid = contactNameRes.isValid && emailRes.isValid && phoneRes.isValid && passwordRes.isValid && confirmMatches;

  // Step 2 Validation
  const isStep2Valid =
    businessName.trim().length >= 2 &&
    businessAddress.trim().length >= 5 &&
    city.trim().length >= 2 &&
    pincode.trim().length === 6 &&
    !isNaN(Number(pincode));

  // Step 3 Validation
  const isStep3Valid = selectedServices.length > 0;

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      if (selectedServices.length > 1) {
        setSelectedServices(prev => prev.filter(s => s !== serviceId));
      }
    } else {
      setSelectedServices(prev => [...prev, serviceId]);
    }
  };

  const handleDocumentPick = () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      Alert.alert(
        'Upload License / Certificate',
        'Attach your trade license or GST certificate for account verification.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Upload',
            onPress: () => setUploadedDocName('workshop_license.pdf')
          }
        ]
      );
    }
  };

  const handleWebFileSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedDocName(file.name);
    }
  };

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

  const handleNextStep1 = () => {
    setAuthError('');
    setTouchedFields(prev => ({
      ...prev,
      contactName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    }));

    if (!isStep1Valid) {
      setAuthError('Please complete all account fields correctly.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setAuthError('');
    setTouchedFields(prev => ({
      ...prev,
      businessName: true,
      businessAddress: true,
      city: true,
      pincode: true
    }));

    if (!isStep2Valid) {
      setAuthError('Please complete all workshop location details.');
      return;
    }
    setStep(3);
  };

  const handleNextStep3 = () => {
    setAuthError('');
    if (!isStep3Valid) {
      setAuthError('Please select at least one service offered.');
      return;
    }
    setStep(4);
  };

  const handleFinalSubmit = async () => {
    setAuthError('');
    try {
      setLoading(true);

      const payload = {
        name: contactName.trim(),
        user_full_name: contactName.trim(),
        contactPersonName: contactName.trim(),
        email: email.trim().toLowerCase(),
        user_email: email.trim().toLowerCase(),
        phone: phone.trim(),
        user_phone_number: phone.trim(),
        password,
        role: 'service_center',
        user_role: 'service_center',
        businessName: businessName.trim(),
        service_center_name: businessName.trim(),
        businessAddress: businessAddress.trim(),
        service_center_address: businessAddress.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        servicesOffered: selectedServices,
        operatingHours: operatingHours || '9:00 AM - 6:00 PM',
        businessRegistrationNumber: registrationNumber ? registrationNumber.trim() : '',
        businessDocumentUrl: uploadedDocName ? `/uploads/${uploadedDocName}` : '/uploads/mock_business_license.pdf'
      };

      const res = await api.register(payload);
      if (res.status === 'pending_approval') {
        onPendingApproval();
      } else {
        onPendingApproval();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Partner Account';
      case 2:
        return 'Workshop Details';
      case 3:
        return 'Services & Docs';
      case 4:
        return 'Review & Submit';
    }
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleWebFileSelect}
          accept=".pdf,.png,.jpg,.jpeg"
        />
      )}

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      )}

      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.formTitle}>Register Service Center</Text>
        <Text style={styles.formSubtitle}>
          Step {step} of 4 • {getStepTitle()}
        </Text>

        {/* Minimal Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
      </View>

      {authError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={THEME.error} />
          <Text style={styles.errorBannerText}>{authError}</Text>
        </View>
      ) : null}

      {/* ================= STEP 1 ================= */}
      {step === 1 && (
        <View>
          {/* Contact Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Person / Manager</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'contactName' && styles.inputFocused,
                touchedFields.contactName && !contactNameRes.isValid && styles.inputError
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder="Full name"
                placeholderTextColor="#94A3B8"
                value={contactName}
                onChangeText={setContactName}
                onFocus={() => setFocusedField('contactName')}
                onBlur={() => {
                  setFocusedField(null);
                  setTouchedFields(prev => ({ ...prev, contactName: true }));
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Email</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'email' && styles.inputFocused,
                touchedFields.email && !emailRes.isValid && styles.inputError
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder="workshop@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => {
                  setFocusedField(null);
                  setTouchedFields(prev => ({ ...prev, email: true }));
                }}
              />
            </View>
          </View>

          {/* Phone */}
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
                onChangeText={setPhone}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => {
                  setFocusedField(null);
                  setTouchedFields(prev => ({ ...prev, phone: true }));
                }}
              />
            </View>
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
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => {
                  setFocusedField(null);
                  setTouchedFields(prev => ({ ...prev, password: true }));
                }}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(p => !p)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

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
                placeholder="Re-enter password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => {
                  setFocusedField(null);
                  setTouchedFields(prev => ({ ...prev, confirmPassword: true }));
                }}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(p => !p)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Continue */}
          <TouchableOpacity
            style={[styles.primaryButton, !isStep1Valid && styles.buttonDisabled]}
            onPress={handleNextStep1}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Continue to Workshop Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= STEP 2 ================= */}
      {step === 2 && (
        <View>
          {/* Workshop Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Workshop / Service Center Name</Text>
            <View
              style={[
                styles.inputContainer,
                focusedField === 'businessName' && styles.inputFocused,
                touchedFields.businessName && businessName.trim().length < 2 && styles.inputError
              ]}
            >
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Apex Auto Works"
                placeholderTextColor="#94A3B8"
                value={businessName}
                onChangeText={setBusinessName}
                onFocus={() => setFocusedField('businessName')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Workshop Category</Text>
            <View style={styles.chipsWrap}>
              {WORKSHOP_CATEGORIES.map(cat => {
                const isActive = workshopCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.pillChip, isActive && styles.pillChipActive]}
                    onPress={() => setWorkshopCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillChipText, isActive && styles.pillChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Street Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address & Landmark</Text>
            <View
              style={[
                styles.inputContainer,
                { height: 56, alignItems: 'flex-start', paddingTop: 6 },
                focusedField === 'businessAddress' && styles.inputFocused,
                touchedFields.businessAddress && businessAddress.trim().length < 5 && styles.inputError
              ]}
            >
              <TextInput
                style={[styles.textInput, { height: 44, textAlignVertical: 'top' }]}
                placeholder="Plot / Street address"
                placeholderTextColor="#94A3B8"
                multiline
                value={businessAddress}
                onChangeText={setBusinessAddress}
                onFocus={() => setFocusedField('businessAddress')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* City & Pincode */}
          <View style={styles.twoColRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>City</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'city' && styles.inputFocused,
                  touchedFields.city && city.trim().length < 2 && styles.inputError
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="City"
                  placeholderTextColor="#94A3B8"
                  value={city}
                  onChangeText={setCity}
                  onFocus={() => setFocusedField('city')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Pincode</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'pincode' && styles.inputFocused,
                  touchedFields.pincode && pincode.trim().length !== 6 && styles.inputError
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="6 digits"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={6}
                  value={pincode}
                  onChangeText={setPincode}
                  onFocus={() => setFocusedField('pincode')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </View>

          {/* Operating Hours */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Hours</Text>
            <View style={styles.chipsWrap}>
              {OPERATING_HOUR_PRESETS.map(hrs => {
                const isActive = operatingHours === hrs;
                return (
                  <TouchableOpacity
                    key={hrs}
                    style={[styles.pillChip, isActive && styles.pillChipActive]}
                    onPress={() => setOperatingHours(hrs)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillChipText, isActive && styles.pillChipTextActive]}>
                      {hrs}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Nav Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={16} color="#0F172A" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }, !isStep2Valid && styles.buttonDisabled]}
              onPress={handleNextStep2}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Next: Services & Docs</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================= STEP 3 ================= */}
      {step === 3 && (
        <View>
          {/* Services */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Services Offered</Text>
            <View style={styles.chipsWrap}>
              {AVAILABLE_SERVICES.map(svc => {
                const isSelected = selectedServices.includes(svc);
                return (
                  <TouchableOpacity
                    key={svc}
                    style={[styles.servicePill, isSelected && styles.servicePillSelected]}
                    onPress={() => toggleService(svc)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.servicePillText, isSelected && styles.servicePillTextSelected]}>
                      {svc}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={13} color="#15803D" style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* GST / Registration */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>GSTIN / Business Registration (Optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 27AAAAA0000A1Z5"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
              />
            </View>
          </View>

          {/* Document Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Workshop Document / Trade License</Text>
            <TouchableOpacity
              style={[styles.uploadBox, uploadedDocName && styles.uploadBoxDone]}
              onPress={handleDocumentPick}
              activeOpacity={0.7}
            >
              <Ionicons
                name={uploadedDocName ? 'checkmark-circle' : 'cloud-upload-outline'}
                size={20}
                color={uploadedDocName ? '#15803D' : '#64748B'}
              />
              <Text style={[styles.uploadBoxText, uploadedDocName && styles.uploadBoxTextDone]}>
                {uploadedDocName || 'Upload license or certificate (PDF/Image)'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nav Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={16} color="#0F172A" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }, !isStep3Valid && styles.buttonDisabled]}
              onPress={handleNextStep3}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Review & Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================= STEP 4 ================= */}
      {step === 4 && (
        <View>
          {/* Summary Table */}
          <View style={styles.summaryTable}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Workshop</Text>
              <Text style={styles.summaryVal}>{businessName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Category</Text>
              <Text style={styles.summaryVal}>{workshopCategory}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Contact Person</Text>
              <Text style={styles.summaryVal}>{contactName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Email</Text>
              <Text style={styles.summaryVal}>{email}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Phone</Text>
              <Text style={styles.summaryVal}>{phone}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Location</Text>
              <Text style={styles.summaryVal}>{city}, {pincode}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Operating Hours</Text>
              <Text style={styles.summaryVal}>{operatingHours}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryKey}>Services</Text>
              <Text style={styles.summaryVal}>{selectedServices.join(', ')}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(3)} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={16} color="#0F172A" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }, loading && styles.buttonDisabled]}
              onPress={handleFinalSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Submit for Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Footer Link */}
      <View style={styles.footerBox}>
        <TouchableOpacity style={styles.footerLink} onPress={onBackToLogin} activeOpacity={0.7}>
          <Text style={styles.footerLinkText}>
            Already registered? <Text style={styles.footerLinkBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>

        {onSwitchToOwner && (
          <TouchableOpacity style={styles.secondaryLink} onPress={onSwitchToOwner} activeOpacity={0.7}>
            <Text style={styles.secondaryLinkText}>
              Looking for vehicle owner account? <Text style={styles.secondaryLinkBold}>Owner Sign up</Text>
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
    marginBottom: 20
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#16A34A',
    borderRadius: 2
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
    marginBottom: 14
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
    borderColor: '#16A34A',
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
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  pillChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  pillChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A'
  },
  pillChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500'
  },
  pillChipTextActive: {
    color: '#15803D',
    fontWeight: '700'
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  servicePillSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A'
  },
  servicePillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500'
  },
  servicePillTextSelected: {
    color: '#15803D',
    fontWeight: '700'
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 46,
    gap: 10
  },
  uploadBoxDone: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
    borderStyle: 'solid'
  },
  uploadBoxText: {
    fontSize: 13,
    color: '#64748B'
  },
  uploadBoxTextDone: {
    color: '#15803D',
    fontWeight: '600'
  },
  summaryTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    marginBottom: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  summaryKey: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  summaryVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#EEF2F6',
    justifyContent: 'center'
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  primaryButton: {
    height: 46,
    backgroundColor: '#16A34A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
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
    color: '#16A34A',
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
    color: '#16A34A',
    fontWeight: '600'
  }
});
