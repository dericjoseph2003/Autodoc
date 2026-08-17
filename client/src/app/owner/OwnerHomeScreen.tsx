import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { vehicleApi } from '../../api/vehicleApi';
import { appointmentApi } from '../../api/appointmentApi';
import { documentApi } from '../../api/documentApi';

import StatCard from '../../components/StatCard';
import AlertBanner from '../../components/AlertBanner';
import VehicleSummaryCard from '../../components/VehicleSummaryCard';
import QuickActionTile from '../../components/QuickActionTile';
import AppointmentCard from '../../components/AppointmentCard';

interface OwnerHomeScreenProps {
  user: any;
  onNavigateToTab: (tabName: string) => void;
}

export default function OwnerHomeScreen({ user, onNavigateToTab }: OwnerHomeScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Fetch real data from backend API services
  const loadData = useCallback(async () => {
    try {
      const [vehRes, appRes, expRes] = await Promise.allSettled([
        vehicleApi.getVehicles(),
        appointmentApi.getAppointments(),
        documentApi.getExpiringDocuments(),
      ]);

      if (vehRes.status === 'fulfilled') {
        setVehicles(vehRes.value?.vehicles || []);
      } else {
        console.error('Failed to load vehicles:', vehRes.reason);
      }

      if (appRes.status === 'fulfilled') {
        setAppointments(appRes.value?.appointments || []);
      } else {
        console.error('Failed to load appointments:', appRes.reason);
      }

      if (expRes.status === 'fulfilled') {
        setExpiringDocs(expRes.value?.documents || []);
      } else {
        console.error('Failed to load expiring documents:', expRes.reason);
      }
    } catch (err) {
      console.error('Failed to load owner dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const isProfileIncomplete =
    !user?.address || !user?.emergencyContact?.name || !user?.emergencyContact?.number;

  const handleRoadsidePress = () => {
    Alert.alert(
      '🚨 Emergency Roadside Help',
      'Would you like to dispatch an immediate emergency breakdown request to nearby service centers?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Breakdown Tow',
          style: 'destructive',
          onPress: () => {
            onNavigateToTab('Roadside');
          },
        },
      ]
    );
  };

  const docExpiryDetails = expiringDocs.map(doc => {
    const vehName = doc.vehicle ? `${doc.vehicle.make || ''} ${doc.vehicle.model || ''}` : 'Vehicle';
    const dateStr = doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'soon';
    return `${doc.documentType || 'Document'} (${vehName}) expires on ${dateStr}`;
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#185FA5']}
          tintColor="#185FA5"
        />
      }
    >
      {/* 1. SECTION 1: HEADER — Greeting + Notification Bell */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerGreetingSub}>Welcome back,</Text>
            <Text style={styles.headerGreetingName}>{user?.name || 'Vehicle Owner'}</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => Alert.alert('Notifications', 'You have no unread notifications.')}
            activeOpacity={0.8}
          >
            <Feather name="bell" size={20} color="#FFFFFF" />
            {expiringDocs.length > 0 ? <View style={styles.notificationBadge} /> : null}
          </TouchableOpacity>
        </View>

        {/* 2. SECTION 2: STAT CARDS (3) — Vehicles, Upcoming Bookings, Documents Expiring Soon */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="truck"
            number={vehicles.length}
            label="My Vehicles"
            iconColor="#185FA5"
            iconBg="#185FA515"
            onPress={() => onNavigateToTab('My Vehicles')}
          />
          <StatCard
            icon="calendar"
            number={appointments.length}
            label="Bookings"
            iconColor="#10B981"
            iconBg="#10B98115"
            onPress={() => onNavigateToTab('Appointments')}
          />
          <StatCard
            icon="alert-triangle"
            number={expiringDocs.length}
            label="Expiring Docs"
            iconColor={expiringDocs.length > 0 ? '#F5A524' : '#64748B'}
            iconBg={expiringDocs.length > 0 ? '#F5A52415' : '#F1F5F9'}
          />
        </View>
      </View>

      {/* BODY CONTENT */}
      <View style={styles.bodyContent}>
        {loading && !refreshing ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#185FA5" />
            <Text style={styles.loaderText}>Loading dashboard...</Text>
          </View>
        ) : (
          <>
            {/* 3. SECTION 3: EMERGENCY ROADSIDE ALERT CARD */}
            <AlertBanner
              type="emergency"
              title="Emergency Roadside Breakdown?"
              subtitle="Stuck on the road? Tap for immediate towing and mobile repair support."
              actionLabel="Request Roadside Assistance"
              onAction={handleRoadsidePress}
            />

            {/* Expiring Documents Alert (if any active) */}
            {expiringDocs.length > 0 ? (
              <AlertBanner
                type="document"
                title="Vehicle Document Expiry Warning"
                subtitle={`You have ${expiringDocs.length} active vehicle document(s) expiring within 30 days.`}
                details={docExpiryDetails}
                actionLabel="Manage Vehicles & Documents"
                onAction={() => onNavigateToTab('My Vehicles')}
              />
            ) : null}

            {/* 4. SECTION 4: "COMPLETE PROFILE" CARD — Dismissible if address/contact missing */}
            {isProfileIncomplete && !bannerDismissed ? (
              <AlertBanner
                type="profile"
                title="Complete Your Profile Details"
                subtitle="Add your home address and emergency contact details so service centers can reach you faster during breakdowns."
                actionLabel="Complete Profile Now"
                onAction={() => onNavigateToTab('ProfileEdit')}
                onDismiss={() => setBannerDismissed(true)}
              />
            ) : null}

            {/* 5. SECTION 5: MY VEHICLE CARD */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>My Primary Vehicle</Text>
              <TouchableOpacity onPress={() => onNavigateToTab('My Vehicles')}>
                <Text style={styles.sectionLink}>+ Add Vehicle</Text>
              </TouchableOpacity>
            </View>

            <VehicleSummaryCard
              vehicle={vehicles.length > 0 ? vehicles[0] : null}
              onAddVehicle={() => onNavigateToTab('My Vehicles')}
              onViewAll={() => onNavigateToTab('My Vehicles')}
            />

            {/* 6. SECTION 6: QUICK ACTIONS (3-icon grid) */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              <QuickActionTile
                icon="map-pin"
                label="Find Service Center"
                iconColor="#185FA5"
                iconBg="#185FA512"
                onPress={() => onNavigateToTab('Service Centers')}
              />
              <QuickActionTile
                icon="package"
                label="Spare Parts"
                iconColor="#185FA5"
                iconBg="#185FA512"
                onPress={() => Alert.alert('Spare Parts', 'Navigating to Spare Parts catalog...')}
              />
              <QuickActionTile
                icon="calendar"
                label="My Appointments"
                iconColor="#185FA5"
                iconBg="#185FA512"
                onPress={() => onNavigateToTab('Appointments')}
              />
            </View>

            {/* 7. SECTION 7: UPCOMING APPOINTMENTS LIST */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              {appointments.length > 0 ? (
                <TouchableOpacity onPress={() => onNavigateToTab('Appointments')}>
                  <Text style={styles.sectionLink}>View All</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {appointments.length === 0 ? (
              <AppointmentCard
                appointment={null}
                onBookNew={() => onNavigateToTab('Service Centers')}
              />
            ) : (
              appointments.map(app => (
                <AppointmentCard
                  key={app._id}
                  appointment={app}
                  onPress={() =>
                    Alert.alert(
                      'Appointment Details',
                      `Service: ${app.serviceType}\nStatus: ${app.status.toUpperCase()}\nDate: ${app.date} at ${app.time}`
                    )
                  }
                />
              ))
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    paddingBottom: 24,
  },
  headerContainer: {
    backgroundColor: '#185FA5',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerGreetingSub: {
    fontSize: 13,
    color: '#93C5FD',
    fontWeight: '500',
  },
  headerGreetingName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#185FA5',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loaderBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#185FA5',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
});
