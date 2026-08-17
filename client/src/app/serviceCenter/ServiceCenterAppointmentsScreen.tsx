import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

export default function ServiceCenterAppointmentsScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.listAppointments();
      setAppointments(res.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await api.updateAppointmentStatus(id, newStatus);
      setAppointments(prev =>
        prev.map(app => (app._id === id ? { ...app, status: newStatus } : app))
      );
    } catch (err: any) {
      console.error('Failed to update status:', err);
      Alert.alert('Status Error', err.message || 'Failed to update booking status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      app.serviceType?.toLowerCase().includes(searchLower) ||
      app.user?.name?.toLowerCase().includes(searchLower) ||
      app.vehicle?.make?.toLowerCase().includes(searchLower) ||
      app.vehicle?.model?.toLowerCase().includes(searchLower) ||
      app.vehicle?.registrationNumber?.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <BackButton variant="card" label="Dashboard" onPress={onBack} />
          <Text style={styles.headerTitle}>Bookings & Appointments</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer, vehicle or service..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { key: 'all', label: 'All Bookings' },
            { key: 'pending', label: 'Pending' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
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
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loaderText}>Fetching booking schedules...</Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={42} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Appointments Found</Text>
            <Text style={styles.emptySubtitle}>There are currently no bookings matching your criteria.</Text>
          </View>
        ) : (
          filteredAppointments.map(app => {
            const isPending = app.status === 'pending';
            const isInProgress = app.status === 'in_progress' || app.status === 'confirmed';
            const isCompleted = app.status === 'completed';

            return (
              <View key={app._id} style={styles.card}>
                
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceTypeTitle}>{app.serviceType || 'General Service'}</Text>
                    <Text style={styles.dateSlotText}>
                      📅 {app.date || 'Today'} • 🕒 {app.time || 'Scheduled Slot'}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    isCompleted ? styles.badgeSuccess :
                    isInProgress ? styles.badgePrimary :
                    styles.badgeWarning
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      isCompleted ? styles.textSuccess :
                      isInProgress ? styles.textPrimary :
                      styles.textWarning
                    ]}>
                      {(app.status || 'pending').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Details Section */}
                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Ionicons name="car-outline" size={16} color={THEME.primary} />
                    <Text style={styles.detailTextBold}>
                      {app.vehicle?.make} {app.vehicle?.model} ({app.vehicle?.registrationNumber || 'N/A'})
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>
                      Customer: <Text style={{ fontWeight: '700', color: THEME.text }}>{app.user?.name || 'Valued Customer'}</Text>
                    </Text>
                  </View>

                  {app.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>💬 "{app.notes}"</Text>
                    </View>
                  ) : null}
                </View>

                {/* Actions Footer */}
                <View style={styles.cardFooter}>
                  {app.user?.phone ? (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${app.user.phone}`)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call-outline" size={14} color={THEME.primary} />
                      <Text style={styles.callBtnText}>Call Customer</Text>
                    </TouchableOpacity>
                  ) : null}

                  {updatingId === app._id ? (
                    <ActivityIndicator size="small" color={THEME.primary} style={{ marginLeft: 'auto' }} />
                  ) : (
                    <View style={styles.statusActionsRow}>
                      {isPending ? (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.acceptActionBtn]}
                            onPress={() => handleUpdateStatus(app._id, 'confirmed')}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
                            <Text style={styles.acceptActionBtnText}>Accept</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, styles.declineActionBtn]}
                            onPress={() => handleUpdateStatus(app._id, 'cancelled')}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="close-circle" size={13} color="#DC2626" />
                            <Text style={styles.declineActionBtnText}>Decline</Text>
                          </TouchableOpacity>
                        </>
                      ) : isInProgress ? (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.completeBtn]}
                          onPress={() => handleUpdateStatus(app._id, 'completed')}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.completeBtnText}>Mark Completed</Text>
                        </TouchableOpacity>
                      ) : null}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 12,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12
  },
  serviceTypeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text
  },
  dateSlotText: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    gap: 8,
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  detailTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text
  },
  detailText: {
    fontSize: 13,
    color: THEME.textSecondary
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 4
  },
  notesText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic'
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
    gap: 4,
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.primaryBorder
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.primary
  },
  statusActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto'
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  acceptActionBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  acceptActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  declineActionBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  declineActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626'
  },
  completeBtn: {
    backgroundColor: THEME.primary
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
