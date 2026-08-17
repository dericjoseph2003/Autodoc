import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';

interface ServiceCenterHomeScreenProps {
  user: any;
  onNavigateToTab: (tabName: string) => void;
}

export default function ServiceCenterHomeScreen({ user, onNavigateToTab }: ServiceCenterHomeScreenProps) {
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [roadsideRequests, setRoadsideRequests] = useState<any[]>([]);
  const [businessName, setBusinessName] = useState('Express Car Care');
  const [approvalStatus, setApprovalStatus] = useState<string>('pending');

  const loadData = async () => {
    try {
      setLoading(true);
      const { api } = require('../../services/api');

      // Load matching service center profile name if exists, else fallback to user name
      const scRes = await api.listServiceCenters();
      const currentCenter = scRes.serviceCenters?.find(
        (c: any) => c.manager?._id === user.id || c.manager === user.id
      );
      if (currentCenter) {
        setBusinessName(currentCenter.businessName);
        setApprovalStatus(currentCenter.approvalStatus || 'pending');
      } else {
        setBusinessName(user.name);
        setApprovalStatus('pending');
      }

      // Load appointments
      const appRes = await api.listAppointments();
      setAppointments(appRes.appointments || []);

      // Load roadside requests
      const roadRes = await api.listRoadsideRequests();
      setRoadsideRequests(roadRes.requests || []);
    } catch (err) {
      console.error('Failed to load service center dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptRequest = (id: string) => {
    alert(`Request ${id} accepted! Customer will be notified.`);
    // Update state locally
    setRoadsideRequests(prev =>
      prev.map(r => (r._id === id ? { ...r, status: 'active' } : r))
    );
  };

  const handleDeclineRequest = (id: string) => {
    alert(`Request ${id} declined.`);
    // Filter out locally
    setRoadsideRequests(prev => prev.filter(r => r._id !== id));
  };

  // Stats
  const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
  const activeRoadside = roadsideRequests.filter(r => r.status === 'active').length;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      {loading ? (
        <ActivityIndicator size="large" color="#F5A524" style={styles.loader} />
      ) : (
        <>
          {/* Greeting with status badge */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>🛠️ {businessName}</Text>
              <Text style={styles.subGreeting}>Service Center Dashboard</Text>
            </View>
            <View style={[
              styles.statusBadge,
              approvalStatus === 'approved' ? styles.statusApproved :
              approvalStatus === 'rejected' ? styles.statusRejected :
              styles.statusPending
            ]}>
              <Text style={[
                styles.statusBadgeText,
                approvalStatus === 'approved' ? styles.statusTextApproved :
                approvalStatus === 'rejected' ? styles.statusTextRejected :
                styles.statusTextPending
              ]}>
                {approvalStatus === 'approved' ? 'Approved' :
                 approvalStatus === 'rejected' ? 'Deactivated' :
                 'Pending Approval'}
              </Text>
            </View>
          </View>

          {/* Pending Warning Notice */}
          {approvalStatus !== 'approved' && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Account Pending Approval</Text>
                <Text style={styles.warningText}>
                  Your profile is currently waiting for system administrator verification. 
                  Important: If you sign out now, you will not be able to log back in until you are approved.
                </Text>
              </View>
            </View>
          )}

          {/* Stat Cards (using reusable StatCard component) */}
          <View style={styles.statsRow}>
            <StatCard
              icon="📅"
              number={pendingAppointments}
              label="Pending Booking"
            />
            <StatCard
              icon="🚨"
              number={activeRoadside}
              label="Active Roadside"
            />
          </View>

          {/* Quick link to manage spare parts inventory */}
          <TouchableOpacity 
            style={styles.inventoryBtn}
            onPress={() => onNavigateToTab('Spare Parts')}
          >
            <Text style={styles.inventoryIcon}>📦</Text>
            <View>
              <Text style={styles.inventoryText}>Manage Spare Parts Inventory</Text>
              <Text style={styles.inventorySubText}>Update stock level and part catalog</Text>
            </View>
          </TouchableOpacity>

          {/* Today's Appointments */}
          <Text style={styles.sectionTitle}>Today's Bookings</Text>
          {appointments.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No appointments booked for today.</Text>
            </View>
          ) : (
            appointments.map(app => (
              <View key={app._id} style={styles.appCard}>
                <View style={styles.appHeader}>
                  <View>
                    <Text style={styles.appTitle}>{app.serviceType}</Text>
                    <Text style={styles.appText}>Vehicle: {app.vehicle.make} {app.vehicle.model} ({app.vehicle.registrationNumber})</Text>
                  </View>
                  <StatusBadge status={app.status} />
                </View>
                <Text style={styles.appFooter}>🕒 Scheduled: {app.date} at {app.time}</Text>
              </View>
            ))
          )}

          {/* Roadside Requests */}
          <Text style={styles.sectionTitle}>Roadside Assistance Requests</Text>
          {roadsideRequests.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No roadside requests assigned.</Text>
            </View>
          ) : (
            roadsideRequests.map(req => (
              <View key={req._id} style={styles.roadCard}>
                <View style={styles.roadHeader}>
                  <Text style={styles.roadVehicle}>🚨 {req.vehicleDescription}</Text>
                  <StatusBadge status={req.status} />
                </View>
                <Text style={styles.roadDesc}>{req.issueDescription}</Text>
                <Text style={styles.roadLocation}>📍 Location: {req.location}</Text>
                <Text style={styles.roadUser}>👤 Customer: {req.user.name} ({req.user.phone})</Text>

                {req.status === 'pending' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => handleAcceptRequest(req._id)}
                    >
                      <Text style={styles.acceptText}>Accept Help</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.declineBtn]}
                      onPress={() => handleDeclineRequest(req._id)}
                    >
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F7F8FA'
  },
  loader: {
    marginTop: 40
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A'
  },
  subGreeting: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  inventoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8CC', // Light Orange
    borderColor: '#FFA50044',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 16
  },
  inventoryIcon: {
    fontSize: 28
  },
  inventoryText: {
    color: '#B45309',
    fontSize: 15,
    fontWeight: 'bold'
  },
  inventorySubText: {
    color: '#D97706',
    fontSize: 11,
    marginTop: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    marginTop: 8
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 13
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
    marginBottom: 12
  },
  appTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A'
  },
  appText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  appFooter: {
    fontSize: 11,
    color: '#6B7280'
  },
  roadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  roadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  roadVehicle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A'
  },
  roadDesc: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 18,
    marginBottom: 8
  },
  roadLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  roadUser: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  acceptBtn: {
    backgroundColor: '#4CAF50'
  },
  acceptText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  declineBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  declineText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: 'bold'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusApproved: {
    backgroundColor: '#D1FAE5'
  },
  statusPending: {
    backgroundColor: '#FEF3C7'
  },
  statusRejected: {
    backgroundColor: '#FEE2E2'
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  statusTextApproved: {
    color: '#065F46'
  },
  statusTextPending: {
    color: '#92400E'
  },
  statusTextRejected: {
    color: '#991B1B'
  },
  warningBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20
  },
  warningIcon: {
    fontSize: 22
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 4
  },
  warningText: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 16
  }
});
