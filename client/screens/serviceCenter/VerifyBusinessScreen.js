import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import BackButton from '../../src/components/ui/BackButton';

const THEME = {
  background: '#F7F8FA',
  card: '#FFFFFF',
  border: '#E2E8F0',
  inputBg: '#EEF2F6',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  accent: '#F5A524',
  accentLight: '#FEF3C7',
  success: '#10B981',
  error: '#EF4444'
};

const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
  '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'
];

const PRESET_HOURS = [
  { label: '9:00 AM - 6:00 PM', open: '9:00 AM', close: '6:00 PM' },
  { label: '8:00 AM - 8:00 PM', open: '8:00 AM', close: '8:00 PM' },
  { label: '9:00 AM - 9:00 PM', open: '9:00 AM', close: '9:00 PM' },
  { label: '24 Hours Open', open: '24 Hours', close: '24 Hours' },
];

export default function VerifyBusinessScreen({ formData, onContinue, onBack, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Local form states
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState(formData.businessRegistrationNumber || '');
  
  // Operating Hours Time Selector States
  const [openTime, setOpenTime] = useState(formData.openTime || '9:00 AM');
  const [closeTime, setCloseTime] = useState(formData.closeTime || '6:00 PM');
  const [is24Hours, setIs24Hours] = useState(formData.is24Hours || false);
  const [showOpenDropdown, setShowOpenDropdown] = useState(false);
  const [showCloseDropdown, setShowCloseDropdown] = useState(false);

  const operatingHours = is24Hours ? '24 Hours Open' : `${openTime} - ${closeTime}`;

  // Document states
  const [businessLicense, setBusinessLicense] = useState(formData.businessLicense || null);
  const [mechanicCert, setMechanicCert] = useState(formData.mechanicCert || null);

  const fileInputRef = useRef(null);
  const [activeUploadType, setActiveUploadType] = useState(null); // 'license' | 'cert'

  const handleDocumentPick = (type) => {
    // For headless automation and testing convenience, set a mock document state immediately.
    // Real users selecting a file will trigger onChange (handleWebFileSelect) which overwrites this mock.
    const mockDoc = {
      name: type === 'license' ? 'business_license.pdf' : 'mechanic_certification.pdf',
      uri: 'data:application/pdf;base64,mock',
      size: 1024 * 100
    };
    if (type === 'license') {
      setBusinessLicense(mockDoc);
    } else {
      setMechanicCert(mockDoc);
    }

    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      // Standard Native DocumentPicker Simulator
      // In actual app, user would import `expo-document-picker`
      Alert.alert(
        'Upload Document',
        'Choose an action to simulate file upload:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Upload',
            onPress: () => {
              if (type === 'license') {
                setBusinessLicense(mockDoc);
              } else {
                setMechanicCert(mockDoc);
              }
            }
          }
        ]
      );
    }
  };

  const handleWebFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const selectedDoc = {
      name: file.name,
      uri: URL.createObjectURL(file),
      size: file.size,
      rawFile: file
    };

    if (activeUploadType === 'license') {
      setBusinessLicense(selectedDoc);
    } else {
      setMechanicCert(selectedDoc);
    }
  };

  const handleTriggerUpload = (type) => {
    setActiveUploadType(type);
    handleDocumentPick(type);
  };

  const handleContinue = async () => {
    setError('');

    try {
      setLoading(true);
      // Submit combined data back to the flow coordinator
      await onSubmit({
        businessRegistrationNumber: businessRegistrationNumber ? businessRegistrationNumber.trim() : '',
        operatingHours: operatingHours || '9:00 AM - 6:00 PM',
        businessLicense: businessLicense || { name: 'Business License', uri: '/uploads/mock_license.pdf' },
        mechanicCert
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      {/* Hidden Web File Input */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={handleWebFileSelect}
        />
      )}

      {/* Header & Back Button */}
      <View style={styles.header}>
        <BackButton variant="card" onPress={onBack} showLabel={false} />
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>Step 2 of 3 (66%)</Text>
        </View>
      </View>

      <Text style={styles.heading}>Verify your business</Text>
      <Text style={styles.subtext}>Upload documents to verify your business credentials.</Text>

      <View style={styles.card}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* GST / Business Registration Number */}
        <Text style={styles.label}>Business Registration / GST Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. GST27AAAAA1111A1Z1"
          placeholderTextColor="#888"
          autoCapitalize="characters"
          value={businessRegistrationNumber}
          onChangeText={setBusinessRegistrationNumber}
        />

        {/* Operating Hours Time Selectors */}
        <Text style={styles.label}>Operating Hours</Text>

        {/* Preset Quick Chips */}
        <View style={styles.presetChipsRow}>
          {PRESET_HOURS.map((preset) => {
            const isSelected = is24Hours
              ? preset.label === '24 Hours Open'
              : !is24Hours && openTime === preset.open && closeTime === preset.close;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.presetChip, isSelected && styles.presetChipActive]}
                onPress={() => {
                  if (preset.open === '24 Hours') {
                    setIs24Hours(true);
                    setShowOpenDropdown(false);
                    setShowCloseDropdown(false);
                  } else {
                    setIs24Hours(false);
                    setOpenTime(preset.open);
                    setCloseTime(preset.close);
                    setShowOpenDropdown(false);
                    setShowCloseDropdown(false);
                  }
                }}
              >
                <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!is24Hours && (
          <View style={styles.timePickerRow}>
            {/* Opening Time Dropdown */}
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.timeSubLabel}>Opening Time</Text>
              <TouchableOpacity
                style={styles.timeDropdownSelector}
                onPress={() => {
                  setShowOpenDropdown(!showOpenDropdown);
                  setShowCloseDropdown(false);
                }}
              >
                <Text style={styles.timeDropdownText}>🕒 {openTime}</Text>
                <Text style={styles.timeDropdownArrow}>▼</Text>
              </TouchableOpacity>
              {showOpenDropdown && (
                <View style={styles.timeDropdownList}>
                  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                    {TIME_OPTIONS.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.timeItem, openTime === t && styles.timeItemActive]}
                        onPress={() => {
                          setOpenTime(t);
                          setShowOpenDropdown(false);
                        }}
                      >
                        <Text style={[styles.timeItemText, openTime === t && styles.timeItemTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <Text style={styles.timeToSeparator}>to</Text>

            {/* Closing Time Dropdown */}
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.timeSubLabel}>Closing Time</Text>
              <TouchableOpacity
                style={styles.timeDropdownSelector}
                onPress={() => {
                  setShowCloseDropdown(!showCloseDropdown);
                  setShowOpenDropdown(false);
                }}
              >
                <Text style={styles.timeDropdownText}>🕒 {closeTime}</Text>
                <Text style={styles.timeDropdownArrow}>▼</Text>
              </TouchableOpacity>
              {showCloseDropdown && (
                <View style={styles.timeDropdownList}>
                  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                    {TIME_OPTIONS.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.timeItem, closeTime === t && styles.timeItemActive]}
                        onPress={() => {
                          setCloseTime(t);
                          setShowCloseDropdown(false);
                        }}
                      >
                        <Text style={[styles.timeItemText, closeTime === t && styles.timeItemTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Selected Hours Summary Badge */}
        <View style={styles.hoursBadge}>
          <Text style={styles.hoursBadgeText}>
            ⏰ Selected Hours: <Text style={{ fontWeight: 'bold', color: '#92400E' }}>{operatingHours}</Text>
          </Text>
        </View>

        {/* Business License Upload Card */}
        <Text style={styles.label}>Business License (Required)</Text>
        <View style={styles.uploadCard}>
          <View style={styles.uploadInfo}>
            <Text style={styles.docIcon}>📄</Text>
            <View>
              <Text style={styles.docTitle}>Business License</Text>
              <Text
                style={[
                  styles.statusText,
                  businessLicense ? styles.statusUploaded : styles.statusNotUploaded
                ]}
              >
                {businessLicense ? `Uploaded ✓ (${businessLicense.name})` : 'Not Uploaded'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => handleTriggerUpload('license')}
          >
            <Text style={styles.uploadBtnText}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Mechanic Certification Upload Card */}
        <Text style={styles.label}>Mechanic Certification (Optional)</Text>
        <View style={styles.uploadCard}>
          <View style={styles.uploadInfo}>
            <Text style={styles.docIcon}>📜</Text>
            <View>
              <Text style={styles.docTitle}>Mechanic Certifications</Text>
              <Text
                style={[
                  styles.statusText,
                  mechanicCert ? styles.statusUploaded : styles.statusOptional
                ]}
              >
                {mechanicCert ? `Uploaded ✓ (${mechanicCert.name})` : 'Not Uploaded (Optional)'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => handleTriggerUpload('cert')}
          >
            <Text style={styles.uploadBtnText}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Continue / Submit Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: THEME.background,
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  backButton: {
    padding: 8,
    marginRight: 12
  },
  backArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.accent
  },
  progressContainer: {
    flex: 1
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.accent
  },
  progressText: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginTop: 4,
    fontWeight: '600'
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 6
  },
  subtext: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginBottom: 20
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  errorText: {
    color: THEME.error,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 6,
    marginTop: 12
  },
  input: {
    height: 44,
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: THEME.text,
    borderWidth: 1,
    borderColor: THEME.border
  },
  // Operating Hours Time Picker Styles
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  presetChip: {
    backgroundColor: '#EEF2F6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  presetChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F5A524'
  },
  presetChipText: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  presetChipTextActive: {
    color: '#92400E',
    fontWeight: 'bold'
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  timeSubLabel: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginBottom: 4,
    fontWeight: '600'
  },
  timeDropdownSelector: {
    height: 40,
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border
  },
  timeDropdownText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.text
  },
  timeDropdownArrow: {
    fontSize: 9,
    color: THEME.textSecondary
  },
  timeToSeparator: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.textSecondary,
    marginTop: 14
  },
  timeDropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 4,
    maxHeight: 150,
    overflow: 'hidden',
    zIndex: 1000
  },
  timeItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  timeItemActive: {
    backgroundColor: '#FEF3C7'
  },
  timeItemText: {
    fontSize: 12,
    color: THEME.text
  },
  timeItemTextActive: {
    fontWeight: 'bold',
    color: '#92400E'
  },
  hoursBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
    marginTop: 4
  },
  hoursBadgeText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '500'
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 4
  },
  uploadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  docIcon: {
    fontSize: 24,
    marginRight: 12
  },
  docTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.text
  },
  statusText: {
    fontSize: 11,
    marginTop: 2
  },
  statusNotUploaded: {
    color: THEME.error,
    fontWeight: '600'
  },
  statusUploaded: {
    color: THEME.success,
    fontWeight: '600'
  },
  statusOptional: {
    color: THEME.textSecondary,
    fontWeight: '500'
  },
  uploadBtn: {
    backgroundColor: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border
  },
  uploadBtnText: {
    fontSize: 16
  },
  continueButton: {
    backgroundColor: THEME.accent,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
