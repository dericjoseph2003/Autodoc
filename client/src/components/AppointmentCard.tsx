import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';

export interface Appointment {
  _id: string;
  serviceType: string;
  date: string;
  time: string;
  status: string;
  serviceCenter?: {
    businessName?: string;
    name?: string;
  };
  vehicle?: {
    make?: string;
    model?: string;
    registrationNumber?: string;
  };
}

export interface AppointmentCardProps {
  appointment?: Appointment | null;
  onPress?: () => void;
  onBookNew?: () => void;
}

export default function AppointmentCard({
  appointment,
  onPress,
  onBookNew,
}: AppointmentCardProps) {
  if (!appointment) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="calendar" size={24} color="#64748B" />
          </View>
          <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
          <Text style={styles.emptySubtitle}>
            You have no active vehicle service bookings scheduled at this time.
          </Text>
          {onBookNew ? (
            <TouchableOpacity style={styles.bookBtn} onPress={onBookNew} activeOpacity={0.85}>
              <Feather name="plus-circle" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.bookBtnText}>Find Service Center & Book</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  const centerName =
    appointment.serviceCenter?.businessName ||
    appointment.serviceCenter?.name ||
    'Service Center';

  const vehicleName = appointment.vehicle
    ? `${appointment.vehicle.make || ''} ${appointment.vehicle.model || ''}`.trim()
    : 'Vehicle';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.serviceTitleGroup}>
          <View style={styles.serviceIconBox}>
            <Feather name="tool" size={18} color="#185FA5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceType}>{appointment.serviceType}</Text>
            <Text style={styles.centerName} numberOfLines={1}>
              {centerName}
            </Text>
          </View>
        </View>

        <StatusBadge status={appointment.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.infoGroup}>
          <Feather name="calendar" size={12} color="#64748B" />
          <Text style={styles.infoText}>
            {appointment.date} • {appointment.time}
          </Text>
        </View>

        <View style={styles.infoGroup}>
          <Feather name="truck" size={12} color="#64748B" />
          <Text style={styles.infoText} numberOfLines={1}>
            {vehicleName}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  serviceTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  serviceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#185FA512',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  serviceType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  centerName: {
    fontSize: 12,
    color: '#64748B',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#185FA5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
