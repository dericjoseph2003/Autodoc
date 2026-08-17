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
import { adminApi } from '../../src/api/adminApi';
import BackButton from '../../src/components/ui/BackButton';

const THEME = {
  background: '#F4F6F9',      // Premium light grey/blue from Autodoc
  card: '#FFFFFF',            // Pure white card background
  border: '#E2E8F0',          // Soft light slate border
  inputBg: '#EEF2F6',         // Muted input background
  text: '#0F172A',            // Charcoal/Navy text from Autodoc
  textSecondary: '#64748B',   // Slate grey subtext
  primary: '#0046AD',         // Deep Royal Blue from Autodoc
  accent: '#F5A524',          // Amber accent
  accentLight: '#FEF3C7',
  success: '#10B981',
  error: '#EF4444',
  buttonBg: '#EEF2F6',
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
    const extension = url.split('.').pop().toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension);
  };

  const handleOpenDoc = async () => {
    const url = resolveDocUrl(center?.businessDocumentUrl);
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported || Platform.OS === 'web') {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', "Cannot open document URL directly");
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', "An error occurred trying to open the link");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.accent} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !center) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton variant="card" label="Back" onPress={onBack} />
          <Text style={styles.headerTitle}>Review Center</Text>
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
        <View style={styles.header}>
          <BackButton variant="card" label="Back" onPress={onBack} />
          <Text style={styles.headerTitle}>Review Workshop</Text>
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {/* Business Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>🛠️ Business Details</Text>
          <Text style={styles.businessName}>{center.businessName}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Registration Number</Text>
            <Text style={styles.value}>{center.businessRegistrationNumber}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Contact Person</Text>
            <Text style={styles.value}>{center.contactPersonName || center.contactPerson || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>{managerUser.email || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Phone Number</Text>
            <Text style={styles.value}>{managerUser.phone || 'N/A'}</Text>
          </View>
        </View>

        {/* Address Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>📍 Location</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{center.businessAddress || center.address}</Text>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City</Text>
              <Text style={styles.value}>{center.city}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.label}>Pincode</Text>
              <Text style={styles.value}>{center.pincode}</Text>
            </View>
          </View>
        </View>

        {/* Services Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>⚙️ Services Offered</Text>
          <View style={styles.chipsContainer}>
            {center.servicesOffered && center.servicesOffered.length > 0 ? (
              center.servicesOffered.map((service, index) => (
                <View key={index} style={styles.chip}>
                  <Text style={styles.chipText}>{service}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.value}>No services listed</Text>
            )}
          </View>
        </View>

        {/* Document Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>📄 Registration Proof Document</Text>
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
                  <Text style={styles.docLargeIcon}>📁</Text>
                  <Text style={styles.docFileText}>Document (PDF / File)</Text>
                </View>
              )}
              <TouchableOpacity style={styles.viewDocBtn} onPress={handleOpenDoc}>
                <Text style={styles.viewDocBtnText}>Open Document Link ↗</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.value}>No proof document uploaded</Text>
          )}
        </View>

        {/* Rejection Reason Form */}
        {showRejectionInput && (
          <View style={styles.rejectionCard}>
            <Text style={styles.rejectionCardTitle}>Decline Registration</Text>
            <Text style={styles.rejectionLabel}>Provide a reason for declining this request</Text>
            <TextInput
              style={styles.rejectionInput}
              placeholder="e.g. Document upload is blur, incorrect registration number"
              placeholderTextColor="#888"
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

        {/* Action Buttons */}
        {!showRejectionInput && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => setShowRejectionInput(true)}
              disabled={actionLoading}
            >
              <Text style={styles.declineBtnText}>Decline Partner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={handleApprove}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.approveBtnText}>Approve Partner</Text>
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
    paddingBottom: 50
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 12,
    position: 'relative'
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border
  },
  backBtnText: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: 'bold'
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text
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
    marginTop: 12
  },
  errorText: {
    fontSize: 14,
    color: THEME.error,
    textAlign: 'center',
    marginBottom: 16
  },
  retryBtn: {
    backgroundColor: THEME.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  errorBanner: {
    color: THEME.error,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '500'
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 16
  },
  detailRow: {
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginBottom: 4
  },
  value: {
    fontSize: 14,
    color: THEME.text,
    fontWeight: '500'
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  chip: {
    backgroundColor: THEME.buttonBg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: THEME.border
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.text
  },
  documentContainer: {
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    padding: 16,
    marginTop: 4
  },
  documentImage: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: '#FFFFFF'
  },
  docIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20
  },
  docLargeIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  docFileText: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: 'bold'
  },
  viewDocBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center'
  },
  viewDocBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.text
  },
  rejectionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    marginBottom: 16
  },
  rejectionCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: 10
  },
  rejectionInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
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
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelSmallBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  cancelSmallBtnText: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: 'bold'
  },
  confirmDeclineBtn: {
    backgroundColor: THEME.error
  },
  confirmDeclineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  declineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border
  },
  declineBtnText: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: 'bold'
  },
  approveBtn: {
    backgroundColor: THEME.primary
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
