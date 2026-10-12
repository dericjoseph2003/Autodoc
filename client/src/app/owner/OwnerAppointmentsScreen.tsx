import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
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

export default function OwnerAppointmentsScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.listAppointments();
      const list = res.appointments || res.data || [];
      setAppointments(list);
    } catch (err) {
      console.error('Failed to load owner appointments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancelBooking = async (id: string, scName: string) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your service request with ${scName}?`,
      [
        { text: 'No, Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancellingId(id);
              await api.updateAppointmentStatus(id, 'cancelled');
              setAppointments(prev =>
                prev.map(app => (app._id === id || app.id === id ? { ...app, status: 'cancelled', appointment_status: 'cancelled' } : app))
              );
            } catch (err: any) {
              Alert.alert('Cancellation Error', err.message || 'Failed to cancel appointment');
            } finally {
              setCancellingId(null);
            }
          }
        }
      ]
    );
  };

  const filteredAppointments = appointments.filter(app => {
    const status = app.status || app.appointment_status || 'pending';
    const matchesFilter = filterStatus === 'all' || status.toLowerCase() === filterStatus.toLowerCase();
    
    const searchLower = searchQuery.toLowerCase();
    const serviceType = (app.serviceType || app.appointment_service_type || '').toLowerCase();
    const scObj = app.serviceCenter || app.service_center_id || {};
    const scName = (typeof scObj === 'object' ? (scObj.service_center_name || scObj.businessName || scObj.name || '') : String(scObj)).toLowerCase();
    const vehObj = app.vehicle || app.vehicle_id || {};
    const vehMake = (typeof vehObj === 'object' ? (vehObj.make || vehObj.vehicle_make || '') : '').toLowerCase();
    const vehModel = (typeof vehObj === 'object' ? (vehObj.model || vehObj.vehicle_model || '') : '').toLowerCase();
    const vehReg = (typeof vehObj === 'object' ? (vehObj.registrationNumber || vehObj.vehicle_registration_number || '') : '').toLowerCase();

    const matchesSearch =
      !searchQuery ||
      serviceType.includes(searchLower) ||
      scName.includes(searchLower) ||
      vehMake.includes(searchLower) ||
      vehModel.includes(searchLower) ||
      vehReg.includes(searchLower);

    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.primary]} />
        }
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <BackButton variant="card" label="Home" onPress={onBack} />
          <Text style={styles.headerTitle}>Booking History</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          Track your service requests, view workshop confirmations, and manage active vehicle appointments.
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by workshop, service type, or vehicle..."
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

        {/* Filter Status Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { key: 'all', label: 'All Bookings' },
            { key: 'pending', label: 'Pending Approval' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map(f => {
            const isActive = filterStatus === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilterStatus(f.key as any)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && !refreshing ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loaderText}>Loading your booking history...</Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search criteria or status filter.'
                : 'You have not made any service bookings yet. Browse partner workshops to request vehicle maintenance!'}
            </Text>
          </View>
        ) : (
          filteredAppointments.map((app, index) => {
            const appId = app._id || app.id || app.appointment_id || `app-${index}`;
            const status = (app.status || app.appointment_status || 'pending').toLowerCase();
            const isPending = status === 'pending';
            const isConfirmed = status === 'confirmed' || status === 'in_progress';
            const isCompleted = status === 'completed';
            const isCancelled = status === 'cancelled';

            const scObj = app.serviceCenter || app.service_center_id || {};
            const scName = typeof scObj === 'object' ? (scObj.service_center_name || scObj.businessName || scObj.name || 'AutoDoc Partner Workshop') : 'AutoDoc Partner Workshop';
            const scPhone = typeof scObj === 'object' ? (scObj.phone || scObj.service_center_phone_number || scObj.contact?.phone) : null;
            const scAddress = typeof scObj === 'object' ? (scObj.city || scObj.location?.city || scObj.service_center_address || 'Kerala') : 'Kerala';

            const vehObj = app.vehicle || app.vehicle_id || {};
            const vehMake = typeof vehObj === 'object' ? (vehObj.make || vehObj.vehicle_make || '') : '';
            const vehModel = typeof vehObj === 'object' ? (vehObj.model || vehObj.vehicle_model || 'My Vehicle') : 'My Vehicle';
            const vehReg = typeof vehObj === 'object' ? (vehObj.registrationNumber || vehObj.vehicle_registration_number || '') : '';

            const serviceName = app.serviceType || app.appointment_service_type || 'General Maintenance';
            const dateStr = app.date || app.appointment_date || 'Upcoming';
            const timeSlotStr = app.time || app.appointment_time_slot || '10:00 AM';

            return (
              <View key={appId} style={styles.card}>
                
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.scIconBox}>
                    <Ionicons name="construct" size={20} color={THEME.primary} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.scNameText}>{scName}</Text>
                    <Text style={styles.serviceTitle}>{serviceName}</Text>
                  </View>

                  {/* Status Badge */}
                  <View style={[
                    styles.statusBadge,
                    isCompleted ? styles.badgeSuccess :
                    isConfirmed ? styles.badgePrimary :
                    isCancelled ? styles.badgeError :
                    styles.badgeWarning
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      isCompleted ? styles.textSuccess :
                      isConfirmed ? styles.textPrimary :
                      isCancelled ? styles.textError :
                      styles.textWarning
                    ]}>
                      {status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Details Body */}
                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={15} color={THEME.primary} />
                    <Text style={styles.detailTextBold}>
                      {dateStr} <Text style={{ color: THEME.textSecondary, fontWeight: '500' }}>• {timeSlotStr}</Text>
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="car-outline" size={15} color="#64748B" />
                    <Text style={styles.detailText}>
                      Vehicle: <Text style={{ fontWeight: '700', color: THEME.text }}>{vehMake} {vehModel}</Text> {vehReg ? `(${vehReg})` : ''}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={15} color="#64748B" />
                    <Text style={styles.detailText}>
                      Location: <Text style={{ fontWeight: '600', color: THEME.text }}>{scAddress}</Text>
                    </Text>
                  </View>

                  {app.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>Notes: "{app.notes}"</Text>
                    </View>
                  ) : null}
                </View>

                {/* Footer Actions */}
                <View style={styles.cardFooter}>
                  {scPhone ? (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${scPhone}`)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call-outline" size={14} color={THEME.primary} />
                      <Text style={styles.callBtnText}>Call Workshop</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}

                  {!isCancelled && !isCompleted ? (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelBooking(appId, scName)}
                      disabled={cancellingId === appId}
                      activeOpacity={0.8}
                    >
                      {cancellingId === appId ? (
                        <ActivityIndicator size="small" color={THEME.error} />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={14} color={THEME.error} />
                          <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
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
    marginBottom: 4,
    paddingTop: 4
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginBottom: 16,
    lineHeight: 18
  },

  // Search
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

  // Filter Pills
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

  // Loader & Empty
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
    padding: 32,
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
    marginTop: 4,
    lineHeight: 18
  },

  // Cards
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
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12
  },
  scIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.primaryBorder
  },
  scNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text
  },
  serviceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.primary,
    marginTop: 2
  },

  // Badges
  statusBadge: {
    paddingHorizontal: 9,
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
  badgeError: {
    backgroundColor: THEME.errorLight,
    borderColor: '#FECACA'
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
  textError: {
    color: THEME.error
  },

  // Details
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

  // Footer Actions
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
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.errorLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.error
  }
});
