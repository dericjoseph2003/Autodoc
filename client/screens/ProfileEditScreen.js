import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '../src/api/profileApi';
import BackButton from '../src/components/ui/BackButton';

export default function ProfileEditScreen({ user, onSave, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states initialized with user's current values
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [alternateContactNumber, setAlternateContactNumber] = useState(user?.alternateContactNumber || '');

  const [emergencyName, setEmergencyName] = useState(user?.emergencyContact?.name || '');
  const [emergencyNumber, setEmergencyNumber] = useState(user?.emergencyContact?.number || '');

  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'English');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showNotificationOptions, setShowNotificationOptions] = useState(false);

  const [smsPref, setSmsPref] = useState(user?.notificationPreferences?.sms ?? true);
  const [pushPref, setPushPref] = useState(user?.notificationPreferences?.push ?? true);
  const [emailPref, setEmailPref] = useState(user?.notificationPreferences?.email ?? true);

  const languages = ['English', 'Spanish', 'Hindi', 'French', 'German', 'Arabic'];

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const updateData = {
        address,
        city,
        pincode,
        alternateContactNumber,
        emergencyContact: {
          name: emergencyName,
          number: emergencyNumber
        },
        preferredLanguage,
        notificationPreferences: {
          sms: smsPref,
          push: pushPref,
          email: emailPref
        }
      };

      const res = await profileApi.updateProfile(updateData);

      if (res.success) {
        if (Platform.OS === 'web') {
          alert('Profile updated successfully!');
        } else {
          Alert.alert('Success', 'Profile updated successfully!');
        }
        if (onSave) {
          onSave(res.user);
        }
      } else {
        setError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
      >
        {/* Top Header Banner */}
        <View style={styles.headerBanner}>
          <BackButton variant="card" label="Back" onPress={onCancel} />

          <View style={styles.headerTextCenter}>
            <Text style={styles.mainTitle}>Edit Profile</Text>
            <Text style={styles.subtitleText}>Update your details and preferences</Text>
          </View>

          {/* Top-Right Decorative Illustration Circle */}
          <View style={styles.illustrationCircle}>
            <View style={styles.illustrationBg}>
              <Ionicons name="document-text-outline" size={28} color="#0046AD" />
              <View style={styles.pencilBadge}>
                <Ionicons name="pencil" size={10} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* ---------------- Card 1: Contact & Address ---------------- */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIconBg, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="location-outline" size={22} color="#0046AD" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Contact & Address</Text>
              <Text style={styles.cardSubtitle}>Your primary contact and address details</Text>
            </View>
          </View>

          {/* Address */}
          <Text style={styles.inputLabel}>Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="home-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Street address, apartment, etc."
              placeholderTextColor="#94A3B8"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* City & Pincode (2-Column Row) */}
          <View style={styles.rowLayout}>
            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>City</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="City"
                  placeholderTextColor="#94A3B8"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Pincode</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="keypad-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Pincode"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={pincode}
                  onChangeText={setPincode}
                />
              </View>
            </View>
          </View>

          {/* Alternate Contact Number */}
          <Text style={styles.inputLabel}>Alternate Contact Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Alternate phone number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={alternateContactNumber}
              onChangeText={setAlternateContactNumber}
            />
          </View>
        </View>

        {/* ---------------- Card 2: Emergency Contact ---------------- */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIconBg, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Emergency Contact</Text>
              <Text style={styles.cardSubtitle}>Used in case of roadside assistance or critical breakdowns</Text>
            </View>
          </View>

          {/* Contact Name */}
          <Text style={styles.inputLabel}>Contact Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Emergency contact's name"
              placeholderTextColor="#94A3B8"
              value={emergencyName}
              onChangeText={setEmergencyName}
            />
          </View>

          {/* Contact Number */}
          <Text style={styles.inputLabel}>Contact Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Emergency contact's phone"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={emergencyNumber}
              onChangeText={setEmergencyNumber}
            />
          </View>
        </View>

        {/* ---------------- Card 3: App Preferences ---------------- */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardHeaderIconBg, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="settings-outline" size={22} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>App Preferences</Text>
              <Text style={styles.cardSubtitle}>Customize your app experience</Text>
            </View>
          </View>

          {/* Preferred Language */}
          <Text style={styles.inputLabel}>Preferred Language</Text>
          <TouchableOpacity
            style={styles.inputContainer}
            activeOpacity={0.7}
            onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
          >
            <Ionicons name="globe-outline" size={18} color="#64748B" style={styles.inputIcon} />
            <Text style={styles.inputText}>{preferredLanguage}</Text>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>

          {showLanguageDropdown && (
            <View style={styles.dropdownList}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.dropdownItem,
                    preferredLanguage === lang && styles.dropdownItemActive
                  ]}
                  onPress={() => {
                    setPreferredLanguage(lang);
                    setShowLanguageDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      preferredLanguage === lang && styles.dropdownItemTextActive
                    ]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Notification Preferences Toggle Row */}
          <TouchableOpacity
            style={[styles.inputContainer, { marginTop: 14, justifyContent: 'space-between' }]}
            activeOpacity={0.7}
            onPress={() => setShowNotificationOptions(!showNotificationOptions)}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>
                Notification Preferences
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                Manage how you receive updates and alerts
              </Text>
            </View>
            <Ionicons
              name={showNotificationOptions ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color="#64748B"
            />
          </TouchableOpacity>

          {showNotificationOptions && (
            <View style={styles.notificationOptionsBox}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>SMS Alerts</Text>
                <Switch
                  value={smsPref}
                  onValueChange={setSmsPref}
                  trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                  thumbColor={smsPref ? '#0046AD' : '#F1F5F9'}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Push Notifications</Text>
                <Switch
                  value={pushPref}
                  onValueChange={setPushPref}
                  trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                  thumbColor={pushPref ? '#0046AD' : '#F1F5F9'}
                />
              </View>

              <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.switchLabel}>Email Notifications</Text>
                <Switch
                  value={emailPref}
                  onValueChange={setEmailPref}
                  trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                  thumbColor={emailPref ? '#0046AD' : '#F1F5F9'}
                />
              </View>
            </View>
          )}
        </View>

        {/* ---------------- Action Buttons ---------------- */}
        <TouchableOpacity
          style={styles.primarySaveBtn}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.btnInnerRow}>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primarySaveBtnText}>Save Changes</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCancelBtn}
          activeOpacity={0.7}
          onPress={onCancel}
          disabled={loading}
        >
          <View style={styles.btnInnerRow}>
            <Ionicons name="close" size={18} color="#0046AD" />
            <Text style={styles.secondaryCancelBtnText}>Cancel</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    alignItems: 'center'
  },

  /* Header Banner */
  headerBanner: {
    width: '100%',
    maxWidth: 720,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8
  },
  backBtnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A'
  },
  headerTextCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
    textAlign: 'center'
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center'
  },
  illustrationCircle: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center'
  },
  illustrationBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  pencilBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0046AD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },

  errorBanner: {
    width: '100%',
    maxWidth: 720,
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

  /* Card Layouts */
  cardContainer: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  cardHeaderIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },

  /* Form Fields */
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10
  },
  inputContainer: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  inputIcon: {
    marginRight: 8
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500'
  },
  inputText: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500'
  },
  rowLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  },
  fieldColumn: {
    flex: 1,
    minWidth: 140
  },

  /* Dropdown Styles */
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF'
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155'
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: '#0046AD'
  },

  /* Notification Box */
  notificationOptionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  switchLabel: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500'
  },

  /* Buttons */
  primarySaveBtn: {
    width: '100%',
    maxWidth: 720,
    height: 50,
    backgroundColor: '#0046AD',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    shadowColor: '#0046AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  primarySaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  secondaryCancelBtn: {
    width: '100%',
    maxWidth: 720,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryCancelBtnText: {
    color: '#0046AD',
    fontSize: 15,
    fontWeight: '600'
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  }
});
