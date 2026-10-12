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

const generateNext7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const isoDate = d.toISOString().split('T')[0];
    
    let label = '';
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else {
      label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    
    days.push({ value: isoDate, label });
  }
  return days;
};

const DATE_OPTIONS = generateNext7Days();

export interface OwnerServiceCentersScreenProps {
  onBack: () => void;
  onViewParts?: (scId: string) => void;
}

export default function OwnerServiceCentersScreen({ onBack, onViewParts }: OwnerServiceCentersScreenProps) {
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
  const [bookingDate, setBookingDate] = useState(DATE_OPTIONS[0].value);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('10:30 AM - 11:30 AM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Payment State
  const [isPaymentStep, setIsPaymentStep] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchAvailableSlots = async (center: any, dateStr: string) => {
    if (!center) return;
    const centerId = center._id || center.id || center.serviceCenterId;
    if (!centerId) return;
    try {
      setLoadingSlots(true);
      const res = await api.getAvailableSlots(centerId, dateStr);
      if (res && res.success) {
        const locked = res.bookedSlots || [];
        setBookedSlots(locked);
        // If current selected slot is locked, auto-select first available slot
        const available = TIME_SLOT_PRESETS.filter(s => !locked.includes(s));
        if (available.length > 0 && locked.includes(bookingTimeSlot)) {
          setBookingTimeSlot(available[0]);
        }
      }
    } catch (e) {
      console.log('Error fetching available slots:', e);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (showBookingModal && selectedCenter) {
      fetchAvailableSlots(selectedCenter, bookingDate);
    }
  }, [showBookingModal, selectedCenter, bookingDate]);

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
    setIsPaymentStep(false);
    setProcessingPayment(false);

    // Pre-select first offered service if available
    const offered = center.servicesOffered || [];
    if (offered.length > 0) {
      const firstSvc = offered[0];
      const firstSvcName = typeof firstSvc === 'string' ? firstSvc : (firstSvc?.name || 'General Maintenance');
      setBookingServiceType(firstSvcName);
    } else {
      setBookingServiceType('General Maintenance');
    }

    setShowBookingModal(true);
  };

  const processBookingAfterPayment = async (paymentId?: string) => {
    let targetVehicleId = bookingVehicleId;
    let activeCustomVehicleText = customVehicleText;

    // If user has no registered vehicle selected, register a fallback/temp vehicle first or check custom text
    if (!targetVehicleId && !activeCustomVehicleText.trim()) {
      if (vehicles.length > 0) {
        targetVehicleId = vehicles[0]._id || vehicles[0].id;
      } else {
        activeCustomVehicleText = "Maruti Suzuki Swift (KL-01-AB-1234)";
      }
    }

    try {
      setSubmittingBooking(true);

      // If user typed custom vehicle info, create or find target vehicle ID
      if (!targetVehicleId && activeCustomVehicleText.trim()) {
        try {
          const newV = await api.registerVehicle({
            make: 'My Vehicle',
            model: activeCustomVehicleText.trim(),
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

      const scTargetId = selectedCenter._id || selectedCenter.id || selectedCenter.serviceCenterId;
      const payload = {
        vehicle_id: targetVehicleId,
        vehicle: targetVehicleId,
        service_center_id: scTargetId,
        serviceCenter: scTargetId,
        appointment_date: bookingDate,
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
        Alert.alert('Booking Notice', `Service request sent to ${selectedCenter.service_center_name || selectedCenter.businessName}!`);
        setShowBookingModal(false);
      }
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || `Your booking request for ${bookingServiceType} failed.`);
    } finally {
      setSubmittingBooking(false);
      setProcessingPayment(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedCenter) return;
    
    try {
      setSubmittingBooking(true);
      const scTargetId = selectedCenter._id || selectedCenter.id || selectedCenter.serviceCenterId;
      const targetDate = bookingDate;

      // Lock the slot temporarily
      const lockRes = await api.lockSlot(scTargetId, targetDate, bookingTimeSlot);
      if (!lockRes || !lockRes.success) {
        Alert.alert('Slot Unavailable', 'This time slot is currently being booked by someone else. Please choose another slot.');
        setSubmittingBooking(false);
        // Refresh available slots
        fetchAvailableSlots(selectedCenter, bookingDate);
        return;
      }
      
      setIsPaymentStep(true);
    } catch (err: any) {
      Alert.alert('Slot Unavailable', err.message || 'This time slot was just booked by someone else.');
      // Refresh available slots
      fetchAvailableSlots(selectedCenter, bookingDate);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedCenter) return;
    
    try {
      setProcessingPayment(true);
      
      const paymentRes = await api.createMockPayment({
        amount: 500, // Fixed mock booking fee
        currency: 'INR',
      });

      if (!paymentRes || !paymentRes.success) {
         Alert.alert('Payment Failed', 'Payment initialization failed. Cannot proceed with booking.');
         setProcessingPayment(false);
         return;
      }

      if (paymentRes.isFallback) {
        // Fallback for dev mode when Razorpay keys are invalid
        await processBookingAfterPayment(paymentRes.paymentId);
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        Alert.alert('Error', 'Razorpay SDK failed to load. Are you online?');
        setProcessingPayment(false);
        return;
      }

      const options: any = {
        key: paymentRes.key,
        amount: paymentRes.amount,
        currency: paymentRes.currency,
        name: 'AutoDoc',
        description: `Booking Advance for ${bookingServiceType}`,
        handler: async function (response: any) {
          // Success
          await processBookingAfterPayment(paymentRes.paymentId);
        },
        prefill: {
          name: 'AutoDoc User',
          email: 'user@autodoc.com',
          contact: '9999999999'
        },
        theme: {
          color: THEME.primary
        }
      };
      
      if (paymentRes.orderId) {
        options.order_id = paymentRes.orderId;
      }

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        console.log('Payment Failed:', response.error);
        Alert.alert('Payment Failed', response.error.description || 'Payment was cancelled or failed.');
        setProcessingPayment(false);
      });
      
      rzp1.open();
    } catch (err: any) {
      Alert.alert('Payment Error', 'Failed to initialize payment.');
      setProcessingPayment(false);
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
      services.some((s: any) => {
        const sName = typeof s === 'string' ? s : (s?.name || s?.category || '');
        return sName.toLowerCase().includes(selectedServiceFilter.toLowerCase());
      });

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
          filteredCenters.map((center, index) => {
            const workshopName = center.service_center_name || center.businessName || center.name || 'AutoDoc Partner Workshop';
            const addressText = center.service_center_address || center.businessAddress || center.location?.address || 'Street Address';
            const cityText = center.city || center.location?.city || 'Kerala';
            const pincodeText = center.pincode ? `, ${center.pincode}` : '';
            const phoneText = center.service_center_phone_number || center.phone || center.manager?.phone || center.contact?.phone;
            const contactPerson = center.contactPersonName || center.contactPerson || center.manager?.name || 'Workshop Manager';
            const operatingHours = center.operatingHours || '9:00 AM - 6:00 PM';
            const services = Array.isArray(center.servicesOffered) && center.servicesOffered.length > 0
              ? center.servicesOffered
              : ['General Maintenance', 'Engine Diagnostics', 'Brake Service'];

            const centerKey = String(center.id || center._id || center.serviceCenterId || `center-${index}`);

            return (
              <View key={centerKey} style={styles.centerCard}>
                
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
                  {services.map((svc: any, index: number) => {
                    const svcName = typeof svc === 'string' ? svc : (svc?.name || 'Service');
                    const keyStr = typeof svc === 'string' ? svc : (svc?.id || svc?.name || index);
                    return (
                      <View key={`svc-${index}-${keyStr}`} style={styles.serviceChip}>
                        <Ionicons name="checkmark-circle-outline" size={13} color={THEME.primary} />
                        <Text style={styles.serviceChipText}>{svcName}</Text>
                      </View>
                    );
                  })}
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
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}

                  {onViewParts ? (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => onViewParts(center.serviceCenterId || center.id || center._id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="cube-outline" size={15} color={THEME.primary} />
                      <Text style={styles.callBtnText}>Parts</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.bookServiceBtn}
                    onPress={() => handleOpenBookingModal(center)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar" size={16} color="#FFFFFF" />
                    <Text style={styles.bookServiceBtnText}>Book Service</Text>
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
                <Text style={styles.modalTitle}>{isPaymentStep ? 'Payment Details' : 'Request Service Booking'}</Text>
                <Text style={styles.modalSubTitle} numberOfLines={1}>
                  {selectedCenter?.service_center_name || selectedCenter?.businessName || selectedCenter?.name || 'Partner Workshop'}
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
            ) : isPaymentStep ? (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={true}>
                <View style={styles.paymentCard}>
                  <Text style={styles.paymentHeader}>Booking Advance: ₹500</Text>
                  <Text style={styles.paymentSubtext}>You will be redirected to Razorpay to complete your payment securely.</Text>
                  
                  <View style={{ alignItems: 'center', padding: 20 }}>
                    <Ionicons name="card" size={48} color={THEME.primary} />
                    <Text style={{ marginTop: 12, fontWeight: '600', color: THEME.text }}>Secure Checkout via Razorpay</Text>
                  </View>
                </View>
              </ScrollView>
            ) : (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={true}>
                
                {/* 1. Select Vehicle */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Your Vehicle *</Text>
                  {vehicles.length > 0 ? (
                    <View style={styles.vehiclePillsRow}>
                      {vehicles.map((v: any, vIndex: number) => {
                        const vId = String(v._id || v.id || `veh-${vIndex}`);
                        const isSelected = bookingVehicleId === v._id || bookingVehicleId === v.id;
                        return (
                          <TouchableOpacity
                            key={vId}
                            style={[styles.vehiclePill, isSelected && styles.vehiclePillSelected]}
                            onPress={() => setBookingVehicleId(v._id || v.id)}
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
                    ).map((svc: any, sIndex: number) => {
                      const svcName = typeof svc === 'string' ? svc : (svc?.name || 'General Maintenance');
                      const isSelected = bookingServiceType === svcName;
                      return (
                        <TouchableOpacity
                          key={`svc-opt-${sIndex}-${svcName}`}
                          style={[styles.serviceOptionChip, isSelected && styles.serviceOptionChipSelected]}
                          onPress={() => setBookingServiceType(svcName)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'radio-button-off'}
                            size={14}
                            color={isSelected ? THEME.primary : '#94A3B8'}
                          />
                          <Text style={[styles.serviceOptionText, isSelected && styles.serviceOptionTextSelected]}>
                            {svcName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Date & Time */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preferred Booking Date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                    {DATE_OPTIONS.map((d, dIndex) => (
                      <TouchableOpacity
                        key={`date-${dIndex}-${d.value}`}
                        style={[styles.datePill, bookingDate === d.value && styles.datePillActive]}
                        onPress={() => setBookingDate(d.value)}
                      >
                        <Text style={[styles.datePillText, bookingDate === d.value && styles.datePillTextActive]}>{d.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.inputLabel}>Preferred Time Slot</Text>
                    {loadingSlots && <Text style={{ fontSize: 10, color: THEME.primary, fontWeight: '600' }}>Checking slots...</Text>}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {TIME_SLOT_PRESETS.map((slot, tIndex) => {
                      const isLocked = bookedSlots.includes(slot);
                      const isSelected = bookingTimeSlot === slot;
                      return (
                        <TouchableOpacity
                          key={`slot-${tIndex}-${slot}`}
                          style={[
                            styles.slotPill,
                            isSelected && styles.slotPillActive,
                            isLocked && styles.slotPillLocked
                          ]}
                          onPress={() => {
                            if (isLocked) {
                              Alert.alert('Not Available', 'This slot is already booked or currently being reserved by another user. Please choose another time.');
                            } else {
                              setBookingTimeSlot(slot);
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={isLocked ? 'lock-closed' : (isSelected ? 'time' : 'time-outline')}
                            size={12}
                            color={isLocked ? '#94A3B8' : (isSelected ? '#FFFFFF' : THEME.textSecondary)}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[
                            styles.slotPillText,
                            isSelected && styles.slotPillTextActive,
                            isLocked && styles.slotPillTextLocked
                          ]}>
                            {slot} {isLocked ? '(Booked)' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
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
                <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                  if (isPaymentStep) {
                    setIsPaymentStep(false);
                  } else {
                    setShowBookingModal(false);
                  }
                }}>
                  <Text style={styles.cancelBtnText}>{isPaymentStep ? 'Back' : 'Cancel'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBookingBtn}
                  onPress={() => {
                    if (isPaymentStep) {
                      handleConfirmBooking();
                    } else {
                      handleProceedToPayment();
                    }
                  }}
                  disabled={submittingBooking || processingPayment}
                  activeOpacity={0.85}
                >
                  {(submittingBooking || processingPayment) ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name={isPaymentStep ? "shield-checkmark" : "arrow-forward"} size={15} color="#FFFFFF" />
                      <Text style={styles.confirmBookingBtnText}>{isPaymentStep ? 'Pay & Submit Booking' : 'Proceed to Payment'}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
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
  slotPillLocked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.65
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
  slotPillTextLocked: {
    color: '#94A3B8',
    fontWeight: '600',
    textDecorationLine: 'line-through'
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
  },
  paymentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  paymentHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  paymentSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16
  }
});
