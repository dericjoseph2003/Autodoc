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
  Alert,
  Switch,
  Platform
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
  errorLight: '#FEE2E2',
  accent: '#16A34A',
  accentLight: '#DCFCE7'
};

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: string;
  duration: string;
  description: string;
  isAvailable: boolean;
}

const DEFAULT_PRESET_SERVICES: ServiceItem[] = [
  {
    id: 'preset-sakthi-1',
    name: 'Puncture Repair',
    category: 'Maintenance',
    price: '200',
    duration: '45 mins',
    description: 'Tyre punctured — patch or tube repair',
    isAvailable: true
  },
  {
    id: 'preset-sakthi-2',
    name: 'Tyre Replacement / New Tyre Fitting',
    category: 'Maintenance',
    price: '2500',
    duration: '30 mins',
    description: 'Fitting a new tyre, per wheel',
    isAvailable: true
  },
  {
    id: 'preset-sakthi-3',
    name: 'Wheel Alignment',
    category: 'Brakes & Suspension',
    price: '799',
    duration: '40 mins',
    description: 'Adjusting wheel angles for correct tracking',
    isAvailable: true
  },
  {
    id: 'preset-sakthi-4',
    name: 'Wheel Balancing',
    category: 'Brakes & Suspension',
    price: '399',
    duration: '25 mins',
    description: 'Balancing wheel weight to reduce vibration',
    isAvailable: true
  },
  {
    id: 'preset-sakthi-5',
    name: 'Nitrogen Air Filling',
    category: 'Maintenance',
    price: '199',
    duration: '10 mins',
    description: 'Nitrogen top-up, per wheel',
    isAvailable: true
  },
  {
    id: 'preset-sakthi-6',
    name: 'Tyre Rotation',
    category: 'Maintenance',
    price: '599',
    duration: '30 mins',
    description: 'Rotating tyres for even wear',
    isAvailable: true
  },
  {
    id: 'preset-sakthi-7',
    name: 'Old Tyre Buyback/Exchange',
    category: 'Maintenance',
    price: '0',
    duration: '15 mins',
    description: 'Exchange/buyback value applied on new purchase',
    isAvailable: true
  },
  {
    id: 'preset-sakthi-8',
    name: 'Shock Absorber Replacement',
    category: 'Brakes & Suspension',
    price: '3499',
    duration: '90 mins',
    description: 'Replacing worn shock absorbers, per pair',
    isAvailable: true
  },
  {
    id: 'preset-sakthi-9',
    name: 'Suspension Bushing Replacement',
    category: 'Brakes & Suspension',
    price: '1899',
    duration: '60 mins',
    description: 'Replacing worn suspension bushings',
    isAvailable: true
  },
  {
    id: 'preset-sakthi-10',
    name: 'Steering Rack Repair',
    category: 'Brakes & Suspension',
    price: '4999',
    duration: '120 mins',
    description: 'Repair/replacement of steering rack assembly',
    isAvailable: true
  },
  {
    id: 'preset-1',
    name: 'Periodic Synthetic Oil & Filter Change',
    category: 'Maintenance',
    price: '1999',
    duration: '45 mins',
    description: 'Complete replacement of engine oil with high-grade synthetic oil, oil filter replacement, and 15-point inspection.',
    isAvailable: true
  },
  {
    id: 'preset-2',
    name: 'Brake Pad Inspection & Replacement',
    category: 'Brakes & Suspension',
    price: '2499',
    duration: '60 mins',
    description: 'Front and rear brake caliper cleaning, pad wear thickness check, and OEM replacement brake pad installation.',
    isAvailable: true
  },
  {
    id: 'preset-3',
    name: 'Computerized 3D Wheel Alignment & Balancing',
    category: 'Brakes & Suspension',
    price: '1199',
    duration: '40 mins',
    description: 'Laser wheel alignment, 4-wheel dynamic balancing, and tire tread depth evaluation.',
    isAvailable: true
  },
  {
    id: 'preset-4',
    name: 'AC System Diagnostics & Gas Recharge',
    category: 'Electrical & AC',
    price: '1799',
    duration: '50 mins',
    description: 'Air conditioning compressor leak test, cabin filter cleanup, and eco-friendly refrigerant gas top-up.',
    isAvailable: true
  },
  {
    id: 'preset-5',
    name: 'Full Vehicle Computer OBD-II Diagnostics',
    category: 'Diagnostics',
    price: '899',
    duration: '30 mins',
    description: 'Comprehensive electronic ECU error code scan, sensor health check, and clear warning lights with report.',
    isAvailable: true
  },
  {
    id: 'preset-6',
    name: 'Battery Health Test & Terminal Service',
    category: 'Electrical & AC',
    price: '499',
    duration: '20 mins',
    description: 'Battery voltage and cranking amp test, terminal corrosion cleaning, and charging system inspection.',
    isAvailable: true
  },
  {
    id: 'preset-7',
    name: 'Premium Foam Wash & Interior Vacuuming',
    category: 'Detailing & Wash',
    price: '799',
    duration: '60 mins',
    description: 'High-pressure foam exterior wash, dashboard polishing, tire dressing, and deep interior carpet vacuuming.',
    isAvailable: true
  },
  {
    id: 'preset-8',
    name: 'Complete Engine Tune-up & Spark Plug Service',
    category: 'Engine & Transmission',
    price: '3499',
    duration: '90 mins',
    description: 'Throttle body cleaning, iridium spark plug replacement, air filter swap, and fuel injector check.',
    isAvailable: true
  }
];

