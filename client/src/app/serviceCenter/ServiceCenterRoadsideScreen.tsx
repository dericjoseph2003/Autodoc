import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import BackButton from '../../components/ui/BackButton';

const THEME = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  primaryLight: '#EEF2FF',
  primaryBorder: '#C7D2FE',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2'
};

export default function ServiceCenterRoadsideScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'resolved'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRoadside = async () => {
    try {
      setLoading(true);
      const res = await api.listRoadsideRequests();
      setRequests(res.requests || []);
    } catch (err) {
      console.error('Failed to load roadside requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadside();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await api.updateRoadsideStatus(id, newStatus);
      setRequests(prev =>
        prev.map(r => (r._id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      console.error('Failed to update status:', err);
      Alert.alert('Status Error', err.message || 'Failed to update rescue status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>

        {/* Top Header */}
        <View style={styles.headerRow}>
          <BackButton variant="card" label="Dashboard" onPress={onBack} />
          <Text style={styles.headerTitle}>Roadside Rescue Alerts</Text>
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { key: 'all', label: 'All Requests' },
            { key: 'pending', label: '🚨 Pending Rescue' },
            { key: 'active', label: '⚡ En Route' },
            { key: 'resolved', label: '✅ Resolved' }
          ].map(f => {
            const isActive = filterStatus === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilterStatus(f.key as any)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={THEME.error} />
            <Text style={styles.loaderText}>Scanning for breakdown rescue alerts...</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="navigate-circle-outline" size={46} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Emergency Alerts</Text>
            <Text style={styles.emptySubtitle}>There are currently no active breakdown requests in your area.</Text>
          </View>
        ) : (
          filteredRequests.map(req => {
            const isPending = req.status === 'pending';
            const isActive = req.status === 'active' || req.status === 'en_route';
            const isResolved = req.status === 'resolved' || req.status === 'completed';

            return (
              <View key={req._id} style={styles.card}>
                
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.alertIconBox}>
                    <Ionicons name="alert-circle" size={22} color={THEME.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleTitle}>{req.vehicleDescription || 'Vehicle Breakdown'}</Text>
                    <Text style={styles.locationText}>📍 {req.location || 'Location shared'}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    isResolved ? styles.badgeSuccess :
                    isActive ? styles.badgePrimary :
                    styles.badgeWarning
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      isResolved ? styles.textSuccess :
                      isActive ? styles.textPrimary :
                      styles.textWarning
                    ]}>
                      {(req.status || 'pending').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.detailsBox}>
                  <Text style={styles.issueText}>Issue: {req.issueDescription || 'Vehicle engine breakdown / roadside emergency'}</Text>
                  
                  {req.user ? (
                    <View style={styles.driverRow}>
                      <Ionicons name="person" size={14} color={THEME.textSecondary} />
                      <Text style={styles.driverText}>
                        Driver: <Text style={{ fontWeight: '700', color: THEME.text }}>{req.user.name || 'Stranded Driver'}</Text>
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Footer Action Bar */}
                <View style={styles.cardFooter}>
                  {req.user?.phone ? (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${req.user.phone}`)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={14} color="#FFFFFF" />
                      <Text style={styles.callBtnText}>Call Driver</Text>
                    </TouchableOpacity>
                  ) : null}

                  {updatingId === req._id ? (
                    <ActivityIndicator size="small" color={THEME.error} style={{ marginLeft: 'auto' }} />
                  ) : (
                    <View style={styles.actionsRow}>
                      {isPending && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.acceptBtn]}
                          onPress={() => handleUpdateStatus(req._id, 'active')}
                        >
                          <Text style={styles.acceptBtnText}>Dispatch Rescue</Text>
                        </TouchableOpacity>
                      )}

                      {isActive && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.resolveBtn]}
                          onPress={() => handleUpdateStatus(req._id, 'resolved')}
                        >
                          <Text style={styles.resolveBtnText}>Mark Rescued</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

              </View>
            );
          })
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text
  },
  filterScroll: {
    marginBottom: 16
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    marginRight: 8
  },
  filterPillActive: {
    backgroundColor: THEME.error,
    borderColor: THEME.error
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  loaderBox: {
    alignItems: 'center',
    padding: 40,
    gap: 10
  },
  loaderText: {
    fontSize: 13,
    color: THEME.textSecondary
  },
  emptyCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 10
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginTop: 4
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.errorLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  vehicleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text
  },
  locationText: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  badgeSuccess: {
    backgroundColor: THEME.successLight,
    borderColor: '#A7F3D0'
  },
  badgePrimary: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primaryBorder
  },
  badgeWarning: {
    backgroundColor: THEME.warningLight,
    borderColor: '#FDE68A'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  textSuccess: {
    color: '#065F46'
  },
  textPrimary: {
    color: THEME.primary
  },
  textWarning: {
    color: '#92400E'
  },
  detailsBox: {
    paddingVertical: 10,
    gap: 6
  },
  issueText: {
    fontSize: 13,
    color: THEME.text,
    lineHeight: 18,
    fontWeight: '500'
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2
  },
  driverText: {
    fontSize: 12,
    color: THEME.textSecondary
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.error,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto'
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  acceptBtn: {
    backgroundColor: THEME.primary
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  resolveBtn: {
    backgroundColor: THEME.success
  },
  resolveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
