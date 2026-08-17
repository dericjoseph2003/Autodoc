import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface Vehicle {
  _id?: string;
  make: string;
  model: string;
  year: number | string;
  registrationNumber: string;
  fuelType: string;
  color?: string;
  vehicleType?: 'car' | 'bike' | 'suv' | 'truck' | string;
}

export interface VehicleSummaryCardProps {
  vehicle?: Vehicle | null;
  onAddVehicle?: () => void;
  onViewAll?: () => void;
}

export default function VehicleSummaryCard({
  vehicle,
  onAddVehicle,
  onViewAll,
}: VehicleSummaryCardProps) {
  const getVehicleIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'bike':
      case 'motorcycle':
        return 'navigation' as const;
      case 'truck':
        return 'truck' as const;
      case 'suv':
      case 'car':
      default:
        return 'disc' as const;
    }
  };

  if (!vehicle) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="plus-circle" size={28} color="#185FA5" />
          </View>
          <Text style={styles.emptyTitle}>No Vehicle Registered</Text>
          <Text style={styles.emptySubtitle}>
            Add your vehicle details to track maintenance, expiry alerts & book services easily.
          </Text>
          {onAddVehicle ? (
            <TouchableOpacity style={styles.addBtn} onPress={onAddVehicle} activeOpacity={0.85}>
              <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.addBtnText}>Add Vehicle Profile</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.vehicleTitleRow}>
          <View style={styles.vehicleIconBox}>
            <Feather name={getVehicleIcon(vehicle.vehicleType)} size={20} color="#185FA5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.regNumber}>{vehicle.registrationNumber}</Text>
          </View>
        </View>
        <View style={styles.yearBadge}>
          <Text style={styles.yearText}>{vehicle.year}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <Feather name="droplet" size={13} color="#64748B" />
          <Text style={styles.specLabel}>Fuel:</Text>
          <Text style={styles.specVal}>{vehicle.fuelType || 'N/A'}</Text>
        </View>

        {vehicle.color ? (
          <View style={styles.specItem}>
            <Feather name="disc" size={13} color="#64748B" />
            <Text style={styles.specLabel}>Color:</Text>
            <Text style={styles.specVal}>{vehicle.color}</Text>
          </View>
        ) : null}

        <View style={styles.specItem}>
          <Feather name="shield" size={13} color="#10B981" />
          <Text style={[styles.specVal, { color: '#10B981', fontWeight: '700' }]}>Active</Text>
        </View>
      </View>

      {onViewAll ? (
        <TouchableOpacity style={styles.viewAllFooter} onPress={onViewAll} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>Manage Vehicles & Documents</Text>
          <Feather name="chevron-right" size={14} color="#185FA5" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#185FA512',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  regNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#185FA5',
    letterSpacing: 0.3,
  },
  yearBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  yearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  specLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  viewAllFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#185FA5',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#185FA510',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#185FA5',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
