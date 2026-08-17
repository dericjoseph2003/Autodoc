import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert
} from 'react-native';
import AddVehicleScreen from '../../../screens/AddVehicleScreen';
import BackButton from '../../components/ui/BackButton';

interface VehicleProfileScreenProps {
  vehicles: any[];
  documents: { [vehicleId: string]: any[] } | any[];
  onAddVehicle: () => void;
  onDeleteVehicle: (id: string) => void;
  onUploadDoc: (vehicleId: string, docType: string) => void;
  onDeleteDoc: (docId: string) => void;
  onRefresh: () => void;
  onBack?: () => void;
}

export default function VehicleProfileScreen({
  vehicles,
  documents,
  onAddVehicle,
  onDeleteVehicle,
  onUploadDoc,
  onDeleteDoc,
  onRefresh,
  onBack
}: VehicleProfileScreenProps) {
  // Main view modes
  const [activeTab, setActiveTab] = useState<'Schedule' | 'History'>('Schedule');
  const [showAddForm, setShowAddForm] = useState(false);

  // Active selected vehicle index
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [historyFilterVehicleId, setHistoryFilterVehicleId] = useState<string>('ALL');

  // Modal Visibility States
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showLogServiceModal, setShowLogServiceModal] = useState(false);
  const [showMileageModal, setShowMileageModal] = useState(false);

  // Mileage Update State
  const activeVehicle = vehicles[selectedVehicleIndex] || vehicles[0];
  const [currentMileage, setCurrentMileage] = useState<string>(
    activeVehicle?.mileage || '0'
  );
  const [newMileageInput, setNewMileageInput] = useState<string>('');

  // Log Service Form States
  const [logServiceType, setLogServiceType] = useState('Oil Change');
  const [logServiceDate, setLogServiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [logWorkshopName, setLogWorkshopName] = useState('');
  const [logMileage, setLogMileage] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logInvoiceUploaded, setLogInvoiceUploaded] = useState(false);

  // Mock Service History Records
  const [serviceHistory, setServiceHistory] = useState<any[]>([
    {
      id: 's1',
      serviceType: 'Full Inspection',
      workshopName: 'Premium Motors Workshop',
      date: 'February 28, 2026',
      vehicleName: '2022 Toyota Camry',
      mileage: '48,200 km',
      notes: 'Full synthetic oil change with filter replacement. No issues found.',
      isGuaranteed: true,
      guaranteeExpiry: 'Jun 14, 2026'
    },
    {
      id: 's2',
      serviceType: 'Brake Pad & Rotor Replacement',
      workshopName: 'Elite Auto Repair',
      date: 'January 15, 2026',
      vehicleName: '2022 Toyota Camry',
      mileage: '44,100 km',
      notes: 'Front brake pads and discs replaced. System pressure bled and tested.',
      isGuaranteed: true,
      guaranteeExpiry: 'Apr 6, 2026'
    }
  ]);

  // Active Guarantees Mock Data
  const activeGuarantees = [
    {
      id: 'g1',
      title: 'Oil Change Guarantee',
      provider: 'Prime Auto Service',
      daysLeft: '87 Days',
      expiry: 'Jun 14, 2026'
    },
    {
      id: 'g2',
      title: 'Brake Pad Replacement',
      provider: 'Elite Car Repair',
      daysLeft: '23 Days',
      expiry: 'Apr 6, 2026'
    },
    {
      id: 'g3',
      title: 'Tire Rotation',
      provider: 'Express Auto Care',
      daysLeft: '7 Days',
      expiry: 'Jun 14, 2026'
    }
  ];

  // Maintenance Schedule Items Mock
  const maintenanceSchedule = [
    { id: 'm1', title: 'Engine Oil & Filter Replacement', status: 'Due Soon', km: '50,000 KM' },
    { id: 'm2', title: 'Brake Fluid Inspection', status: 'OK', km: '52,000 KM' },
    { id: 'm3', title: 'Wheel Alignment & Balancing', status: 'Overdue', km: '48,000 KM' }
  ];

  // Handle Save Service Record
  const handleSaveServiceRecord = () => {
    if (!logWorkshopName || !logMileage) {
      if (Platform.OS === 'web') {
        alert('Please enter Workshop Name and Mileage.');
      } else {
        Alert.alert('Required', 'Please enter Workshop Name and Mileage.');
      }
      return;
    }

    const newRecord = {
      id: `s_${Date.now()}`,
      serviceType: logServiceType,
      workshopName: logWorkshopName,
      date: logServiceDate,
      vehicleName: activeVehicle ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}` : 'My Vehicle',
      mileage: `${logMileage} km`,
      notes: logNote || 'Routine maintenance completed.',
      isGuaranteed: true,
      guaranteeExpiry: 'Jun 14, 2026'
    };

    setServiceHistory([newRecord, ...serviceHistory]);
    setShowLogServiceModal(false);

    // Reset Form
    setLogWorkshopName('');
    setLogMileage('');
    setLogNote('');
    setLogInvoiceUploaded(false);

    if (Platform.OS === 'web') {
      alert('Service record logged successfully!');
    } else {
      Alert.alert('Success', 'Service record logged successfully!');
    }
  };

  // Handle Update Mileage
  const handleSaveMileage = () => {
    if (newMileageInput) {
      setCurrentMileage(newMileageInput);
    }
    setShowMileageModal(false);
    setNewMileageInput('');
  };

  const getDocStatus = (vehicleId: string, docType: string) => {
    if (!documents) return null;
    if (Array.isArray(documents)) {
      return documents.find(d => d.vehicle?._id === vehicleId && d.documentType === docType);
    }
    const vehicleDocs = documents[vehicleId] || [];
    return vehicleDocs.find(d => d.documentType === docType);
  };

  // Render Add Vehicle Form Sub-view
  if (showAddForm) {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <AddVehicleScreen
          onCancel={() => setShowAddForm(false)}
          onSuccess={async () => {
            setShowAddForm(false);
            await onRefresh();
          }}
        />
      </View>
    );
  }

  // ---------------------------------------------------------
  // MOCKUP SCREEN 1: EMPTY STATE (when zero vehicles exist)
  // ---------------------------------------------------------
  if (vehicles.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.emptyContainer} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
        {/* Header */}
        <Text style={styles.headerTitle}>My Vehicles</Text>

        {/* Empty State Hero */}
        <View style={styles.emptyHeroCard}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIconText}>🚗</Text>
          </View>

          <Text style={styles.emptyTitle}>Add your First Car</Text>
          <Text style={styles.emptySubtitle}>
            Add your vehicle to unlock your personalized AI maintenance schedule and guarantee tracking.
          </Text>

          <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setShowAddForm(true)}>
            <Text style={styles.emptyAddBtnText}>+ Add a Car</Text>
          </TouchableOpacity>

          <Text style={styles.emptyMicrotext}>It only takes a minute — 3 quick steps</Text>
        </View>
      </ScrollView>
    );
  }

  // ---------------------------------------------------------
  // MAIN VIEW: VEHICLE PROFILE & SCHEDULE / HISTORY
  // ---------------------------------------------------------
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      {/* Top Header */}
      <View style={styles.topHeaderRow}>
        {onBack && <BackButton variant="card" label="Back" onPress={onBack} />}
        <Text style={styles.headerTitle}>My Vehicles</Text>
      </View>

      {/* Segmented Tab Switcher: Schedule | History */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'Schedule' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('Schedule')}
        >
          <Text style={[styles.segmentText, activeTab === 'Schedule' && styles.segmentTextActive]}>
            Schedule
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'History' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('History')}
        >
          <Text style={[styles.segmentText, activeTab === 'History' && styles.segmentTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* ----------------------------------------------------- */}
      {/* TAB 1: SCHEDULE VIEW (Dark Hero Card + Guarantees + Schedule) */}
      {/* ----------------------------------------------------- */}
      {activeTab === 'Schedule' && (
        <>
          {/* MOCKUP SCREEN 2: DARK ROYAL BLUE HERO CARD */}
          <View style={styles.heroCard}>
            <View style={styles.heroCardHeader}>
              <View style={styles.heroVehicleInfo}>
                <View style={styles.heroIconCircle}>
                  <Text style={{ fontSize: 20 }}>
                    {activeVehicle?.vehicleType === 'bike' ? '🏍️' : '🚗'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.heroVehicleTitle}>
                    {activeVehicle?.make} {activeVehicle?.model} {activeVehicle?.year}
                  </Text>
                  <Text style={styles.heroVehicleKm}>{currentMileage} KM · {activeVehicle?.registrationNumber}</Text>
                </View>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStatsRow}>
              <View>
                <Text style={styles.heroStatLabel}>Last Service</Text>
                <Text style={styles.heroStatVal}>Feb 28, 2026</Text>
              </View>
              <View>
                <Text style={styles.heroStatLabel}>Current Mileage</Text>
                <Text style={styles.heroStatVal}>{currentMileage} KM</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.updateMileageBtn}
              onPress={() => setShowMileageModal(true)}
            >
              <Text style={styles.updateMileageText}>Update Mileage +</Text>
            </TouchableOpacity>
          </View>

          {/* Action Button Row: Switch Car ⇅ | Add Car + */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.switchCarBtn}
              onPress={() => setShowSwitchModal(true)}
            >
              <Text style={styles.switchCarText}>Switch Vehicle ⇅</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addCarBtn}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addCarText}>Add Vehicle +</Text>
            </TouchableOpacity>
          </View>

          {/* Active Guarantees Section */}
          <Text style={styles.sectionTitle}>Active Guarantees</Text>
          {activeGuarantees.map((item) => (
            <View key={item.id} style={styles.guaranteeCard}>
              <View style={styles.guaranteeRow}>
                <View style={styles.guaranteeCheckIcon}>
                  <Text style={{ color: '#0046AD', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guaranteeTitle}>{item.title}</Text>
                  <Text style={styles.guaranteeProvider}>{item.provider}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.guaranteeDays}>{item.daysLeft}</Text>
                  <Text style={styles.guaranteeExp}>Exp. {item.expiry}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Maintenance Schedule Section */}
          <View style={styles.scheduleHeaderRow}>
            <Text style={styles.sectionTitle}>Maintenance Schedule</Text>
            <View style={styles.badgeOverdue}>
              <Text style={styles.badgeOverdueText}>2 Selected</Text>
            </View>
          </View>

          {maintenanceSchedule.map((item) => (
            <View key={item.id} style={styles.scheduleCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleItemTitle}>{item.title}</Text>
                <Text style={styles.scheduleItemKm}>Target: {item.km}</Text>
              </View>
              <View style={[
                styles.statusTag,
                item.status === 'Overdue' ? styles.statusOverdue : styles.statusOk
              ]}>
                <Text style={styles.statusTagText}>{item.status}</Text>
              </View>
            </View>
          ))}

          {/* Document Management Section */}
          <Text style={styles.sectionTitle}>Vehicle Documents & Licenses</Text>
          <View style={styles.docsCard}>
            {['RC', 'Insurance', 'PUC'].map((docType) => {
              const doc = getDocStatus(activeVehicle._id, docType);
              return (
                <View key={docType} style={styles.docRow}>
                  <View style={styles.docInfo}>
                    <Text style={styles.docIcon}>📄</Text>
                    <View>
                      <Text style={styles.docTitle}>{docType} Document</Text>
                      <Text style={[styles.docStatus, doc ? styles.docUploaded : styles.docMissing]}>
                        {doc ? 'Uploaded ✓' : 'Not Uploaded ✗'}
                      </Text>
                    </View>
                  </View>
                  {doc ? (
                    <TouchableOpacity style={styles.deleteDocBtn} onPress={() => onDeleteDoc(doc._id)}>
                      <Text style={styles.deleteDocText}>Delete</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.uploadDocBtn} onPress={() => onUploadDoc(activeVehicle._id, docType)}>
                      <Text style={styles.uploadDocText}>Upload</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* ----------------------------------------------------- */}
      {/* TAB 2: HISTORY VIEW (MOCKUP SCREEN 3 & 4) */}
      {/* ----------------------------------------------------- */}
      {activeTab === 'History' && (
        <>
          {/* Vehicle Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            <TouchableOpacity
              style={[styles.filterChip, historyFilterVehicleId === 'ALL' && styles.filterChipActive]}
              onPress={() => setHistoryFilterVehicleId('ALL')}
            >
              <Text style={[styles.filterChipText, historyFilterVehicleId === 'ALL' && styles.filterChipTextActive]}>
                All Vehicles
              </Text>
            </TouchableOpacity>
            {vehicles.map((v) => (
              <TouchableOpacity
                key={v._id}
                style={[styles.filterChip, historyFilterVehicleId === v._id && styles.filterChipActive]}
                onPress={() => setHistoryFilterVehicleId(v._id)}
              >
                <Text style={[styles.filterChipText, historyFilterVehicleId === v._id && styles.filterChipTextActive]}>
                  {v.make} {v.model}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Service Records Section Header */}
          <View style={styles.recordsHeaderRow}>
            <Text style={styles.sectionTitle}>Service Records</Text>
            <TouchableOpacity style={styles.logServiceHeaderBtn} onPress={() => setShowLogServiceModal(true)}>
              <Text style={styles.logServiceHeaderText}>Log a Service +</Text>
            </TouchableOpacity>
          </View>

          {/* Service Records Cards */}
          {serviceHistory.map((record) => (
            <View key={record.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historyType}>{record.serviceType}</Text>
                  <Text style={styles.historyWorkshop}>{record.workshopName}</Text>
                </View>
                <View style={styles.inspectionBadge}>
                  <Text style={styles.inspectionBadgeText}>Inspection</Text>
                </View>
              </View>

              <View style={styles.historyMetaRow}>
                <Text style={styles.historyMetaText}>📅 {record.date}</Text>
                <Text style={styles.historyMetaText}>🚗 {record.vehicleName}</Text>
                <Text style={styles.historyMetaText}>⚙️ {record.mileage}</Text>
              </View>

              <Text style={styles.historyNotes}>{record.notes}</Text>

              {record.isGuaranteed && (
                <View style={styles.guaranteePill}>
                  <Text style={styles.guaranteePillText}>
                    ✓ Guaranteed · Expires {record.guaranteeExpiry}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </>
      )}

      {/* ----------------------------------------------------- */}
      {/* MODAL 1: SWITCH VEHICLE SHEET */}
      {/* ----------------------------------------------------- */}
      <Modal visible={showSwitchModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Vehicle</Text>
            {vehicles.map((v, index) => (
              <TouchableOpacity
                key={v._id || index}
                style={[
                  styles.vehicleSelectItem,
                  selectedVehicleIndex === index && styles.vehicleSelectItemActive
                ]}
                onPress={() => {
                  setSelectedVehicleIndex(index);
                  setShowSwitchModal(false);
                }}
              >
                <Text style={styles.vehicleSelectEmoji}>
                  {v.vehicleType === 'bike' ? '🏍️' : '🚗'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vehicleSelectName}>{v.make} {v.model} ({v.year})</Text>
                  <Text style={styles.vehicleSelectSub}>{v.registrationNumber} · {v.fuelType}</Text>
                </View>
                {selectedVehicleIndex === index && <Text style={{ color: '#0046AD', fontWeight: 'bold' }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowSwitchModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ----------------------------------------------------- */}
      {/* MODAL 2: UPDATE MILEAGE MODAL */}
      {/* ----------------------------------------------------- */}
      <Modal visible={showMileageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Vehicle Mileage</Text>
            <Text style={styles.modalSub}>Current Odometer Reading (KM)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 50,000"
              keyboardType="number-pad"
              value={newMileageInput}
              onChangeText={setNewMileageInput}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowMileageModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveMileage}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ----------------------------------------------------- */}
      {/* MODAL 3: LOG A SERVICE SHEET (MOCKUP SCREEN 4) */}
      {/* ----------------------------------------------------- */}
      <Modal visible={showLogServiceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.modalSheetTitle}>Log a Service</Text>

              {/* Service Type */}
              <Text style={styles.fieldLabel}>Service Type</Text>
              <TextInput
                style={styles.fieldInput}
                value={logServiceType}
                onChangeText={setLogServiceType}
                placeholder="e.g. Oil Change, Full Inspection"
              />

              {/* Service Date */}
              <Text style={styles.fieldLabel}>Service Date</Text>
              <TextInput
                style={styles.fieldInput}
                value={logServiceDate}
                onChangeText={setLogServiceDate}
                placeholder="mm/dd/yy"
              />

              {/* Workshop Name */}
              <Text style={styles.fieldLabel}>Workshop Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={logWorkshopName}
                onChangeText={setLogWorkshopName}
                placeholder="Enter Workshop name"
              />

              {/* Mileage */}
              <Text style={styles.fieldLabel}>Mileage at time of maintenance</Text>
              <TextInput
                style={styles.fieldInput}
                value={logMileage}
                onChangeText={setLogMileage}
                keyboardType="number-pad"
                placeholder="Enter current mileage"
              />

              {/* Invoice Upload Area */}
              <TouchableOpacity
                style={[styles.invoiceUploadBox, logInvoiceUploaded && styles.invoiceUploadBoxSuccess]}
                onPress={() => setLogInvoiceUploaded(true)}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>📤</Text>
                <Text style={styles.invoiceUploadText}>
                  {logInvoiceUploaded ? 'Invoice Uploaded ✓ (invoice.pdf)' : 'Tap to upload invoice image'}
                </Text>
              </TouchableOpacity>

              {/* Note (Optional) */}
              <Text style={styles.fieldLabel}>Note (Optional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={logNote}
                onChangeText={setLogNote}
                placeholder="Enter service provider name or details"
              />

              {/* Buttons */}
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSaveServiceRecord}>
                <Text style={styles.modalPrimaryBtnText}>Save Record</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setShowLogServiceModal(false)}>
                <Text style={{ color: '#666', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F4F6F9',
    paddingBottom: 40
  },
  topHeaderRow: {
    marginBottom: 12
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  segmentBtnActive: {
    backgroundColor: '#0046AD'
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  // Empty State
  emptyContainer: {
    padding: 20,
    backgroundColor: '#F4F6F9',
    alignItems: 'center'
  },
  emptyHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  emptyIconText: {
    fontSize: 48
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24
  },
  emptyAddBtn: {
    backgroundColor: '#0046AD',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },
  emptyMicrotext: {
    fontSize: 11,
    color: '#94A3B8'
  },
  // Hero Royal Blue Card
  heroCard: {
    backgroundColor: '#003B95',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heroVehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  heroIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroVehicleTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  heroVehicleKm: {
    color: '#93C5FD',
    fontSize: 12,
    marginTop: 2
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 14
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  heroStatLabel: {
    color: '#BFDBFE',
    fontSize: 11
  },
  heroStatVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2
  },
  updateMileageBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  updateMileageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  switchCarBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0046AD',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  switchCarText: {
    color: '#0046AD',
    fontSize: 13,
    fontWeight: 'bold'
  },
  addCarBtn: {
    flex: 1,
    backgroundColor: '#0046AD',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addCarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold'
  },
  // Active Guarantees
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 6
  },
  guaranteeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  guaranteeCheckIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  guaranteeProvider: {
    fontSize: 11,
    color: '#64748B'
  },
  guaranteeDays: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0046AD'
  },
  guaranteeExp: {
    fontSize: 10,
    color: '#94A3B8'
  },
  // Maintenance Schedule
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  badgeOverdue: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  badgeOverdueText: {
    fontSize: 10,
    color: '#991B1B',
    fontWeight: 'bold'
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  scheduleItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  scheduleItemKm: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusOverdue: {
    backgroundColor: '#FEE2E2'
  },
  statusOk: {
    backgroundColor: '#DCFCE7'
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B'
  },
  // Documents Section
  docsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  docIcon: {
    fontSize: 18
  },
  docTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  docStatus: {
    fontSize: 10,
    marginTop: 1
  },
  docUploaded: {
    color: '#10B981',
    fontWeight: 'bold'
  },
  docMissing: {
    color: '#EF4444'
  },
  uploadDocBtn: {
    backgroundColor: '#0046AD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  uploadDocText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold'
  },
  deleteDocBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  deleteDocText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold'
  },
  // History Tab Styles
  chipsScroll: {
    marginBottom: 16
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  filterChipActive: {
    backgroundColor: '#0046AD',
    borderColor: '#0046AD'
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  filterChipTextActive: {
    color: '#FFFFFF'
  },
  recordsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  logServiceHeaderBtn: {
    paddingVertical: 4
  },
  logServiceHeaderText: {
    color: '#0046AD',
    fontSize: 13,
    fontWeight: 'bold'
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  historyType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  historyWorkshop: {
    fontSize: 12,
    color: '#64748B'
  },
  inspectionBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  inspectionBadgeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600'
  },
  historyMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 6
  },
  historyMetaText: {
    fontSize: 11,
    color: '#64748B'
  },
  historyNotes: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
    marginTop: 4
  },
  guaranteePill: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 6,
    marginTop: 8
  },
  guaranteePillText: {
    fontSize: 11,
    color: '#0046AD',
    fontWeight: 'bold'
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 20
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8
  },
  modalInput: {
    height: 44,
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 13
  },
  modalSaveBtn: {
    backgroundColor: '#0046AD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13
  },
  vehicleSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12
  },
  vehicleSelectItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8
  },
  vehicleSelectEmoji: {
    fontSize: 22
  },
  vehicleSelectName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A'
  },
  vehicleSelectSub: {
    fontSize: 11,
    color: '#64748B'
  },
  // Form fields in Log a Service modal
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
    marginTop: 10
  },
  fieldInput: {
    height: 44,
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  invoiceUploadBox: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#F8FAFC'
  },
  invoiceUploadBoxSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5'
  },
  invoiceUploadText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  modalPrimaryBtn: {
    backgroundColor: '#0046AD',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
