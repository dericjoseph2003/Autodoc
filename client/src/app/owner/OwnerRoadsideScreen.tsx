import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../../services/api';
import BackButton from '../../components/ui/BackButton';

const dummyLocation = {
  lat: 28.6139,
  lng: 77.2090, // New Delhi
  address: 'Fetching location...',
};

const THEME = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F5A524',
};

interface OwnerRoadsideScreenProps {
  onBack: () => void;
  vehicles?: any[];
}

export default function OwnerRoadsideScreen({ onBack, vehicles = [] }: OwnerRoadsideScreenProps) {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [nearbyCenters, setNearbyCenters] = useState<any[]>([]);
  
  // Form state
  const [issueDesc, setIssueDesc] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [userLocation, setUserLocation] = useState(dummyLocation);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.listRoadsideRequests();
      setRequests(res.requests || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyCenters = async (lat: number, lng: number) => {
    try {
      const res = await api.getNearbyServiceCenters(lat, lng, 20); // 20km radius
      setNearbyCenters(res.data || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const getUserLocation = async () => {
    try {
      setLocationLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setLocationLoading(false);
        // Fallback to dummy and fetch
        fetchNearbyCenters(dummyLocation.lat, dummyLocation.lng);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let lat = location.coords.latitude;
      let lng = location.coords.longitude;
      
      let addressStr = 'Location found';
      try {
        let geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geocode.length > 0) {
          const p = geocode[0];
          addressStr = `${p.street || p.name}, ${p.city}, ${p.region}, ${p.country}`;
        }
      } catch (err) {
        console.error('Reverse geocode failed:', err);
      }

      setUserLocation({
        lat,
        lng,
        address: addressStr
      });
      fetchNearbyCenters(lat, lng);
    } catch (err) {
      console.error(err);
      setLocationError('Could not fetch location');
      fetchNearbyCenters(dummyLocation.lat, dummyLocation.lng);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    getUserLocation();
  }, []);

  const handleSubmitRequest = async () => {
    if (!issueDesc.trim()) {
      Alert.alert('Error', 'Please describe your emergency or issue.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        location: userLocation.address,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        issueDescription: issueDesc,
        vehicle_id: selectedVehicle,
        service_center_id: selectedCenter,
        type: 'Emergency Breakdown',
        priorityScore: 10,
      };

      await api.createRoadsideRequest(payload);
      Alert.alert('Success', 'Emergency request dispatched successfully.');
      setIssueDesc('');
      setSelectedCenter(null);
      setActiveTab('history');
      await fetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to dispatch request.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved': return THEME.success;
      case 'active':
      case 'in_progress':
      case 'assigned': return THEME.primary;
      case 'pending': return THEME.warning;
      default: return THEME.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton variant="ghost" label="Home" onPress={onBack} />
        <Text style={styles.headerTitle}>Roadside Assistance</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'request' && styles.activeTab]}
          onPress={() => setActiveTab('request')}
        >
          <Text style={[styles.tabText, activeTab === 'request' && styles.activeTabText]}>Request Help</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>My Requests</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={THEME.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'request' ? (
          <View style={styles.requestForm}>
            
            <View style={styles.alertBanner}>
              <Ionicons name="location" size={24} color={THEME.danger} />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Live Location Shared</Text>
                {locationLoading ? (
                  <Text style={styles.alertDesc}>Detecting current location...</Text>
                ) : (
                  <Text style={styles.alertDesc}>{locationError || userLocation.address}</Text>
                )}
              </View>
            </View>

            <Text style={styles.label}>What's the issue?</Text>
            <TextInput
              style={styles.inputArea}
              placeholder="E.g. Flat tire, battery dead, engine won't start..."
              multiline
              numberOfLines={4}
              value={issueDesc}
              onChangeText={setIssueDesc}
            />

            <Text style={styles.label}>Select Vehicle (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {vehicles.map(v => (
                <TouchableOpacity
                  key={v._id || v.id}
                  style={[styles.pill, selectedVehicle === (v._id || v.id) && styles.activePill]}
                  onPress={() => setSelectedVehicle(v._id || v.id)}
                >
                  <Text style={[styles.pillText, selectedVehicle === (v._id || v.id) && styles.activePillText]}>
                    {v.make} {v.model} ({v.registration_number})
                  </Text>
                </TouchableOpacity>
              ))}
              {vehicles.length === 0 && (
                <Text style={styles.noDataText}>No vehicles available.</Text>
              )}
            </ScrollView>

            <Text style={styles.label}>Send Request To (Optional)</Text>
            <Text style={styles.subLabel}>If unselected, request broadcasts to all nearby workshops.</Text>
            {nearbyCenters.length > 0 ? (
              nearbyCenters.map(center => (
                <TouchableOpacity 
                  key={center._id} 
                  style={[styles.centerCard, selectedCenter === center._id && styles.activeCenterCard]}
                  onPress={() => setSelectedCenter(center._id)}
                >
                  <View>
                    <Text style={styles.centerName}>{center.name || center.businessName}</Text>
                    <Text style={styles.centerDist}>{center.distanceKm} km away</Text>
                  </View>
                  {selectedCenter === center._id && (
                    <Ionicons name="checkmark-circle" size={24} color={THEME.primary} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>No nearby service centers found.</Text>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitRequest}>
              <Ionicons name="warning" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>SOS - Request Assistance</Text>
            </TouchableOpacity>

          </View>
        ) : (
          <View style={styles.historyList}>
            {requests.length === 0 ? (
              <Text style={styles.noDataText}>You have no roadside assistance requests.</Text>
            ) : (
              requests.map(req => (
                <View key={req._id || req.id} style={styles.reqCard}>
                  <View style={styles.reqHeader}>
                    <Text style={styles.reqDate}>
                      {new Date(req.roadside_request_created_at || req.createdAt).toLocaleString()}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(req.status) }]}>
                      <Text style={styles.badgeText}>{(req.status || 'Pending').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.reqDesc}>{req.issueDescription || req.type}</Text>
                  <View style={styles.reqFooter}>
                    <Ionicons name="location-outline" size={16} color={THEME.textSecondary} />
                    <Text style={styles.reqLoc}>{req.location}</Text>
                  </View>
                  {req.service_center_id && req.service_center_id.name && (
                    <View style={styles.assignedTo}>
                      <Text style={styles.assignedLabel}>Assigned Workshop:</Text>
                      <Text style={styles.assignedName}>{req.service_center_id.name}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: THEME.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  activeTabText: {
    color: THEME.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  requestForm: {
    gap: 16,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  alertDesc: {
    fontSize: 13,
    color: '#B91C1C',
    marginTop: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 8,
  },
  subLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 4,
  },
  inputArea: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: THEME.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  horizontalList: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    marginRight: 10,
  },
  activePill: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  activePillText: {
    color: '#FFF',
  },
  centerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    marginBottom: 10,
  },
  activeCenterCard: {
    borderColor: THEME.primary,
    backgroundColor: '#EFF6FF',
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  centerDist: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: THEME.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  noDataText: {
    color: THEME.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  historyList: {
    gap: 16,
  },
  reqCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reqDate: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reqDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 12,
  },
  reqFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqLoc: {
    fontSize: 13,
    color: THEME.textSecondary,
    flex: 1,
  },
  assignedTo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    flexDirection: 'row',
    gap: 6,
  },
  assignedLabel: {
    fontSize: 13,
    color: THEME.textSecondary,
  },
  assignedName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.primary,
  },
});
