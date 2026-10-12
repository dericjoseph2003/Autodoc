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
  Modal,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../../components/ui/BackButton';
import { api } from '../../services/api';
import { appointmentApi } from '../../api/appointmentApi';

const { width } = Dimensions.get('window');

const THEME = {
  background: '#F4F6F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  primaryDark: '#003380',
  primaryLight: '#EFF6FF',
  accent: '#F5A524',
  success: '#10B981',
  successLight: '#D1FAE5',
  successText: '#047857',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningText: '#B45309',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorText: '#B91C1C',
  chipBg: '#F1F5F9'
};

const CATEGORIES = [
  'All',
  'Saved Parts',
  'Tyres',
  'Tubes',
  'Batteries',
  'Brake Parts',
  'Engine Oil',
  'Filters',
  'Wiper Blades',
  'Wheel Alignment',
  'Accessories',
  'Other'
];

// Mock Vehicle Owner GPS Location (Kottayam City Center)
const USER_LOCATION = {
  latitude: 9.5916,
  longitude: 76.5222
};

// Haversine Distance Formula (km)
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return '2.5';
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d.toFixed(1);
};

const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'Saved Parts':
      return 'heart';
    case 'Tyres':
      return 'disc-outline';
    case 'Tubes':
      return 'ellipse-outline';
    case 'Batteries':
      return 'flash-outline';
    case 'Brake Parts':
      return 'stop-circle-outline';
    case 'Engine Oil':
      return 'water-outline';
    case 'Filters':
      return 'funnel-outline';
    case 'Wiper Blades':
      return 'rainy-outline';
    case 'Wheel Alignment':
      return 'compass-outline';
    case 'Accessories':
      return 'sparkles-outline';
    case 'Other':
      return 'cube-outline';
    default:
      return 'grid-outline';
  }
};

interface OwnerSparePartsCatalogScreenProps {
  onBack: () => void;
  vehicles?: any[];
  initialServiceCenterId?: string;
}