const CATEGORIES = [
  'All',
  'Maintenance',
  'Engine & Transmission',
  'Brakes & Suspension',
  'Electrical & AC',
  'Diagnostics',
  'Detailing & Wash'
];

interface ServiceCenterServicesScreenProps {
  user: any;
  onBack: () => void;
}

export default function ServiceCenterServicesScreen({ user, onBack }: ServiceCenterServicesScreenProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [centerId, setCenterId] = useState<string>('');
  const [centerName, setCenterName] = useState<string>('Service Center');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State for Add / Edit Service
  const [showModal, setShowModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Maintenance');
  const [formPrice, setFormPrice] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);

  // Load existing service center services from backend
  const loadServices = async () => {
    try {
      setLoading(true);
      let sc: any = null;

      try {
        const myRes = await api.getMyServiceCenter();
        if (myRes && myRes.serviceCenter) {
          sc = myRes.serviceCenter;
        }
      } catch (_) {}

      if (!sc) {
        try {
          const listRes = await api.listServiceCenters();
          const found = (listRes.serviceCenters || []).find(
            (c: any) =>
              c.manager?._id === user?.id ||
              c.manager === user?.id ||
              c.user_id === user?.id ||
              c.user === user?.id ||
              (user?.email && c.contact?.email === user?.email)
          );
          if (found) sc = found;
        } catch (_) {}
      }

      if (sc) {
        setCenterId(sc._id || sc.id || sc.serviceCenterId);
        setCenterName(sc.service_center_name || sc.businessName || sc.name || 'Service Center');

        const rawServices = sc.servicesOffered || [];
        if (Array.isArray(rawServices) && rawServices.length > 0) {
          // Normalize string array or object array to ServiceItem array
          const parsedServices: ServiceItem[] = rawServices.map((item: any, idx: number) => {
            if (typeof item === 'string') {
              // Match preset if exists
              const matchedPreset = DEFAULT_PRESET_SERVICES.find(
                p => p.name.toLowerCase() === item.toLowerCase()
              );
              return matchedPreset
                ? { ...matchedPreset, id: `svc-${idx}-${Date.now()}` }
                : {
                    id: `svc-${idx}-${Date.now()}`,
                    name: item,
                    category: 'General Service',
                    price: '1499',
                    duration: '45 mins',
                    description: `${item} service performed by certified workshop technicians.`,
                    isAvailable: true
                  };
            }
            return {
              id: item.id || `svc-${idx}-${Date.now()}`,
              name: item.name || 'Service Item',
              category: item.category || 'General Service',
              price: item.price !== undefined ? String(item.price) : '1499',
              duration: item.duration || '45 mins',
              description: item.description || '',
              isAvailable: item.isAvailable !== false
            };
          });
          setServices(parsedServices);
        } else {
          // Default initial services preset for new centers
          setServices(DEFAULT_PRESET_SERVICES.slice(0, 5));
        }
      } else {
        // Fallback demo preset for guest users
        setServices(DEFAULT_PRESET_SERVICES.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load services offered:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Save services back to backend
  const persistServices = async (updatedList: ServiceItem[]) => {
    setServices(updatedList);
    if (!centerId) return;

    try {
      setSaving(true);
      await api.updateServiceCenterServices(centerId, updatedList);
    } catch (err) {
      console.error('Failed to update service center services:', err);
    } finally {
      setSaving(false);
    }
  };

  // Open modal to add a new custom service
  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setFormName('');
    setFormCategory('Maintenance');
    setFormPrice('');
    setFormDuration('45 mins');
    setFormDescription('');
    setFormIsAvailable(true);
    setShowModal(true);
  };

  // Open modal to edit existing service
  const handleOpenEditModal = (service: ServiceItem) => {
    setEditingServiceId(service.id);
    setFormName(service.name);
    setFormCategory(service.category);
    setFormPrice(service.price);
    setFormDuration(service.duration);
    setFormDescription(service.description);
    setFormIsAvailable(service.isAvailable);
    setShowModal(true);
  };

  // Save form submission
  const handleSaveModalService = () => {
    if (!formName.trim()) {
      alertMsg('Validation Required', 'Please enter a valid service name.');
      return;
    }

    const priceVal = formPrice.replace(/[^0-9.]/g, '') || '999';

    if (editingServiceId) {
      // Update existing
      const updated = services.map(s =>
        s.id === editingServiceId
          ? {
              ...s,
              name: formName.trim(),
              category: formCategory,
              price: priceVal,
              duration: formDuration.trim() || '45 mins',
              description: formDescription.trim(),
              isAvailable: formIsAvailable
            }
          : s
      );
      persistServices(updated);
    } else {
      // Create new
      const newService: ServiceItem = {
        id: `svc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: formName.trim(),
        category: formCategory,
        price: priceVal,
        duration: formDuration.trim() || '45 mins',
        description: formDescription.trim() || `${formName.trim()} offered at ${centerName}.`,
        isAvailable: formIsAvailable
      };
      persistServices([newService, ...services]);
    }

    setShowModal(false);
  };

  // Toggle single service availability status directly
  const handleToggleAvailability = (serviceId: string) => {
    const updated = services.map(s =>
      s.id === serviceId ? { ...s, isAvailable: !s.isAvailable } : s
    );
    persistServices(updated);
  };

  // Delete service
  const handleDeleteService = (serviceId: string, name: string) => {
    const confirmDelete = () => {
      const updated = services.filter(s => s.id !== serviceId);
      persistServices(updated);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to remove "${name}" from your services list?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Remove Service',
        `Are you sure you want to remove "${name}" from your offered services catalog?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: confirmDelete }
        ]
      );
    }
  };

  // Quick Add Preset
  const handleAddPreset = (preset: ServiceItem) => {
    const exists = services.some(s => s.name.toLowerCase() === preset.name.toLowerCase());
    if (exists) {
      alertMsg('Already Added', `"${preset.name}" is already in your services list.`);
      return;
    }

    const newSvc: ServiceItem = {
      ...preset,
      id: `svc-preset-${Date.now()}-${Math.floor(Math.random() * 100)}`
    };

    persistServices([newSvc, ...services]);
    alertMsg('Preset Added', `"${preset.name}" added to your offered services list!`);
  };

  const alertMsg = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  // Filtering Logic
  const filteredServices = services.filter(s => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Metrics
  const totalCount = services.length;
  const activeCount = services.filter(s => s.isAvailable).length;
  const categoriesCount = new Set(services.map(s => s.category)).size;
  const avgPrice = totalCount
    ? Math.round(
        services.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0) / totalCount
      )
    : 0;

  return (
    <View style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true}>
        {/* Header Row */}
        <View style={styles.headerBar}>
          <BackButton variant="ghost" label="Dashboard" onPress={onBack} />
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Services Offered Catalog</Text>
            <Text style={styles.headerSubTitle}>{centerName} • {totalCount} Services Offered</Text>
          </View>

          <TouchableOpacity style={styles.addBtnHeader} onPress={handleOpenAddModal} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnHeaderText}>Add Service</Text>
          </TouchableOpacity>
        </View>

        {/* Performance & Metrics Banner */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{totalCount}</Text>
            <Text style={styles.metricLabel}>Total Listed</Text>
          </View>

          <View style={[styles.metricCard, { borderColor: THEME.accent }]}>
            <Text style={[styles.metricVal, { color: THEME.accent }]}>{activeCount}</Text>
            <Text style={styles.metricLabel}>Active Services</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: THEME.primary }]}>{categoriesCount}</Text>
            <Text style={styles.metricLabel}>Categories</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: THEME.text }]}>₹{avgPrice}</Text>
            <Text style={styles.metricLabel}>Avg Price</Text>
          </View>
        </View>

        {/* Quick Add Presets Bar */}
        <View style={styles.presetsSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="flash" size={16} color={THEME.warning} />
            <Text style={styles.sectionTitle}>One-Tap Preset Services</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
            {DEFAULT_PRESET_SERVICES.map(preset => {
              const alreadyAdded = services.some(s => s.name.toLowerCase() === preset.name.toLowerCase());
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetChip, alreadyAdded && styles.presetChipDisabled]}
                  onPress={() => !alreadyAdded && handleAddPreset(preset)}
                  disabled={alreadyAdded}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={alreadyAdded ? 'checkmark-circle' : 'add-circle-outline'}
                    size={15}
                    color={alreadyAdded ? THEME.success : THEME.primary}
                  />
                  <Text style={[styles.presetChipText, alreadyAdded && styles.presetChipTextDisabled]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Search & Category Filter Section */}
        <View style={styles.filterSection}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search service by name or category..."
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

          {/* Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Services List Feed */}
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loaderText}>Loading services offered...</Text>
          </View>
        ) : filteredServices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="construct-outline" size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Services Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery || selectedCategory !== 'All'
                ? 'No service matches your search filter criteria.'
                : 'Your workshop has not added any service packages yet.'}
            </Text>
            <TouchableOpacity style={styles.addBtnModal} onPress={handleOpenAddModal} activeOpacity={0.85}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnModalText}>Add First Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.servicesGrid}>
            {filteredServices.map(svc => (
              <View key={svc.id} style={[styles.serviceCard, !svc.isAvailable && styles.serviceCardDisabled]}>
                {/* Top Row: Title & Category Pill */}
                <View style={styles.svcHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.svcTitle}>{svc.name}</Text>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{svc.category}</Text>
                    </View>
                  </View>

                  <View style={styles.statusToggleContainer}>
                    <Text style={[styles.statusToggleText, svc.isAvailable ? styles.statusActive : styles.statusPaused]}>
                      {svc.isAvailable ? '✓ Active' : '✕ Paused'}
                    </Text>
                    <Switch
                      value={svc.isAvailable}
                      onValueChange={() => handleToggleAvailability(svc.id)}
                      trackColor={{ false: '#CBD5E1', true: THEME.accentLight }}
                      thumbColor={svc.isAvailable ? THEME.accent : '#94A3B8'}
                    />
                  </View>
                </View>

                {/* Description */}
                {svc.description ? (
                  <Text style={styles.svcDescription} numberOfLines={2}>
                    {svc.description}
                  </Text>
                ) : null}

                {/* Info Footer Bar */}
                <View style={styles.svcFooterBar}>
                  <View style={styles.priceDurationGroup}>
                    <View style={styles.priceTag}>
                      <Ionicons name="pricetag" size={13} color={THEME.primary} />
                      <Text style={styles.priceTagText}>₹{svc.price}</Text>
                    </View>
                    <View style={styles.durationTag}>
                      <Ionicons name="time-outline" size={13} color="#64748B" />
                      <Text style={styles.durationTagText}>{svc.duration}</Text>
                    </View>
                  </View>

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleOpenEditModal(svc)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={15} color={THEME.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionIconBtn, { backgroundColor: THEME.errorLight }]}
                      onPress={() => handleDeleteService(svc.id, svc.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={15} color={THEME.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Service Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true} onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingServiceId ? 'Edit Service Package' : 'Add New Service Package'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormContent} showsVerticalScrollIndicator={false}>
              {/* Service Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Service Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Synthetic Oil & Filter Service"
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              {/* Category Dropdown/Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catSelectRow}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catSelectChip, formCategory === c && styles.catSelectChipActive]}
                      onPress={() => setFormCategory(c)}
                    >
                      <Text style={[styles.catSelectChipText, formCategory === c && styles.catSelectChipTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Price & Duration Row */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Estimated Price (₹) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="1499"
                    keyboardType="numeric"
                    value={formPrice}
                    onChangeText={setFormPrice}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Estimated Time</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="45 mins"
                    value={formDuration}
                    onChangeText={setFormDuration}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textAreaInput]}
                  placeholder="Describe what's included in this service package..."
                  multiline={true}
                  numberOfLines={3}
                  value={formDescription}
                  onChangeText={setFormDescription}
                />
              </View>

              {/* Active Switch */}
              <View style={styles.switchRowGroup}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabelTitle}>Available for Booking</Text>
                  <Text style={styles.switchLabelSub}>Enable drivers to select and book this service</Text>
                </View>
                <Switch
                  value={formIsAvailable}
                  onValueChange={setFormIsAvailable}
                  trackColor={{ false: '#CBD5E1', true: THEME.accentLight }}
                  thumbColor={formIsAvailable ? THEME.accent : '#94A3B8'}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionButtons}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveModalService} activeOpacity={0.85}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveModalBtnText}>{editingServiceId ? 'Save Changes' : 'Add Service'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: THEME.background
  },
  container: {
    padding: 16,
    paddingBottom: 40
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8
  },
  headerTitleGroup: {
    flex: 1,
    marginLeft: 6
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.3
  },
  headerSubTitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12
  },
  addBtnHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },

  // Metrics
  metricsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  metricCard: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.text
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textSecondary,
    marginTop: 2
  },

  // Presets
  presetsSection: {
    marginBottom: 16
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.text
  },
  presetsScroll: {
    gap: 8,
    paddingRight: 10
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.primaryLight,
    borderWidth: 1,
    borderColor: THEME.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20
  },
  presetChipDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0'
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.primary
  },
  presetChipTextDisabled: {
    color: '#94A3B8'
  },

  // Search & Filters
  filterSection: {
    marginBottom: 16,
    gap: 10
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.border
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.text,
    padding: 0
  },
  categoryScroll: {
    gap: 8
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border
  },
  categoryPillActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textSecondary
  },
  categoryPillTextActive: {
    color: '#FFFFFF'
  },

  // Empty state & loader
  loaderBox: {
    padding: 40,
    alignItems: 'center',
    gap: 10
  },
  loaderText: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  emptyCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    gap: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text
  },
  emptySub: {
    fontSize: 12,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8
  },
  addBtnModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12
  },
  addBtnModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },

  // Services Cards Grid
  servicesGrid: {
    gap: 12
  },
  serviceCard: {
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
  serviceCardDisabled: {
    opacity: 0.65,
    backgroundColor: '#FAFAFA'
  },
  svcHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  svcTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text
  },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.primary
  },
  statusToggleContainer: {
    alignItems: 'flex-end',
    gap: 2
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: '800'
  },
  statusActive: {
    color: THEME.accent
  },
  statusPaused: {
    color: '#94A3B8'
  },
  svcDescription: {
    fontSize: 12,
    color: THEME.textSecondary,
    lineHeight: 17,
    marginBottom: 10
  },
  svcFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  priceDurationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  priceTagText: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.primary
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  durationTagText: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: THEME.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 12
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text
  },
  modalFormContent: {
    gap: 14,
    paddingBottom: 20
  },
  inputGroup: {
    gap: 6
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: THEME.text
  },
  textAreaInput: {
    minHeight: 70,
    textAlignVertical: 'top'
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10
  },
  catSelectRow: {
    gap: 6,
    paddingVertical: 4
  },
  catSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  catSelectChipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  catSelectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSecondary
  },
  catSelectChipTextActive: {
    color: '#FFFFFF'
  },
  switchRowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  switchLabelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.text
  },
  switchLabelSub: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 2
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textSecondary
  },
  saveModalBtn: {
    flex: 1.5,
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12
  },
  saveModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
