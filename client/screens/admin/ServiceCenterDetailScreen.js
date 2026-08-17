import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../src/api/adminApi';
import BackButton from '../../src/components/ui/BackButton';

const THEME = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  inputBg: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  primaryLight: '#EEF2FF',
  primaryBorder: '#C7D2FE',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  buttonBg: '#F1F5F9',
};

export default function ServiceCenterDetailScreen({ centerId, onBack, onActionSuccess }) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [center, setCenter] = useState(null);

  // Rejection state
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getServiceCenterDetail(centerId);
      if (res.success) {
        setCenter(res.serviceCenter);
      } else {
        setError(res.message || 'Failed to fetch details');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while loading details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (centerId) {
      fetchDetail();
    }
  }, [centerId]);

  const handleApprove = async () => {
    setError('');
    setActionLoading(true);
    try {
      const res = await adminApi.updateApprovalStatus(centerId, 'approved');
      if (res.success) {
        if (Platform.OS === 'web') {
          alert('Service center approved successfully!');
        } else {
          Alert.alert('Success', 'Service center approved successfully!');
        }
        if (onActionSuccess) {
          onActionSuccess();
        } else {
          onBack();
        }
      } else {
        setError(res.message || 'Approval failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during approval');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    setError('');
    setActionLoading(true);
    try {
      const res = await adminApi.updateApprovalStatus(centerId, 'rejected', rejectionReason.trim());
      if (res.success) {
        if (Platform.OS === 'web') {
          alert('Service center rejected.');
        } else {
          Alert.alert('Success', 'Service center rejected successfully.');
        }
        if (onActionSuccess) {
          onActionSuccess();
        } else {
          onBack();
        }
      } else {
        setError(res.message || 'Rejection failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during rejection');
    } finally {
      setActionLoading(false);
    }
  };

  const resolveDocUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const host = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
    return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const isImageFile = (url) => {
    if (!url) return false;
    const extension = url.split('.').pop()?.toLowerCase();
    return extension && ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension);
  };

  const handleOpenDoc = async () => {
    const url = resolveDocUrl(center?.businessDocumentUrl);
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open document URL directly');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred trying to open the link');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Loading Workshop Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !center) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton variant="card" label="Back" onPress={onBack} />
          <Text style={styles.headerTitle}>Review Workshop</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchDetail}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!center) return null;

  const docUrl = resolveDocUrl(center.businessDocumentUrl);
  const docIsImage = isImageFile(center.businessDocumentUrl);
  const managerUser = center.manager || center.user || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
        
        {/* Header Bar */}
        <View style={styles.header}>
          <BackButton variant="card" label="Back" onPress={onBack} />
          <Text style={styles.headerTitle}>Review Workshop</Text>
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {/* Hero Workshop Banner Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.workshopIconCircle}>
              <Ionicons name="construct" size={24} color={THEME.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.businessName}>{center.businessName || 'Unnamed Workshop'}</Text>
              <Text style={styles.categorySubtext}>
                {center.businessType || center.category || 'Service Center Partner'}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>⏳ Pending</Text>
            </View>
          </View>
        </View>

        {/* Business Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBadge}>
            <Ionicons name="briefcase-outline" size={16} color={THEME.primary} />
            <Text style={styles.cardHeaderTitle}>Business Details</Text>
          </View>

          <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Registration Number</Text>
              <Text style={styles.valueHighlight}>
                {center.businessRegistrationNumber || 'Not provided (Optional)'}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.label}>Contact Person / Manager</Text>
              <View style={styles.valueRow}>
                <Ionicons name="person-outline" size={14} color={THEME.textSecondary} />
                <Text style={styles.value}>{center.contactPersonName || center.contactPerson || managerUser.name || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.label}>Business Email</Text>
              <View style={styles.valueRow}>
                <Ionicons name="mail-outline" size={14} color={THEME.textSecondary} />
                <Text style={styles.value}>{managerUser.email || center.email || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.valueRow}>
                <Ionicons name="call-outline" size={14} color={THEME.textSecondary} />
                <Text style={styles.value}>{managerUser.phone || center.phone || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBadge}>
            <Ionicons name="location-outline" size={16} color={THEME.primary} />
            <Text style={styles.cardHeaderTitle}>Location & Address</Text>
          </View>

          <View style={styles.addressBox}>
            <Ionicons name="map-outline" size={18} color={THEME.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressTitle}>Address</Text>
              <Text style={styles.addressText}>{center.businessAddress || center.address || 'Address not provided'}</Text>
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.colBox}>
              <Text style={styles.label}>City</Text>
              <Text style={styles.valueBold}>{center.city || 'N/A'}</Text>
            </View>
            <View style={styles.colBox}>
              <Text style={styles.label}>Pincode</Text>
              <Text style={styles.valueBold}>{center.pincode || 'N/A'}</Text>
            </View>
          </View>

          {center.operatingHours ? (
            <View style={styles.operatingHoursRow}>
              <Ionicons name="time-outline" size={14} color={THEME.primary} />
              <Text style={styles.operatingHoursText}>Operating Hours: <Text style={{ fontWeight: '700' }}>{center.operatingHours}</Text></Text>
            </View>
          ) : null}
        </View>

        {/* Services Offered Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBadge}>
            <Ionicons name="cog-outline" size={16} color={THEME.primary} />
            <Text style={styles.cardHeaderTitle}>Services Offered</Text>
          </View>

          <View style={styles.chipsContainer}>
            {center.servicesOffered && center.servicesOffered.length > 0 ? (
              center.servicesOffered.map((service, index) => (
                <View key={index} style={styles.serviceChip}>
                  <Ionicons name="checkmark-circle" size={14} color={THEME.primary} />
                  <Text style={styles.serviceChipText}>{service}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.value}>No services listed</Text>
            )}
          </View>
        </View>

        {/* Registration Proof Document Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBadge}>
            <Ionicons name="document-text-outline" size={16} color={THEME.primary} />
            <Text style={styles.cardHeaderTitle}>Registration Proof Document</Text>
          </View>

          {center.businessDocumentUrl ? (
            <View style={styles.documentContainer}>
              {docIsImage ? (
                <Image
                  source={{ uri: docUrl }}
                  style={styles.documentImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.docIconWrapper}>
                  <Ionicons name="folder-open-outline" size={40} color={THEME.primary} />
                  <Text style={styles.docFileText}>Business License / Certificate File</Text>
                </View>
              )}
              <TouchableOpacity style={styles.viewDocBtn} onPress={handleOpenDoc} activeOpacity={0.85}>
                <Ionicons name="open-outline" size={16} color={THEME.primary} />
                <Text style={styles.viewDocBtnText}>Open Document Link ↗</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noDocBox}>
              <Ionicons name="information-circle-outline" size={18} color={THEME.textSecondary} />
              <Text style={styles.noDocText}>No proof document uploaded (Optional)</Text>
            </View>
          )}
        </View>

        {/* Rejection Reason Form */}
        {showRejectionInput && (
          <View style={styles.rejectionCard}>
            <View style={styles.rejectionHeaderRow}>
              <Ionicons name="alert-circle" size={20} color={THEME.error} />
              <Text style={styles.rejectionCardTitle}>Decline Partner Registration</Text>
            </View>
            <Text style={styles.rejectionLabel}>Specify a reason for declining this request:</Text>
            <TextInput
              style={styles.rejectionInput}
              placeholder="e.g. Document image is blur, missing trade license info..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />
            
            <View style={styles.rejectionActions}>
              <TouchableOpacity
                style={[styles.smallBtn, styles.cancelSmallBtn]}
                onPress={() => {
                  setShowRejectionInput(false);
                  setRejectionReason('');
                  setError('');
                }}
                disabled={actionLoading}
              >
                <Text style={styles.cancelSmallBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallBtn, styles.confirmDeclineBtn]}
                onPress={handleDecline}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.confirmDeclineBtnText}>Confirm Decline</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Action Buttons */}
        {!showRejectionInput && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => setShowRejectionInput(true)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={18} color={THEME.error} />
              <Text style={styles.declineBtnText}>Decline Partner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={handleApprove}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.approveBtnText}>Approve Partner</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: Platform.OS === 'web' ? 8 : 12,
    position: 'relative'
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.3
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100
  },
  loadingText: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 12,
    fontWeight: '600'
  },
  errorText: {
    fontSize: 14,
    color: THEME.error,
    textAlign: 'center',
    marginBottom: 16
  },
  retryBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  errorBanner: {
    color: THEME.error,
    backgroundColor: THEME.errorLight,
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '600'
  },

  // Hero Card
  heroCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  workshopIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.primaryBorder
  },
  businessName: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.3
  },
  categorySubtext: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  statusBadge: {
    backgroundColor: THEME.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706'
  },

  // Cards
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  cardHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.primaryBorder
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  // Grid & Detail Rows
  gridContainer: {
    gap: 12
  },
  gridItem: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  label: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginBottom: 3
  },
  value: {
    fontSize: 14,
    color: THEME.text,
    fontWeight: '600'
  },
  valueHighlight: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '700'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  valueBold: {
    fontSize: 14,
    color: THEME.text,
    fontWeight: '700'
  },

  // Location Card
  addressBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 12
  },
  addressTitle: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginBottom: 2
  },
  addressText: {
    fontSize: 13,
    color: THEME.text,
    fontWeight: '700',
    lineHeight: 18
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10
  },
  colBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border
  },
  operatingHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.primaryLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.primaryBorder
  },
  operatingHoursText: {
    fontSize: 12,
    color: THEME.primary
  },

  // Services Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: THEME.primaryBorder
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.primary
  },

  // Document Card
  documentContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 4
  },
  documentImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF'
  },
  docIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16
  },
  docFileText: {
    fontSize: 13,
    color: THEME.text,
    fontWeight: '700',
    marginTop: 6
  },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    width: '100%'
  },
  viewDocBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primary
  },
  noDocBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border
  },
  noDocText: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500'
  },

  // Rejection Card
  rejectionCard: {
    backgroundColor: THEME.errorLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 16,
    marginBottom: 16
  },
  rejectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  rejectionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.error
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#991B1B',
    marginBottom: 10,
    fontWeight: '500'
  },
  rejectionInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: THEME.text,
    height: 80,
    textAlignVertical: 'top'
  },
  rejectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12
  },
  smallBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelSmallBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  cancelSmallBtnText: {
    color: THEME.textSecondary,
    fontSize: 13,
    fontWeight: '700'
  },
  confirmDeclineBtn: {
    backgroundColor: THEME.error
  },
  confirmDeclineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },

  // Bottom Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  declineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECACA'
  },
  declineBtnText: {
    color: THEME.error,
    fontSize: 14,
    fontWeight: '700'
  },
  approveBtn: {
    backgroundColor: THEME.primary,
    elevation: 2,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
