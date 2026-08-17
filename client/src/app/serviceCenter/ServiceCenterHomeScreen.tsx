import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import StatCard from '../../components/StatCard';

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

interface ServiceCenterHomeScreenProps {
  user: any;
  onNavigateToTab: (tabName: string) => void;
}

export default function ServiceCenterHomeScreen({ user, onNavigateToTab }: ServiceCenterHomeScreenProps) {
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [roadsideRequests, setRoadsideRequests] = useState<any[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [businessName, setBusinessName] = useState('Service Center Workshop');
  const [category, setCategory] = useState('Multi-brand Workshop');
  const [city, setCity] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<string>('approved');

  const loadData = async () => {
    try {
      setLoading(true);

      // Load matching service center profile
      try {
        const scRes = await api.listServiceCenters();
        const currentCenter = scRes.serviceCenters?.find(
          (c: any) =>
            c.manager?._id === user.id ||
            c.manager === user.id ||
            c.user_id === user.id ||
            c.user === user.id ||
            (user.email && c.manager?.email === user.email)
        );
        if (currentCenter) {
          setBusinessName(currentCenter.businessName || currentCenter.service_center_name || user.name);
          setCategory(currentCenter.businessType || currentCenter.workshopCategory || 'Multi-brand Service Center');
          setCity(currentCenter.city || '');
          setApprovalStatus(currentCenter.approvalStatus || 'approved');
        } else {
          setBusinessName(user.name || 'Service Center Workshop');
          setApprovalStatus('approved');
        }
      } catch (_) {}

      // Load appointments
      try {
        const appRes = await api.listAppointments();
        setAppointments(appRes.appointments || []);
      } catch (_) {}

      // Load roadside requests
      try {
        const roadRes = await api.listRoadsideRequests();
        setRoadsideRequests(roadRes.requests || []);
      } catch (_) {}

      // Load spare parts
      try {
        const partsRes = await api.listSpareParts();
        setSpareParts(partsRes.spareParts || []);
      } catch (_) {}

    } catch (err) {
      console.error('Failed to load service center dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptRoadside = async (id: string) => {
    try {
      await api.updateRoadsideStatus(id, 'active');
      setRoadsideRequests(prev =>
        prev.map(r => (r._id === id ? { ...r, status: 'active' } : r))
      );
    } catch (err) {
      console.error('Failed to accept roadside request:', err);
    }
  };

  const handleUpdateAppointment = async (id: string, status: string) => {
    try {
      await api.updateAppointmentStatus(id, status);
      setAppointments(prev =>
        prev.map(a => (a._id === id ? { ...a, status } : a))
      );
    } catch (err) {
      console.error('Failed to update appointment:', err);
    }
  };

  // Metrics
  const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
  const activeRoadside = roadsideRequests.filter(r => r.status === 'pending' || r.status === 'active').length;
  const totalParts = spareParts.length;
  const completedJobs = appointments.filter(a => a.status === 'completed').length;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true}>
      
      {/* Hero Workshop Identity Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.workshopIconBox}>
            <Ionicons name="construct" size={24} color={THEME.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.workshopTitle}>{businessName}</Text>
            <Text style={styles.workshopCategory}>
              {category} {city ? `• ${city}` : ''}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            approvalStatus === 'approved' ? styles.statusApproved : styles.statusPending
          ]}>
            <Text style={[
              styles.statusBadgeText,
              approvalStatus === 'approved' ? styles.statusTextApproved : styles.statusTextPending
            ]}>
              {approvalStatus === 'approved' ? '✓ Approved' : '⏳ Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Warning notice if pending */}
      {approvalStatus !== 'approved' && (
        <View style={styles.warningBanner}>
          <Ionicons name="alert-circle" size={20} color="#991B1B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Account Pending Admin Verification</Text>
            <Text style={styles.warningText}>
              Your service center profile is currently under review by system administrators.
            </Text>
          </View>
        </View>
      )}

      {/* Performance Metrics Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statTile} onPress={() => onNavigateToTab('Appointments')} activeOpacity={0.8}>
          <View style={[styles.statIconCircle, { backgroundColor: THEME.primaryLight }]}>
            <Ionicons name="calendar-outline" size={20} color={THEME.primary} />
          </View>
          <Text style={styles.statNumber}>{pendingAppointments}</Text>
          <Text style={styles.statLabel}>Pending Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statTile} onPress={() => onNavigateToTab('Roadside Requests')} activeOpacity={0.8}>
          <View style={[styles.statIconCircle, { backgroundColor: THEME.errorLight }]}>
            <Ionicons name="warning-outline" size={20} color={THEME.error} />
          </View>
          <Text style={styles.statNumber}>{activeRoadside}</Text>
          <Text style={styles.statLabel}>Rescue Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statTile} onPress={() => onNavigateToTab('Spare Parts')} activeOpacity={0.8}>
          <View style={[styles.statIconCircle, { backgroundColor: THEME.warningLight }]}>
            <Ionicons name="cube-outline" size={20} color={THEME.warning} />
          </View>
          <Text style={styles.statNumber}>{totalParts}</Text>
          <Text style={styles.statLabel}>Inventory Parts</Text>
        </TouchableOpacity>

        <View style={styles.statTile}>
          <View style={[styles.statIconCircle, { backgroundColor: THEME.successLight }]}>
            <Ionicons name="checkmark-done-outline" size={20} color={THEME.success} />
          </View>
          <Text style={styles.statNumber}>{completedJobs}</Text>
          <Text style={styles.statLabel}>Jobs Completed</Text>
        </View>
      </View>

      {/* Quick Operations Grid */}
      <Text style={styles.sectionTitle}>Quick Operations</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigateToTab('Appointments')}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: THEME.primaryLight }]}>
            <Ionicons name="calendar" size={22} color={THEME.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionCardTitle}>Manage Bookings</Text>
            <Text style={styles.actionCardSub}>View schedule & customer appointments</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigateToTab('Spare Parts')}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: THEME.warningLight }]}>
            <Ionicons name="cube" size={22} color={THEME.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionCardTitle}>Parts & Stock Catalog</Text>
            <Text style={styles.actionCardSub}>Add items, update stock & set pricing</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigateToTab('Roadside Requests')}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: THEME.errorLight }]}>
            <Ionicons name="navigate" size={22} color={THEME.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionCardTitle}>Roadside Rescue Dispatch</Text>
            <Text style={styles.actionCardSub}>Respond to nearby breakdown emergencies</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Emergency Roadside Rescue Feed */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>🚨 Emergency Rescue Feed</Text>
        <TouchableOpacity onPress={() => onNavigateToTab('Roadside Requests')}>
          <Text style={styles.seeAllText}>View All ↗</Text>
        </TouchableOpacity>
      </View>

      {roadsideRequests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="checkmark-circle-outline" size={32} color={THEME.success} />
          <Text style={styles.emptyText}>No emergency breakdown requests right now.</Text>
        </View>
      ) : (
        roadsideRequests.slice(0, 3).map(req => (
          <View key={req._id} style={styles.rescueCard}>
            <View style={styles.rescueHeader}>
              <Text style={styles.rescueVehicle}>🚨 {req.vehicleDescription || 'Vehicle Breakdown'}</Text>
              <Text style={styles.rescueLocation}>📍 {req.location || 'Location shared'}</Text>
            </View>
            <Text style={styles.rescueIssue}>{req.issueDescription}</Text>
            
            <View style={styles.rescueFooter}>
              {req.user?.phone ? (
                <TouchableOpacity
                  style={styles.callSmallBtn}
                  onPress={() => Linking.openURL(`tel:${req.user.phone}`)}
                >
                  <Ionicons name="call" size={12} color="#FFFFFF" />
                  <Text style={styles.callSmallBtnText}>Call Driver</Text>
                </TouchableOpacity>
              ) : null}

              {req.status === 'pending' && (
                <TouchableOpacity
                  style={styles.dispatchSmallBtn}
                  onPress={() => handleAcceptRoadside(req._id)}
                >
                  <Text style={styles.dispatchSmallBtnText}>Dispatch Rescue</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}

      {/* Today's Appointments Feed */}
      <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
        <Text style={styles.sectionTitle}>📅 Today's Bookings</Text>
        <TouchableOpacity onPress={() => onNavigateToTab('Appointments')}>
          <Text style={styles.seeAllText}>View All ↗</Text>
        </TouchableOpacity>
      </View>

      {appointments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
          <Text style={styles.emptyText}>No bookings scheduled for today.</Text>
        </View>
      ) : (
        appointments.slice(0, 3).map(app => (
          <View key={app._id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <View>
                <Text style={styles.bookingServiceTitle}>{app.serviceType || 'General Service'}</Text>
                <Text style={styles.bookingVehicleText}>
                  {app.vehicle?.make} {app.vehicle?.model} ({app.vehicle?.registrationNumber || 'N/A'})
                </Text>
              </View>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{app.time || 'Today'}</Text>
              </View>
            </View>

            <View style={styles.bookingFooter}>
              <Text style={styles.customerName}>👤 Customer: {app.user?.name || 'Valued Customer'}</Text>

              {(!app.status || app.status === 'pending' || app.status === 'pending_approval') ? (
                <View style={styles.bookingActionsRow}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleUpdateAppointment(app._id, 'confirmed')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleUpdateAppointment(app._id, 'cancelled')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle" size={13} color="#DC2626" />
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              ) : (app.status === 'confirmed' || app.status === 'in_progress') ? (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => handleUpdateAppointment(app._id, 'completed')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.completeBtnText}>Mark Completed</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.statusBadgeSmall}>
                  <Text style={styles.statusBadgeSmallText}>
                    {app.status === 'completed' ? '✓ Completed' : '✕ Declined'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: THEME.background,
    paddingBottom: 40
  },

  // Hero Card
  heroCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
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
  workshopIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.primaryBorder
  },
  workshopTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.3
  },
  workshopCategory: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1
  },
  statusApproved: {
    backgroundColor: THEME.successLight,
    borderColor: '#A7F3D0'
  },
  statusPending: {
    backgroundColor: THEME.warningLight,
    borderColor: '#FDE68A'
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  statusTextApproved: {
    color: '#065F46'
  },
  statusTextPending: {
    color: '#92400E'
  },

  // Warning Banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.errorLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 16
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B'
  },
  warningText: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  statTile: {
    width: '48%',
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text
  },
  statLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 10
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primary
  },

  // Actions Grid
  actionsGrid: {
    gap: 10,
    marginBottom: 20
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text
  },
  actionCardSub: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2
  },

  // Empty Card
  emptyCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
    gap: 8
  },
  emptyText: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '600'
  },

  // Rescue Card
  rescueCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    borderLeftWidth: 4,
    borderLeftColor: THEME.error
  },
  rescueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  rescueVehicle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.text
  },
  rescueLocation: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  rescueIssue: {
    fontSize: 12,
    color: THEME.text,
    marginBottom: 10
  },
  rescueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  callSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.error,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  callSmallBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  dispatchSmallBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6
  },
  dispatchSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },

  // Booking Card
  bookingCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    borderLeftWidth: 4,
    borderLeftColor: THEME.primary
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  bookingServiceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.text
  },
  bookingVehicleText: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2
  },
  timeBadge: {
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.primary
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  customerName: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  bookingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  acceptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  declineBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626'
  },
  completeBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  completeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9'
  },
  statusBadgeSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  }
});