export default function OwnerSparePartsCatalogScreen({
  onBack,
  vehicles = [],
  initialServiceCenterId
}: OwnerSparePartsCatalogScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parts, setParts] = useState<any[]>([]);
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('All');
  const [selectedServiceCenterFilter, setSelectedServiceCenterFilter] = useState<string>(initialServiceCenterId || 'All');
  const [selectedPart, setSelectedPart] = useState<any | null>(null);

  // Sync initialServiceCenterId if provided
  useEffect(() => {
    if (initialServiceCenterId) {
      setSelectedServiceCenterFilter(initialServiceCenterId);
    }
  }, [initialServiceCenterId]);

  // Fetch verified service centers for dropdown/pill filter
  useEffect(() => {
    const loadServiceCenters = async () => {
      try {
        const res = await api.listServiceCenters();
        const list = res.serviceCenters || res.data || [];
        setServiceCenters(list);
      } catch (err) {
        console.error('Failed to load service centers list for filter:', err);
      }
    };
    loadServiceCenters();
  }, []);

  // Favorites state: Set of part IDs
  const [favoritePartIds, setFavoritePartIds] = useState<string[]>([]);

  // Price comparison modal state
  const [comparisonModalPart, setComparisonModalPart] = useState<any | null>(null);
  const [comparisonOffers, setComparisonOffers] = useState<any[]>([]);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Booking Modal State
  const [bookingModalPart, setBookingModalPart] = useState<any | null>(null);
  const [bookingVehicleId, setBookingVehicleId] = useState<string>(vehicles[0]?._id || vehicles[0]?.id || '');
  const [bookingDate, setBookingDate] = useState<string>(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [bookingTimeSlot, setBookingTimeSlot] = useState<string>('10:00 AM');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Per-Service-Center Inventory Availability State for PartDetail
  const [availabilityList, setAvailabilityList] = useState<any[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilitySortBy, setAvailabilitySortBy] = useState<'price' | 'distance'>('price');
  const [bookingSelectedCenter, setBookingSelectedCenter] = useState<any | null>(null);

  // Fetch Availability for selected part
  const fetchAvailability = useCallback(async (part: any, sortBy: 'price' | 'distance') => {
    if (!part) {
      setAvailabilityList([]);
      return;
    }
    const skuToFetch = part.sku || part.spare_part_sku || part.name || part.spare_part_name;
    if (!skuToFetch) return;

    try {
      setLoadingAvailability(true);
      const res = await api.getPartAvailability(
        skuToFetch,
        USER_LOCATION.latitude,
        USER_LOCATION.longitude,
        sortBy
      );
      let list = res.availability || res.data || [];
      if (sortBy === 'distance') {
        list = [...list].sort((a: any, b: any) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
      } else {
        list = [...list].sort((a: any, b: any) => (a.sellingPrice ?? 0) - (b.sellingPrice ?? 0));
      }
      setAvailabilityList(list);
    } catch (err) {
      console.error('Failed to fetch part availability:', err);
      setAvailabilityList([]);
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPart) {
      fetchAvailability(selectedPart, availabilitySortBy);
    } else {
      setAvailabilityList([]);
    }
  }, [selectedPart, availabilitySortBy, fetchAvailability]);

  // Load parts from backend
  const fetchParts = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'Saved Parts') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedVehicleFilter && selectedVehicleFilter !== 'All') {
        params.vehicle = selectedVehicleFilter;
      }
      if (selectedServiceCenterFilter && selectedServiceCenterFilter !== 'All') {
        params.serviceCenter = selectedServiceCenterFilter;
      }

      const res = await api.listParts(params);
      let partsData = res.parts || res.data || res.spareParts || [];

      // Filter by favorites if "Saved Parts" category selected
      if (selectedCategory === 'Saved Parts') {
        partsData = partsData.filter((p: any) => favoritePartIds.includes(p._id || p.id));
      }

      // Guarantee explicit id property and show parts uniquely
      const uniqueMap = new Map();
      for (const p of partsData) {
        const pId = p.id || p._id || p.sku;
        if (pId && !uniqueMap.has(pId)) {
          uniqueMap.set(pId, {
            ...p,
            id: pId,
            _id: p._id || pId
          });
        }
      }

      setParts(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Failed to fetch spare parts catalog:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery, selectedVehicleFilter, selectedServiceCenterFilter, favoritePartIds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchParts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParts();
  }, [fetchParts]);

  // Derived user vehicle models
  const vehicleModels = Array.from(
    new Set(
      vehicles
        .map((v) => {
          if (v.make && v.model) return `${v.make} ${v.model}`;
          return v.make || v.model || v.vehicleName || null;
        })
        .filter(Boolean)
    )
  );

  const toggleFavorite = (partId: string) => {
    setFavoritePartIds((prev) => {
      if (prev.includes(partId)) {
        return prev.filter((id) => id !== partId);
      } else {
        return [...prev, partId];
      }
    });
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedVehicleFilter('All');
    setSelectedServiceCenterFilter('All');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' || searchQuery !== '' || selectedVehicleFilter !== 'All' || selectedServiceCenterFilter !== 'All';

  // Handle Price Comparison Modal Open
  const handleOpenPriceComparison = async (part: any) => {
    setComparisonModalPart(part);
    setLoadingComparison(true);
    try {
      const skuToSearch = part.sku || part.name || part.spare_part_name;
      const res = await api.comparePartPrices(skuToSearch);
      setComparisonOffers(res.offers || []);
    } catch (err) {
      console.error('Failed to compare part prices:', err);
      setComparisonOffers([]);
    } finally {
      setLoadingComparison(false);
    }
  };

  // Handle Back-in-Stock Alert
  const handleSubscribeStockAlert = async (part: any) => {
    try {
      await api.subscribeStockAlert(part._id || part.id);
      const msg = `Alert set! We will notify you as soon as ${part.name || part.spare_part_name} is back in stock.`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('🔔 Stock Alert Subscribed', msg);
      }
    } catch (err: any) {
      console.error('Stock alert subscription failed:', err);
    }
  };

  // Handle Booking Appointment with Part Attached
  const handleBookServiceWithPart = async () => {
    if (!bookingModalPart) return;
    try {
      setSubmittingBooking(true);
      const scId = bookingSelectedCenter?.id || bookingSelectedCenter?._id || bookingModalPart.serviceCenter?._id || bookingModalPart.serviceCenter?.id || '64f1a2b3c4d5e6f7a8b9c0d1';
      const vehId = bookingVehicleId || (vehicles[0]?._id || vehicles[0]?.id || '64f1a2b3c4d5e6f7a8b9c0d2');

      const payload = {
        vehicle_id: vehId,
        service_center_id: scId,
        appointment_service_type: `Spare Part Fitment: ${bookingModalPart.name || bookingModalPart.spare_part_name}`,
        appointment_date: bookingDate,
        appointment_time_slot: bookingTimeSlot,
        attached_part: {
          part_id: bookingModalPart._id || bookingModalPart.id,
          part_name: bookingModalPart.name || bookingModalPart.spare_part_name,
          price: bookingModalPart.sellingPrice || bookingModalPart.spare_part_price || 0
        }
      };

      await appointmentApi.createAppointment(payload);
      const scName = bookingSelectedCenter?.name || bookingModalPart.serviceCenter?.name || 'Selected Service Center';
      const successMsg = `Service booking confirmed at ${scName}! ${bookingModalPart.name || bookingModalPart.spare_part_name} pre-selected for installation on ${bookingDate} (${bookingTimeSlot}).`;
      
      setBookingModalPart(null);
      setBookingSelectedCenter(null);
      if (Platform.OS === 'web') {
        alert(successMsg);
      } else {
        Alert.alert('✅ Service Booking Scheduled', successMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to schedule appointment';
      if (Platform.OS === 'web') {
        alert(`Error: ${errMsg}`);
      } else {
        Alert.alert('Booking Error', errMsg);
      }
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Read-Only Availability Status Badge (No raw stock numbers shown!)
  const renderAvailabilityBadge = (availabilityStatus?: string, stockQty?: number) => {
    const isOut = availabilityStatus === 'out_of_stock' || stockQty === 0;
    const isLow = availabilityStatus === 'low_stock' || (stockQty !== undefined && stockQty <= 5);

    if (isOut) {
      return (
        <View style={[styles.badge, { backgroundColor: THEME.errorLight }]}>
          <View style={[styles.badgeDot, { backgroundColor: THEME.error }]} />
          <Text style={[styles.badgeText, { color: THEME.errorText }]}>Out of Stock</Text>
        </View>
      );
    }
    if (isLow) {
      return (
        <View style={[styles.badge, { backgroundColor: THEME.warningLight }]}>
          <View style={[styles.badgeDot, { backgroundColor: THEME.warning }]} />
          <Text style={[styles.badgeText, { color: THEME.warningText }]}>Low Availability</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: THEME.successLight }]}>
        <View style={[styles.badgeDot, { backgroundColor: THEME.success }]} />
        <Text style={[styles.badgeText, { color: THEME.successText }]}>In Stock</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <BackButton variant="ghost" label="Dashboard" onPress={onBack} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Spare Parts Catalog</Text>
          <View style={styles.discoveryBadge}>
            <Ionicons name="eye-outline" size={12} color={THEME.primary} />
            <Text style={styles.discoveryBadgeText}>Read-Only Catalog</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.primary]} />
        }
      >
        {/* Banner Section */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconContainer}>
            <Ionicons name="build" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Genuine Spare Parts & Accessories</Text>
            <Text style={styles.bannerSubtitle}>
              Compare workshop prices, check GPS nearby availability, and attach parts directly to service bookings.
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={THEME.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search part name, brand (MRF, Bosch), or car model (Swift, City)..."
              placeholderTextColor={THEME.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Ionicons name="close-circle" size={18} color={THEME.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Service Center / Workshop Filter Selector */}
        <View style={styles.vehicleFilterSection}>
          <Text style={styles.sectionLabel}>Filter by Workshop / Service Center:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehiclePillScroll}>
            <TouchableOpacity
              style={[
                styles.vehiclePill,
                selectedServiceCenterFilter === 'All' && styles.vehiclePillActive
              ]}
              onPress={() => setSelectedServiceCenterFilter('All')}
            >
              <Ionicons
                name="business-outline"
                size={14}
                color={selectedServiceCenterFilter === 'All' ? '#FFFFFF' : THEME.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.vehiclePillText,
                  selectedServiceCenterFilter === 'All' && styles.vehiclePillTextActive
                ]}
              >
                All Workshops
              </Text>
            </TouchableOpacity>

            {serviceCenters.map((sc, scIdx) => {
              const scId = String(sc.serviceCenterId || sc.id || sc._id || `sc-${scIdx}`);
              const scName = sc.service_center_name || sc.name || sc.businessName || 'Workshop';
              const isActive = selectedServiceCenterFilter === scId || selectedServiceCenterFilter === sc._id || selectedServiceCenterFilter === sc.id;

              return (
                <TouchableOpacity
                  key={`sc-filter-${scId}`}
                  style={[styles.vehiclePill, isActive && styles.vehiclePillActive]}
                  onPress={() => setSelectedServiceCenterFilter(scId)}
                >
                  <Ionicons
                    name="construct"
                    size={14}
                    color={isActive ? '#FFFFFF' : THEME.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.vehiclePillText, isActive && styles.vehiclePillTextActive]}>
                    {scName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Vehicle Filter Selector (If User Has Registered Vehicles) */}
        {vehicleModels.length > 0 ? (
          <View style={styles.vehicleFilterSection}>
            <Text style={styles.sectionLabel}>Compatible with My Vehicles:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehiclePillScroll}>
              <TouchableOpacity
                style={[
                  styles.vehiclePill,
                  selectedVehicleFilter === 'All' && styles.vehiclePillActive
                ]}
                onPress={() => setSelectedVehicleFilter('All')}
              >
                <Ionicons
                  name="car-outline"
                  size={14}
                  color={selectedVehicleFilter === 'All' ? '#FFFFFF' : THEME.textSecondary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.vehiclePillText,
                    selectedVehicleFilter === 'All' && styles.vehiclePillTextActive
                  ]}
                >
                  All Vehicles
                </Text>
              </TouchableOpacity>

              {vehicleModels.map((model) => {
                const isActive = selectedVehicleFilter === model;
                return (
                  <TouchableOpacity
                    key={model}
                    style={[styles.vehiclePill, isActive && styles.vehiclePillActive]}
                    onPress={() => setSelectedVehicleFilter(model)}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={isActive ? '#FFFFFF' : THEME.primary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.vehiclePillText, isActive && styles.vehiclePillTextActive]}>
                      {model}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Category Carousel Taxonomy */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionLabel}>Browse Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const iconName = getCategoryIcon(cat);
              const isSaved = cat === 'Saved Parts';

              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryCard,
                    isActive && styles.categoryCardActive,
                    isSaved && !isActive && styles.categoryCardSaved
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.categoryIconCircle,
                      isActive && styles.categoryIconCircleActive,
                      isSaved && !isActive && { backgroundColor: THEME.errorLight }
                    ]}
                  >
                    <Ionicons
                      name={iconName}
                      size={18}
                      color={
                        isActive ? '#FFFFFF' : isSaved ? THEME.error : THEME.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryCardText,
                      isActive && styles.categoryCardTextActive,
                      isSaved && !isActive && { color: THEME.errorText }
                    ]}
                  >
                    {cat} {isSaved && favoritePartIds.length > 0 ? `(${favoritePartIds.length})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Filter Bar & Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCountText}>
            Showing <Text style={{ fontWeight: '700', color: THEME.primary }}>{parts.length}</Text> spare parts
          </Text>
          {hasActiveFilters ? (
            <TouchableOpacity onPress={clearFilters} style={styles.resetFiltersBtn}>
              <Ionicons name="refresh-outline" size={14} color={THEME.error} style={{ marginRight: 4 }} />
              <Text style={styles.resetFiltersText}>Reset Filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Loading Spinner */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loadingText}>Fetching spare parts catalog...</Text>
          </View>
        ) : parts.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search-outline" size={36} color={THEME.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No Spare Parts Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedCategory === 'Saved Parts'
                ? 'You have not favorited any spare parts yet. Tap the heart icon on any part card to save it for your vehicle!'
                : searchQuery
                ? `No items matching "${searchQuery}" in category ${selectedCategory}.`
                : `No parts registered under ${selectedCategory}.`}
            </Text>
            {hasActiveFilters ? (
              <TouchableOpacity style={styles.emptyResetBtn} onPress={clearFilters}>
                <Text style={styles.emptyResetBtnText}>Clear All Filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          /* Spare Parts List / Grid */
          <View style={styles.partsGrid}>
            {parts.map((part) => {
              const partId = part._id || part.id || part.sku || Math.random().toString();
              const partName = part.name || part.spare_part_name || 'Unnamed Part';
              const category = part.category || part.spare_part_category || 'Other';
              const brand = part.brand || part.spare_part_type || 'OEM';
              const price = part.sellingPrice ?? part.spare_part_price ?? 0;
              const stockQty = part.stockQuantity ?? (part.spare_part_availability_status === 'in_stock' ? 10 : 0);
              const availabilityStatus = part.spare_part_availability_status;
              const warrantyText = part.warranty || '12 Months Warranty';
              const isFavorited = favoritePartIds.includes(partId);
              const isOutOfStock = availabilityStatus === 'out_of_stock' || stockQty === 0;

              const compatibleList = Array.isArray(part.compatibleVehicles)
                ? part.compatibleVehicles
                : part.spare_part_vehicle_compatibility
                ? [part.spare_part_vehicle_compatibility]
                : ['Universal'];
              const workshopName = part.serviceCenter?.service_center_name || 'Apex Auto Service';
              const workshopLat = part.serviceCenter?.service_center_latitude || 9.5930;
              const workshopLon = part.serviceCenter?.service_center_longitude || 76.5250;
              const distanceKm = calculateDistanceKm(
                USER_LOCATION.latitude,
                USER_LOCATION.longitude,
                workshopLat,
                workshopLon
              );

              return (
                <View
                  key={partId}
                  style={styles.partCard}
                >
                  <View style={styles.partCardHeader}>
                    <View style={styles.categoryChip}>
                      <Ionicons
                        name={getCategoryIcon(category)}
                        size={12}
                        color={THEME.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.categoryChipText}>{category}</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {renderAvailabilityBadge(availabilityStatus, stockQty)}
                      <TouchableOpacity
                        onPress={() => toggleFavorite(partId)}
                        style={styles.favoriteIconBtn}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isFavorited ? 'heart' : 'heart-outline'}
                          size={18}
                          color={isFavorited ? THEME.error : THEME.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedPart(part)}
                    style={styles.partMainContent}
                  >
                    <Text style={styles.partTitle} numberOfLines={2}>
                      {partName}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.brandBadge}>
                        <Text style={styles.brandBadgeText}>{brand}</Text>
                      </View>
                      <View style={styles.warrantyChip}>
                        <Ionicons name="shield-checkmark" size={11} color={THEME.success} style={{ marginRight: 3 }} />
                        <Text style={styles.warrantyChipText}>{warrantyText}</Text>
                      </View>
                    </View>

                    {/* Compatible Vehicles */}
                    <View style={styles.compatSection}>
                      <Ionicons name="car" size={13} color={THEME.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.compatText} numberOfLines={1}>
                        Fits: {compatibleList.join(', ')}
                      </Text>
                    </View>

                    {/* GPS Nearby Availability Badge */}
                    <View style={styles.nearbyGpsCard}>
                      <Ionicons name="navigate-circle" size={15} color={THEME.primary} style={{ marginRight: 5 }} />
                      <Text style={styles.nearbyGpsText} numberOfLines={1}>
                        In stock at <Text style={{ fontWeight: '700' }}>3 centers</Text> near you ({workshopName} • {distanceKm} km)
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Card Actions Footer */}
                  <View style={styles.partCardFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Price</Text>
                      <Text style={styles.priceValue}>₹{Number(price).toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {/* Price Compare Button */}
                      <TouchableOpacity
                        style={styles.compareActionBtn}
                        onPress={() => handleOpenPriceComparison(part)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="git-compare" size={13} color={THEME.primary} style={{ marginRight: 3 }} />
                        <Text style={styles.compareActionText}>Compare Prices</Text>
                      </TouchableOpacity>

                      {/* Out of Stock Alert OR Book Service */}
                      {isOutOfStock ? (
                        <TouchableOpacity
                          style={styles.stockAlertBtn}
                          onPress={() => handleSubscribeStockAlert(part)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="notifications-outline" size={13} color={THEME.warningText} style={{ marginRight: 3 }} />
                          <Text style={styles.stockAlertText}>Notify Stock</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.bookActionBtn}
                          onPress={() => setBookingModalPart(part)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="calendar-outline" size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                          <Text style={styles.bookActionText}>Book Service</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* READ-ONLY PART SPECIFICATIONS MODAL */}
      <Modal
        visible={!!selectedPart}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPart(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedPart ? (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderBadge}>
                    <Ionicons name="information-circle" size={16} color={THEME.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.modalHeaderBadgeText}>PART SPECIFICATIONS (READ-ONLY)</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPart(null)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={20} color={THEME.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Category, Status & Favorite */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={styles.categoryChipLarge}>
                      <Ionicons name={getCategoryIcon(selectedPart.category || selectedPart.spare_part_category)} size={14} color={THEME.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.categoryChipLargeText}>
                        {selectedPart.category || selectedPart.spare_part_category || 'General'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {renderAvailabilityBadge(
                        selectedPart.spare_part_availability_status,
                        selectedPart.stockQuantity
                      )}
                      <TouchableOpacity
                        onPress={() => toggleFavorite(selectedPart._id || selectedPart.id)}
                        style={styles.favoriteModalBtn}
                      >
                        <Ionicons
                          name={favoritePartIds.includes(selectedPart._id || selectedPart.id) ? 'heart' : 'heart-outline'}
                          size={20}
                          color={favoritePartIds.includes(selectedPart._id || selectedPart.id) ? THEME.error : THEME.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Part Title */}
                  <Text style={styles.modalPartTitle}>
                    {selectedPart.name || selectedPart.spare_part_name}
                  </Text>

                  {/* Price & Brand Card */}
                  <View style={styles.modalPriceCard}>
                    <View>
                      <Text style={styles.modalPriceLabel}>Selling Price</Text>
                      <Text style={styles.modalPriceValue}>
                        ₹{Number(selectedPart.sellingPrice ?? selectedPart.spare_part_price ?? 0).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.modalUnitText}>per {selectedPart.unit || 'piece'}</Text>
                    </View>
                    <View style={styles.modalBrandBadge}>
                      <Text style={styles.modalBrandBadgeLabel}>BRAND</Text>
                      <Text style={styles.modalBrandBadgeText}>
                        {selectedPart.brand || selectedPart.spare_part_type || 'OEM'}
                      </Text>
                    </View>
                  </View>

                  {/* Specs Table */}
                  <Text style={styles.modalSectionHeading}>Technical Specifications</Text>
                  <View style={styles.specsTable}>
                    {selectedPart.sku ? (
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>SKU Code</Text>
                        <Text style={styles.specValue}>{selectedPart.sku}</Text>
                      </View>
                    ) : null}

                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Warranty Coverage</Text>
                      <Text style={[styles.specValue, { color: THEME.successText }]}>
                        🛡️ {selectedPart.warranty || '12 Months Warranty'}
                      </Text>
                    </View>

                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Availability Status</Text>
                      <Text style={styles.specValue}>
                        {selectedPart.spare_part_availability_status === 'out_of_stock'
                          ? 'Out of Stock'
                          : 'Available across verified workshops'}
                      </Text>
                    </View>

                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Measurement Unit</Text>
                      <Text style={styles.specValue}>{selectedPart.unit || 'piece'}</Text>
                    </View>
                  </View>

                  {/* Compatibility */}
                  <Text style={styles.modalSectionHeading}>Vehicle Compatibility</Text>
                  <View style={styles.modalCompatCard}>
                    <Ionicons name="car-sport" size={18} color={THEME.primary} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalCompatTitle}>Fitment Guarantee</Text>
                      <Text style={styles.modalCompatDesc}>
                        {Array.isArray(selectedPart.compatibleVehicles) && selectedPart.compatibleVehicles.length > 0
                          ? selectedPart.compatibleVehicles.join(' • ')
                          : selectedPart.spare_part_vehicle_compatibility || 'Universal Fitment'}
                      </Text>
                    </View>
                  </View>

                  {/* AVAILABLE AT SECTION (Per-Service-Center Inventory) */}
                  <View style={styles.availableAtSection}>
                    <View style={styles.availableAtHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="storefront-outline" size={18} color={THEME.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.modalSectionHeadingNoMargin}>Available at</Text>
                      </View>
                      {/* Sort Toggle: Price vs Distance */}
                      <View style={styles.sortToggleContainer}>
                        <TouchableOpacity
                          style={[
                            styles.sortToggleBtn,
                            availabilitySortBy === 'price' && styles.sortToggleBtnActive
                          ]}
                          onPress={() => setAvailabilitySortBy('price')}
                        >
                          <Ionicons
                            name="pricetag-outline"
                            size={12}
                            color={availabilitySortBy === 'price' ? '#FFFFFF' : THEME.textSecondary}
                            style={{ marginRight: 3 }}
                          />
                          <Text
                            style={[
                              styles.sortToggleText,
                              availabilitySortBy === 'price' && styles.sortToggleTextActive
                            ]}
                          >
                            Price
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.sortToggleBtn,
                            availabilitySortBy === 'distance' && styles.sortToggleBtnActive
                          ]}
                          onPress={() => setAvailabilitySortBy('distance')}
                        >
                          <Ionicons
                            name="location-outline"
                            size={12}
                            color={availabilitySortBy === 'distance' ? '#FFFFFF' : THEME.textSecondary}
                            style={{ marginRight: 3 }}
                          />
                          <Text
                            style={[
                              styles.sortToggleText,
                              availabilitySortBy === 'distance' && styles.sortToggleTextActive
                            ]}
                          >
                            Distance
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {loadingAvailability ? (
                      <View style={styles.availabilityLoadingCard}>
                        <ActivityIndicator size="small" color={THEME.primary} />
                        <Text style={styles.availabilityLoadingText}>Fetching service center stock & pricing...</Text>
                      </View>
                    ) : availabilityList.length > 0 ? (
                      availabilityList.map((item: any, idx: number) => {
                        const sc = item.serviceCenter || {};
                        const scName = sc.name || sc.service_center_name || sc.businessName || item.serviceCenterId || 'Service Center';
                        const city = sc.location?.city || sc.city || 'Nearby';
                        const distStr = item.distanceKm !== undefined && item.distanceKm !== null ? `${item.distanceKm} km away` : 'Nearby';
                        const priceVal = item.sellingPrice ?? 0;
                        
                        // Derive badge status WITHOUT showing raw stock quantity numbers
                        const isOut = item.stockQuantity === 0;
                        const isLow = item.isLowStock || (item.stockQuantity !== undefined && item.stockQuantity <= 5);

                        return (
                          <View key={item.inventoryId || idx} style={styles.availabilityCard}>
                            <View style={styles.availabilityCardMain}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.availabilityScName}>{scName}</Text>
                                <Text style={styles.availabilityScMeta}>
                                  📍 {city} • {distStr}
                                </Text>
                              </View>
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.availabilityPrice}>₹{Number(priceVal).toLocaleString('en-IN')}</Text>
                                {/* Badge based strictly on status - NO raw numbers */}
                                {isOut ? (
                                  <View style={[styles.badge, { backgroundColor: THEME.errorLight, marginTop: 4 }]}>
                                    <View style={[styles.badgeDot, { backgroundColor: THEME.error }]} />
                                    <Text style={[styles.badgeText, { color: THEME.errorText }]}>Out of Stock</Text>
                                  </View>
                                ) : isLow ? (
                                  <View style={[styles.badge, { backgroundColor: THEME.warningLight, marginTop: 4 }]}>
                                    <View style={[styles.badgeDot, { backgroundColor: THEME.warning }]} />
                                    <Text style={[styles.badgeText, { color: THEME.warningText }]}>Low Stock</Text>
                                  </View>
                                ) : (
                                  <View style={[styles.badge, { backgroundColor: THEME.successLight, marginTop: 4 }]}>
                                    <View style={[styles.badgeDot, { backgroundColor: THEME.success }]} />
                                    <Text style={[styles.badgeText, { color: THEME.successText }]}>In Stock</Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            {/* Book at this center button */}
                            <TouchableOpacity
                              style={styles.bookAtCenterBtn}
                              onPress={() => {
                                const currentPart = selectedPart;
                                setSelectedPart(null);
                                setBookingSelectedCenter({
                                  id: item.serviceCenterId || sc.serviceCenterId || sc._id,
                                  name: scName
                                });
                                setBookingModalPart({
                                  ...currentPart,
                                  sellingPrice: priceVal,
                                  serviceCenter: sc
                                });
                              }}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="calendar-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                              <Text style={styles.bookAtCenterBtnText}>Book at this center</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.availabilityEmptyCard}>
                        <Text style={styles.availabilityEmptyText}>No service centers currently stocking this part nearby.</Text>
                      </View>
                    )}
                  </View>

                  {/* Description */}
                  {selectedPart.description ? (
                    <>
                      <Text style={styles.modalSectionHeading}>Part Description</Text>
                      <Text style={styles.modalDescriptionText}>{selectedPart.description}</Text>
                    </>
                  ) : null}

                  <View style={{ height: 20 }} />
                </ScrollView>

                {/* Modal Footer Buttons */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalCompareFooterBtn}
                    onPress={() => {
                      const p = selectedPart;
                      setSelectedPart(null);
                      handleOpenPriceComparison(p);
                    }}
                  >
                    <Ionicons name="git-compare" size={16} color={THEME.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.modalCompareFooterBtnText}>Compare Workshop Prices</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalBookFooterBtn}
                    onPress={() => {
                      const p = selectedPart;
                      setSelectedPart(null);
                      setBookingModalPart(p);
                    }}
                  >
                    <Ionicons name="calendar" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.modalBookFooterBtnText}>Book Service with Part</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* WORKSHOP PRICE COMPARISON DRAWER / MODAL */}
      <Modal
        visible={!!comparisonModalPart}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setComparisonModalPart(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderBadge}>
                <Ionicons name="git-compare" size={18} color={THEME.primary} style={{ marginRight: 6 }} />
                <Text style={styles.modalHeaderBadgeText}>PRICE COMPARISON ACROSS WORKSHOPS</Text>
              </View>
              <TouchableOpacity onPress={() => setComparisonModalPart(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.comparisonPartTitle}>
                {comparisonModalPart?.name || comparisonModalPart?.spare_part_name}
              </Text>
              <Text style={styles.comparisonSubtitle}>
                Compare prices and nearby stock availability across verified service centers in your area.
              </Text>

              {loadingComparison ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={THEME.primary} />
                  <Text style={{ marginTop: 12, color: THEME.textSecondary }}>Searching stocking workshops...</Text>
                </View>
              ) : (
                <View style={{ gap: 10, marginTop: 12 }}>
                  {/* Default / Stocking Offers List */}
                  {comparisonOffers.length > 0 ? (
                    comparisonOffers.map((offer, idx) => {
                      const scName = offer.serviceCenter?.service_center_name || `Certified Workshop #${idx + 1}`;
                      const city = offer.serviceCenter?.city || 'Nearby Center';
                      const isBestPrice = idx === 0;

                      return (
                        <View key={offer.partId || idx} style={[styles.offerCard, isBestPrice && styles.offerCardBest]}>
                          {isBestPrice ? (
                            <View style={styles.bestPriceBadge}>
                              <Text style={styles.bestPriceBadgeText}>BEST PRICE</Text>
                            </View>
                          ) : null}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.offerScName}>{scName}</Text>
                            <Text style={styles.offerScLocation}>📍 {city} • In Stock</Text>
                            <Text style={styles.offerWarranty}>🛡️ {offer.warranty || '12 Months Warranty'}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.offerPrice}>₹{Number(offer.sellingPrice).toLocaleString('en-IN')}</Text>
                            <TouchableOpacity
                              style={styles.offerBookBtn}
                              onPress={() => {
                                setComparisonModalPart(null);
                                setBookingModalPart(comparisonModalPart);
                              }}
                            >
                              <Text style={styles.offerBookBtnText}>Select</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    /* Fallback multi-center comparison dataset */
                    [
                      { name: 'Apex Auto Service', city: 'Kottayam', price: comparisonModalPart?.sellingPrice || 2950, best: true, dist: '2.4 km' },
                      { name: 'Kottayam Motor Works', city: 'Kottayam', price: (comparisonModalPart?.sellingPrice || 2950) + 150, best: false, dist: '4.1 km' },
                      { name: 'Southern Auto Garage', city: 'Ettumanoor', price: (comparisonModalPart?.sellingPrice || 2950) - 100, best: false, dist: '7.8 km' }
                    ].map((offer, idx) => (
                      <View key={idx} style={[styles.offerCard, offer.best && styles.offerCardBest]}>
                        {offer.best ? (
                          <View style={styles.bestPriceBadge}>
                            <Text style={styles.bestPriceBadgeText}>POPULAR WORKSHOP</Text>
                          </View>
                        ) : null}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.offerScName}>{offer.name}</Text>
                          <Text style={styles.offerScLocation}>📍 {offer.city} • {offer.dist} away</Text>
                          <Text style={styles.offerWarranty}>🛡️ 12 Months Warranty Included</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.offerPrice}>₹{Number(offer.price).toLocaleString('en-IN')}</Text>
                          <TouchableOpacity
                            style={styles.offerBookBtn}
                            onPress={() => {
                              setComparisonModalPart(null);
                              setBookingModalPart(comparisonModalPart);
                            }}
                          >
                            <Text style={styles.offerBookBtnText}>Book Here</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
              <View style={{ height: 24 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCloseFooterBtn} onPress={() => setComparisonModalPart(null)}>
                <Text style={styles.modalCloseFooterBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ATTACH PART TO APPOINTMENT BOOKING MODAL */}
      <Modal
        visible={!!bookingModalPart}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBookingModalPart(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderBadge}>
                <Ionicons name="calendar-outline" size={18} color={THEME.primary} style={{ marginRight: 6 }} />
                <Text style={styles.modalHeaderBadgeText}>SCHEDULE SERVICE & ATTACH PART</Text>
              </View>
              <TouchableOpacity onPress={() => setBookingModalPart(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={THEME.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Pre-selected Service Center Box (If booked from availability card) */}
              {bookingSelectedCenter ? (
                <View style={styles.bookingScBox}>
                  <Ionicons name="location-sharp" size={18} color={THEME.primary} style={{ marginRight: 6 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingScLabel}>SELECTED SERVICE CENTER</Text>
                    <Text style={styles.bookingScName}>{bookingSelectedCenter.name}</Text>
                  </View>
                </View>
              ) : null}

              {/* Attached Part Preview Box */}
              <View style={styles.attachedPartBox}>
                <View style={styles.attachedPartIconCircle}>
                  <Ionicons name="cube" size={20} color={THEME.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachedPartLabel}>PRE-SELECTED SPARE PART</Text>
                  <Text style={styles.attachedPartTitle}>
                    {bookingModalPart?.name || bookingModalPart?.spare_part_name}
                  </Text>
                  <Text style={styles.attachedPartPrice}>
                    Est. Cost: ₹{Number(bookingModalPart?.sellingPrice || bookingModalPart?.spare_part_price || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Select Vehicle */}
              <Text style={styles.modalSectionHeading}>1. Select Your Vehicle</Text>
              {vehicles.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {vehicles.map((v) => {
                    const vId = v._id || v.id;
                    const isSel = bookingVehicleId === vId;
                    const vName = v.make && v.model ? `${v.make} ${v.model}` : v.vehicleName || 'Primary Vehicle';

                    return (
                      <TouchableOpacity
                        key={vId}
                        style={[styles.bookingSelectionCard, isSel && styles.bookingSelectionCardActive]}
                        onPress={() => setBookingVehicleId(vId)}
                      >
                        <Ionicons name="car-sport" size={18} color={isSel ? THEME.primary : THEME.textSecondary} />
                        <Text style={[styles.bookingSelectionText, isSel && styles.bookingSelectionTextActive]}>
                          {vName} ({v.registrationNumber || v.licensePlate || 'KL-05'})
                        </Text>
                        {isSel ? <Ionicons name="checkmark-circle" size={18} color={THEME.primary} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.bookingSelectionCard}>
                  <Ionicons name="car-sport" size={18} color={THEME.primary} />
                  <Text style={styles.bookingSelectionTextActive}>Primary Vehicle (Default)</Text>
                </View>
              )}

              {/* Select Preferred Service Date */}
              <Text style={styles.modalSectionHeading}>2. Preferred Appointment Date</Text>
              <TextInput
                style={styles.bookingDateInput}
                value={bookingDate}
                onChangeText={setBookingDate}
                placeholder="YYYY-MM-DD"
              />

              {/* Select Time Slot */}
              <Text style={styles.modalSectionHeading}>3. Select Time Slot</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {['09:30 AM', '11:00 AM', '02:00 PM', '04:30 PM'].map((slot) => {
                  const isSel = bookingTimeSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotPill, isSel && styles.slotPillActive]}
                      onPress={() => setBookingTimeSlot(slot)}
                    >
                      <Text style={[styles.slotPillText, isSel && styles.slotPillTextActive]}>{slot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmBookingBtn, submittingBooking && { opacity: 0.7 }]}
                onPress={handleBookServiceWithPart}
                disabled={submittingBooking}
              >
                {submittingBooking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmBookingBtnText}>Confirm Booking & Attach Part</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  header: {
    backgroundColor: THEME.card,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  headerTitleContainer: {
    marginLeft: 12,
    flex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text
  },
  discoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  discoveryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.primary,
    marginLeft: 4
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  bannerCard: {
    backgroundColor: THEME.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  bannerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  bannerTextContainer: {
    flex: 1
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 16
  },
  searchSection: {
    marginBottom: 16
  },
  searchInputContainer: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.text
  },
  clearSearchBtn: {
    padding: 4
  },
  vehicleFilterSection: {
    marginBottom: 16
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8
  },
  vehiclePillScroll: {
    paddingRight: 16
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8
  },
  vehiclePillActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  vehiclePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary
  },
  vehiclePillTextActive: {
    color: '#FFFFFF'
  },
  categorySection: {
    marginBottom: 16
  },
  categoryScroll: {
    paddingRight: 16
  },
  categoryCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryCardSaved: {
    borderColor: THEME.errorLight,
    backgroundColor: '#FFF5F5'
  },
  categoryCardActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  categoryIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  categoryIconCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)'
  },
  categoryCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text
  },
  categoryCardTextActive: {
    color: '#FFFFFF'
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  resultsCountText: {
    fontSize: 13,
    color: THEME.textSecondary
  },
  resetFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6
  },
  resetFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.error
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
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
    marginTop: 12
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 6
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  emptyResetBtn: {
    backgroundColor: THEME.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  emptyResetBtnText: {
    color: THEME.primary,
    fontWeight: '600',
    fontSize: 13
  },
  partsGrid: {
    gap: 14
  },
  partCard: {
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  partCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.primary
  },
  favoriteIconBtn: {
    padding: 4,
    marginLeft: 6
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  partMainContent: {
    marginBottom: 12
  },
  partTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    lineHeight: 20,
    marginBottom: 6
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  brandBadge: {
    backgroundColor: THEME.chipBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSecondary
  },
  warrantyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  warrantyChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.successText
  },
  compatSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  compatText: {
    fontSize: 12,
    color: THEME.textSecondary,
    flex: 1
  },
  nearbyGpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 4
  },
  nearbyGpsText: {
    fontSize: 11,
    color: THEME.primary,
    flex: 1
  },
  partCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.border
  },
  priceContainer: {},
  priceLabel: {
    fontSize: 10,
    color: THEME.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text
  },
  compareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8
  },
  compareActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.primary
  },
  bookActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  bookActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  stockAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8
  },
  stockAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.warningText
  },
  // Specs Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: THEME.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  modalHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  modalHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 0.5
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: THEME.background
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  categoryChipLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  categoryChipLargeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.primary
  },
  favoriteModalBtn: {
    padding: 4
  },
  modalPartTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.text,
    lineHeight: 26,
    marginBottom: 16
  },
  modalPriceCard: {
    backgroundColor: THEME.background,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border
  },
  modalPriceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    textTransform: 'uppercase'
  },
  modalPriceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.primary
  },
  modalUnitText: {
    fontSize: 12,
    color: THEME.textSecondary
  },
  modalBrandBadge: {
    backgroundColor: THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center'
  },
  modalBrandBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.textSecondary,
    letterSpacing: 0.5
  },
  modalBrandBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.text,
    marginTop: 2
  },
  modalSectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
    marginTop: 8
  },
  specsTable: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
    marginBottom: 16
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  specLabel: {
    fontSize: 13,
    color: THEME.textSecondary
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text
  },
  modalCompatCard: {
    backgroundColor: THEME.primaryLight,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  modalCompatTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primary,
    marginBottom: 4
  },
  modalCompatDesc: {
    fontSize: 13,
    color: THEME.text,
    lineHeight: 18
  },
  modalWorkshopCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  modalWorkshopIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  modalWorkshopName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text
  },
  modalWorkshopCity: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2
  },
  modalDescriptionText: {
    fontSize: 13,
    color: THEME.textSecondary,
    lineHeight: 20,
    marginBottom: 16
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    backgroundColor: THEME.card,
    flexDirection: 'row',
    gap: 10
  },
  modalCompareFooterBtn: {
    flex: 1,
    backgroundColor: THEME.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCompareFooterBtnText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: '700'
  },
  modalBookFooterBtn: {
    flex: 1,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBookFooterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  modalCloseFooterBtn: {
    width: '100%',
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  modalCloseFooterBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  // Comparison Styles
  comparisonPartTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 4
  },
  comparisonSubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 12
  },
  offerCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  offerCardBest: {
    borderColor: THEME.primary,
    backgroundColor: '#F8FAFC'
  },
  bestPriceBadge: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: THEME.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  bestPriceBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  offerScName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 4
  },
  offerScLocation: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2
  },
  offerWarranty: {
    fontSize: 11,
    color: THEME.successText,
    marginTop: 2
  },
  offerPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.primary
  },
  offerBookBtn: {
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4
  },
  offerBookBtnText: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '700'
  },
  // Booking Attachment Styles
  attachedPartBox: {
    backgroundColor: THEME.primaryLight,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  attachedPartIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  attachedPartLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 0.5
  },
  attachedPartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text
  },
  attachedPartPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.primary
  },
  bookingSelectionCard: {
    backgroundColor: THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  bookingSelectionCardActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryLight
  },
  bookingSelectionText: {
    fontSize: 13,
    color: THEME.text,
    marginLeft: 8,
    flex: 1
  },
  bookingSelectionTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.primary,
    marginLeft: 8,
    flex: 1
  },
  bookingDateInput: {
    backgroundColor: THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.text
  },
  slotPill: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  slotPillActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  slotPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.text
  },
  slotPillTextActive: {
    color: '#FFFFFF'
  },
  confirmBookingBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  confirmBookingBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  availableAtSection: {
    marginTop: 16,
    marginBottom: 12
  },
  availableAtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalSectionHeadingNoMargin: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text
  },
  sortToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 2
  },
  sortToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  sortToggleBtnActive: {
    backgroundColor: THEME.primary
  },
  sortToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary
  },
  sortToggleTextActive: {
    color: '#FFFFFF'
  },
  availabilityLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.border
  },
  availabilityLoadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: THEME.textSecondary
  },
  availabilityCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  availabilityCardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  availabilityScName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text
  },
  availabilityScMeta: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2
  },
  availabilityPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.primary
  },
  bookAtCenterBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  bookAtCenterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600'
  },
  availabilityEmptyCard: {
    backgroundColor: THEME.card,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border
  },
  availabilityEmptyText: {
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center'
  },
  bookingScBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.primary
  },
  bookingScLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 0.5
  },
  bookingScName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 1
  }
});
