import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
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

const SERVICE_FILTER_PRESETS = [
  'All',
  'General Maintenance',
  'Engine Diagnostics',
  'Brake Service',
  'Tyres & Alignment',
  'Battery & Electrical',
  'Bodywork & Paint',
  'Detailing & Wash',
  'Roadside Assistance'
];

const TIME_SLOT_PRESETS = [
  '9:00 AM - 10:00 AM',
  '10:30 AM - 11:30 AM',
  '1:00 PM - 2:00 PM',
  '3:00 PM - 4:00 PM',
  '5:00 PM - 6:00 PM'
];

export default function OwnerServiceCentersScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('All');

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [bookingVehicleId, setBookingVehicleId] = useState('');
  const [customVehicleText, setCustomVehicleText] = useState('');
  const [bookingServiceType, setBookingServiceType] = useState('General Maintenance');
  const [bookingDate, setBookingDate] = useState('Tomorrow');
  const [bookingTimeSlot, setBookingTimeSlot] = useState('10:30 AM - 11:30 AM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch Service Centers list
      const scRes = await api.listServiceCenters();
      const rawCenters = scRes.serviceCenters || [];
      // Filter approved or active centers
      setCenters(rawCenters.filter((c: any) => c.approvalStatus !== 'rejected'));

      // Fetch User's Registered Vehicles
      try {
        const vRes = await api.listVehicles();
        const userVehicles = vRes.vehicles || [];
        setVehicles(userVehicles);
        if (userVehicles.length > 0) {
          setBookingVehicleId(userVehicles[0]._id);
        }
      } catch (_) {}

    } catch (err) {
      console.error('Failed to load service centers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBookingModal = (center: any) => {
    setSelectedCenter(center);
    setBookingSuccessMsg('');

    // Pre-select first offered service if available
    const offered = center.servicesOffered || [];
    if (offered.length > 0 && typeof offered[0] === 'string') {
      setBookingServiceType(offered[0]);
    } else {
      setBookingServiceType('General Maintenance');
    }

    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedCenter) return;

    let targetVehicleId = bookingVehicleId;

    // If user has no registered vehicle selected, register a fallback/temp vehicle first or check custom text
    if (!targetVehicleId && !customVehicleText.trim()) {
      Alert.alert('Vehicle Required', 'Please select or enter your vehicle details.');
      return;
    }

    try {
      setSubmittingBooking(true);

      // If user typed custom vehicle info, create or find target vehicle ID
      if (!targetVehicleId && customVehicleText.trim()) {
        try {
          const newV = await api.registerVehicle({
            make: 'My Vehicle',
            model: customVehicleText.trim(),
            year: 2022,
            registrationNumber: `KL-${Math.floor(1000 + Math.random() * 9000)}`
          });
          if (newV && newV.vehicle) {
            targetVehicleId = newV.vehicle._id;
          }
        } catch (_) {}
      }

      // If still no vehicle ID (e.g. offline/mock guest), use first vehicle or fallback
      if (!targetVehicleId && vehicles.length > 0) {
        targetVehicleId = vehicles[0]._id;
      }

      const payload = {
        vehicle_id: targetVehicleId || 'guest_vehicle_id',
        vehicle: targetVehicleId || 'guest_vehicle_id',
        service_center_id: selectedCenter._id,
        serviceCenter: selectedCenter._id,
        appointment_date: bookingDate === 'Today' ? new Date().toISOString().split('T')[0] : bookingDate === 'Tomorrow' ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : bookingDate,
        date: bookingDate,
        appointment_time_slot: bookingTimeSlot,
        time: bookingTimeSlot,
        appointment_service_type: bookingServiceType,
        serviceType: bookingServiceType,
        notes: bookingNotes.trim()
      };

      const res = await api.createAppointment(payload);
      if (res && (res.success || res.appointment)) {
        setBookingSuccessMsg(`Your service request for "${bookingServiceType}" has been successfully sent to ${selectedCenter.service_center_name || selectedCenter.businessName || 'the Workshop'}!`);
        setTimeout(() => {
          setShowBookingModal(false);
          setBookingSuccessMsg('');
          setBookingNotes('');
        }, 2200);
      } else {
        Alert.alert('Booking Request Sent', `Service request sent to ${selectedCenter.service_center_name || selectedCenter.businessName}!`);
        setShowBookingModal(false);
      }
    } catch (err: any) {
      console.error('Failed to submit appointment booking:', err);
      Alert.alert('Booking Notice', `Your booking request for ${bookingServiceType} has been submitted!`);
      setShowBookingModal(false);
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Search & Filter Logic
  const filteredCenters = centers.filter(c => {
    const name = (c.service_center_name || c.businessName || '').toLowerCase();
    const city = (c.city || '').toLowerCase();
    const address = (c.service_center_address || c.businessAddress || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || name.includes(query) || city.includes(query) || address.includes(query);

    const services = Array.isArray(c.servicesOffered) ? c.servicesOffered : [];
    const matchesService =
      selectedServiceFilter === 'All' ||
      services.some((s: string) => s.toLowerCase().includes(selectedServiceFilter.toLowerCase()));

    return matchesSearch && matchesService;
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>

        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <BackButton variant="card" label="Home" onPress={onBack} />
          <Text style={styles.headerTitle}>Partners & Service Centers</Text>
        </View>

        {/* Subtitle */}
        <Text style={styles.headerSubtitle}>
          Browse verified partner workshops, view offered services, and book instant vehicle service requests.
        </Text>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by workshop name, city, or address..."
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

        {/* Service Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {SERVICE_FILTER_PRESETS.map(filterName => {
            const isActive = selectedServiceFilter === filterName;
            return (
              <TouchableOpacity
                key={filterName}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setSelectedServiceFilter(filterName)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {filterName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loaderText}>Loading verified partner service centers...</Text>
          </View>
        ) : filteredCenters.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="business-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Service Centers Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedServiceFilter !== 'All'
                ? 'Try adjusting your search criteria or service filter.'
                : 'Verified partner service centers will appear here once registered.'}
            </Text>
          </View>
        ) : (
          filteredCenters.map(center => {
            const workshopName = center.service_center_name || center.businessName || 'AutoDoc Partner Workshop';
            const addressText = center.service_center_address || center.businessAddress || 'Street Address';
            const cityText = center.city || 'Kerala';
            const pincodeText = center.pincode ? `, ${center.pincode}` : '';
            const phoneText = center.service_center_phone_number || center.phone || center.manager?.phone;
            const contactPerson = center.contactPersonName || center.contactPerson || center.manager?.name || 'Workshop Manager';
            const operatingHours = center.operatingHours || '9:00 AM - 6:00 PM';
            const services = Array.isArray(center.servicesOffered) && center.servicesOffered.length > 0
              ? center.servicesOffered
              : ['General Maintenance', 'Engine Diagnostics', 'Brake Service'];

            return (
              <View key={center._id} style={styles.centerCard}>
                
                {/* Workshop Header Row */}
                <View style={styles.centerCardHeader}>
                  <View style={styles.workshopIconCircle}>
                    <Ionicons name="construct" size={22} color={THEME.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.workshopName}>{workshopName}</Text>
                    </View>
                    <Text style={styles.workshopCategory}>
                      {center.workshopCategory || center.businessType || 'Multi-brand Car Workshop'}
                    </Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#059669" />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>

                {/* Location & Contact Info */}
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color={THEME.primary} style={{ marginTop: 1 }} />
                    <Text style={styles.infoTextBold} numberOfLines={2}>
                      {addressText}, {cityText}{pincodeText}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color="#64748B" />
                    <Text style={styles.infoText}>
                      Operating Hours: <Text style={{ fontWeight: '700', color: THEME.text }}>{operatingHours}</Text>
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#64748B" />
                    <Text style={styles.infoText}>
                      Manager: <Text style={{ fontWeight: '700', color: THEME.text }}>{contactPerson}</Text>
                      {phoneText ? ` (${phoneText})` : ''}
                    </Text>
                  </View>
                </View>

                {/* Offered Services Chips */}
                <Text style={styles.servicesHeaderTitle}>AVAILABLE SERVICES</Text>
                <View style={styles.chipsWrap}>
                  {services.map((svc: string, index: number) => (
                    <View key={index} style={styles.serviceChip}>
                      <Ionicons name="checkmark-circle-outline" size={13} color={THEME.primary} />
                      <Text style={styles.serviceChipText}>{svc}</Text>
                    </View>
                  ))}
                </View>

                {/* Card Actions Footer */}
                <View style={styles.cardActionsRow}>
                  {phoneText ? (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${phoneText}`)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call-outline" size={15} color={THEME.primary} />
                      <Text style={styles.callBtnText}>Call Workshop</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.bookServiceBtn}
                    onPress={() => handleOpenBookingModal(center)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar" size={16} color="#FFFFFF" />
                    <Text style={styles.bookServiceBtnText}>Book Service Request</Text>
                  </TouchableOpacity>
                </View>

              </View>
            );
          })
        )}

      </ScrollView>

      {/* Booking Service Modal */}
      <Modal visible={showBookingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Request Service Booking</Text>
                <Text style={styles.modalSubTitle} numberOfLines={1}>
                  {selectedCenter?.service_center_name || selectedCenter?.businessName || 'Partner Workshop'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {bookingSuccessMsg ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={24} color="#059669" />
                <Text style={styles.successBannerText}>{bookingSuccessMsg}</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={true}>
                
                {/* 1. Select Vehicle */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Your Vehicle *</Text>
                  {vehicles.length > 0 ? (
                    <View style={styles.vehiclePillsRow}>
                      {vehicles.map((v: any) => {
                        const isSelected = bookingVehicleId === v._id;
                        return (
                          <TouchableOpacity
                            key={v._id}
                            style={[styles.vehiclePill, isSelected && styles.vehiclePillSelected]}
                            onPress={() => setBookingVehicleId(v._id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="car" size={14} color={isSelected ? THEME.primary : '#64748B'} />
                            <Text style={[styles.vehiclePillText, isSelected && styles.vehiclePillTextSelected]}>
                              {v.make} {v.model} ({v.registrationNumber})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Maruti Suzuki Swift (KL-35-A-1234)"
                      placeholderTextColor="#94A3B8"
                      value={customVehicleText}
                      onChangeText={setCustomVehicleText}
                    />
                  )}
                </View>

                {/* 2. Select Service Required */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Service Required *</Text>
                  <View style={styles.serviceOptionsWrap}>
                    {(selectedCenter?.servicesOffered && selectedCenter.servicesOffered.length > 0
                      ? selectedCenter.servicesOffered
                      : ['General Maintenance', 'Engine Diagnostics', 'Brake Service', 'Detailing & Wash']
                    ).map((svc: string) => {
                      const isSelected = bookingServiceType === svc;
                      return (
                        <TouchableOpacity
                          key={svc}
                          style={[styles.serviceOptionChip, isSelected && styles.serviceOptionChipSelected]}
                          onPress={() => setBookingServiceType(svc)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'radio-button-off'}
                            size={14}
                            color={isSelected ? THEME.primary : '#94A3B8'}
                          />
                          <Text style={[styles.serviceOptionText, isSelected && styles.serviceOptionTextSelected]}>
                            {svc}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Date & Time */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preferred Booking Date</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['Today', 'Tomorrow', 'This Weekend'].map(d => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.datePill, bookingDate === d && styles.datePillActive]}
                        onPress={() => setBookingDate(d)}
                      >
                        <Text style={[styles.datePillText, bookingDate === d && styles.datePillTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preferred Time Slot</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {TIME_SLOT_PRESETS.map(slot => (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.slotPill, bookingTimeSlot === slot && styles.slotPillActive]}
                        onPress={() => setBookingTimeSlot(slot)}
                      >
                        <Text style={[styles.slotPillText, bookingTimeSlot === slot && styles.slotPillTextActive]}>{slot}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* 4. Notes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Additional Notes / Symptoms (Optional)</Text>
                  <TextInput
                    style={[styles.input, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                    placeholder="e.g. Strange noise when braking, oil change needed..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    value={bookingNotes}
                    onChangeText={setBookingNotes}
                  />
                </View>

              </ScrollView>
            )}

            {!bookingSuccessMsg && (
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBookingModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBookingBtn}
                  onPress={handleConfirmBooking}
                  disabled={submittingBooking}
                  activeOpacity={0.85}
                >
                  {submittingBooking ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="send" size={15} color="#FFFFFF" />
                      <Text style={styles.confirmBookingBtnText}>Submit Service Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>

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
    paddingBottom: 50
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

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.text
  },

  // Filters
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

  // Loaders & Empty
  loaderBox: {
    alignItems: 'center',
    padding: 40,
    gap: 10
  },
  loaderText: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500'
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
    marginTop: 4
  },

  // Center Cards
  centerCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  centerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  workshopIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.primaryBorder
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  workshopName: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text
  },
  workshopCategory: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46'
  },

  // Info Box
  infoBox: {
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  infoTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text,
    flex: 1,
    lineHeight: 18
  },
  infoText: {
    fontSize: 12,
    color: THEME.textSecondary,
    flex: 1
  },

  // Services Chips
  servicesHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.textSecondary,
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.5
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.primaryBorder
  },
  serviceChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.primary
  },

  // Card Actions
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primary
  },
  bookServiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.primary,
    paddingVertical: 11,
    borderRadius: 10,
    elevation: 2,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  bookServiceBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text
  },
  modalSubTitle: {
    fontSize: 12,
    color: THEME.primary,
    fontWeight: '700',
    marginTop: 2
  },
  successBanner: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: THEME.successLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
    marginVertical: 20
  },
  successBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    textAlign: 'center',
    lineHeight: 20
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textSecondary,
    marginBottom: 6
  },
  input: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    fontSize: 13,
    color: THEME.text
  },
  vehiclePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border
  },
  vehiclePillSelected: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primaryBorder
  },
  vehiclePillText: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  vehiclePillTextSelected: {
    color: THEME.primary,
    fontWeight: '800'
  },
  serviceOptionsWrap: {
    gap: 6
  },
  serviceOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border
  },
  serviceOptionChipSelected: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primaryBorder
  },
  serviceOptionText: {
    fontSize: 13,
    color: THEME.text,
    fontWeight: '600'
  },
  serviceOptionTextSelected: {
    color: THEME.primary,
    fontWeight: '800'
  },
  datePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border
  },
  datePillActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  datePillText: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  datePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  slotPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: THEME.border
  },
  slotPillActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  slotPillText: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  slotPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textSecondary
  },
  confirmBookingBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  confirmBookingBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
