import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/services/api';
import {
  VEHICLE_TYPES,
  getBrandsForType,
  getModelsForBrand,
  getFuelTypesForVehicleType,
  VEHICLE_COLORS,
  getModelYears,
  getStateFromRegistrationNumber,
  RTO_FORMAT_REGEX
} from '../src/constants/vehicleData';
import BackButton from '../src/components/ui/BackButton';

const typeIcons = {
  car: 'car-outline',
  bike: 'bicycle-outline',
  suv: 'car-sport-outline',
  truck: 'bus-outline',
  other: 'apps-outline'
};

export default function AddVehicleScreen({ onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState('');

  // Form states
  const [vehicleType, setVehicleType] = useState('car');
  const [fuelType, setFuelType] = useState('petrol');
  const [regNumber, setRegNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [color, setColor] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');

  // Dropdown visibility states
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showFuelDropdown, setShowFuelDropdown] = useState(false);

  const toggleDropdown = (dropdownName) => {
    setShowMakeDropdown(dropdownName === 'make' ? !showMakeDropdown : false);
    setShowModelDropdown(dropdownName === 'model' ? !showModelDropdown : false);
    setShowYearDropdown(dropdownName === 'year' ? !showYearDropdown : false);
    setShowColorDropdown(dropdownName === 'color' ? !showColorDropdown : false);
    setShowFuelDropdown(dropdownName === 'fuel' ? !showFuelDropdown : false);
  };

  // Reset fields on vehicle type change
  useEffect(() => {
    setMake('');
    setModel('');
    setShowMakeDropdown(false);
    setShowModelDropdown(false);
    const fuels = getFuelTypesForVehicleType(vehicleType);
    setFuelType(fuels[0]?.value || 'petrol');
  }, [vehicleType]);

  const detectedState = getStateFromRegistrationNumber(regNumber);

  const brands = getBrandsForType(vehicleType);
  const models = getModelsForBrand(make, vehicleType);
  const years = getModelYears();
  const fuelOptions = getFuelTypesForVehicleType(vehicleType);

  const handleRegister = async () => {
    setVehicleError('');
    if (!make || !model || !year || !regNumber) {
      setVehicleError('Make, Model, Year, and Registration Number are required');
      return;
    }

    if (!RTO_FORMAT_REGEX.test(regNumber)) {
      setVehicleError('Please enter a valid Indian registration number (e.g., KL 29 P 1829, MH 12 AB 1234, or 22 BH 1234 AB)');
      return;
    }

    try {
      setLoading(true);
      await api.registerVehicle({
        make,
        model,
        year: parseInt(year),
        vehicleType,
        registrationNumber: regNumber,
        color,
        fuelType,
        chassisNumber
      });

      // Clear form
      setMake('');
      setModel('');
      setYear(new Date().getFullYear().toString());
      setRegNumber('');
      setColor('');
      setChassisNumber('');
      setVehicleType('car');
      setFuelType('petrol');

      if (onSuccess) {
        await onSuccess();
      }

      if (Platform.OS === 'web') {
        alert('Vehicle registered successfully!');
      } else {
        Alert.alert('Success', 'Vehicle registered successfully!');
      }
    } catch (err) {
      console.error(err);
      setVehicleError(err.message || 'Failed to register vehicle');
    } finally {
      setLoading(false);
    }
  };

  const getTypeName = () => {
    switch (vehicleType) {
      case 'car': return 'Car';
      case 'bike': return 'Bike';
      case 'suv': return 'SUV';
      case 'truck': return 'Truck';
      default: return 'Vehicle';
    }
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={true}
      persistentScrollbar={true}
    >
      {/* Top Banner Header */}
      <View style={styles.headerBanner}>
        <BackButton variant="card" onPress={onCancel} showLabel={false} />

        <View style={styles.headerTextCenter}>
          <Text style={styles.mainTitle}>Add Your {getTypeName()}</Text>
          <Text style={styles.subtitleText}>
            Add your vehicle details to manage maintenance{'\n'}and stay on track.
          </Text>
        </View>

        {/* Decorative Vehicle Badge Illustration */}
        <View style={styles.illustrationCircle}>
          <View style={styles.illustrationBg}>
            <Ionicons name="car-sport" size={32} color="#0046AD" />
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </View>

      {/* Main White Card Form Container */}
      <View style={styles.mainFormCard}>
        {vehicleError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorBannerText}>{vehicleError}</Text>
          </View>
        ) : null}

        {/* ------------------- Step 1: Vehicle Type ------------------- */}
        <View style={styles.stepSection}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Vehicle Type</Text>
          </View>

          <View style={styles.typeSelectorRow}>
            {VEHICLE_TYPES.map(item => {
              const isActive = vehicleType === item.value;
              const iconName = typeIcons[item.value] || 'apps-outline';

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.typeChip, isActive && styles.typeChipActive]}
                  activeOpacity={0.7}
                  onPress={() => setVehicleType(item.value)}
                >
                  <Ionicons
                    name={iconName}
                    size={20}
                    color={isActive ? '#0046AD' : '#475569'}
                  />
                  <Text style={[styles.typeChipLabel, isActive && styles.typeChipLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ------------------- Step 2: Basic Information ------------------- */}
        <View style={styles.stepSection}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Basic Information</Text>
          </View>

          {/* 2-Column Row for Fuel Type & Reg Number */}
          <View style={styles.rowLayout}>
            {/* Fuel Type Dropdown */}
            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Fuel Type</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                activeOpacity={0.7}
                onPress={() => toggleDropdown('fuel')}
              >
                <Ionicons name="color-fill-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <Text style={styles.inputText}>
                  {fuelOptions.find(f => f.value === fuelType)?.label || 'Select Fuel Type'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>

              {showFuelDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                    {fuelOptions.map((f) => (
                      <TouchableOpacity
                        key={f.value}
                        style={[
                          styles.dropdownItem,
                          fuelType === f.value && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setFuelType(f.value);
                          setShowFuelDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            fuelType === f.value && styles.dropdownItemTextActive
                          ]}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Registration Number */}
            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Registration Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="MH 12 AB 1234"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={regNumber}
                  onChangeText={setRegNumber}
                />
              </View>
            </View>
          </View>

          {/* Subtext under Registration Number */}
          {detectedState ? (
            <Text style={styles.detectedStateText}>📍 Detected: {detectedState}</Text>
          ) : (
            <Text style={styles.helperSubtext}>
              Standard RTO (e.g. KL 29 P 1829, MH 12 AB 1234) or BH Series (e.g. 22 BH 1234 AB)
            </Text>
          )}

          {/* Full Width: Vehicle Make */}
          <View style={styles.fullWidthField}>
            <Text style={styles.inputLabel}>Vehicle Make</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              activeOpacity={0.7}
              onPress={() => toggleDropdown('make')}
            >
              <Ionicons name="business-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <Text style={[styles.inputText, !make && styles.placeholderText]}>
                {make || 'Select Make'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>

            {showMakeDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                  {brands.map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={[
                        styles.dropdownItem,
                        make === brand && styles.dropdownItemActive
                      ]}
                      onPress={() => {
                        setMake(brand);
                        setModel('');
                        setShowMakeDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          make === brand && styles.dropdownItemTextActive
                        ]}
                      >
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* ------------------- Step 3: Vehicle Details ------------------- */}
        <View style={styles.stepSection}>
          <View style={styles.stepTitleRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Vehicle Details</Text>
          </View>

          {/* 2-Column Row for Vehicle Model & Model Year */}
          <View style={styles.rowLayout}>
            {/* Vehicle Model Dropdown */}
            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Vehicle Model</Text>
              <TouchableOpacity
                style={[styles.inputContainer, !make && styles.disabledInput]}
                activeOpacity={0.7}
                onPress={() => make && toggleDropdown('model')}
                disabled={!make}
              >
                <Ionicons name="car-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <Text style={[styles.inputText, (!model || !make) && styles.placeholderText]}>
                  {model || (make ? 'Select Model' : 'Select a Make first')}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>

              {showModelDropdown && make && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                    {models.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.dropdownItem,
                          model === m && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setModel(m);
                          setShowModelDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            model === m && styles.dropdownItemTextActive
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Model Year Dropdown */}
            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Model Year</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                activeOpacity={0.7}
                onPress={() => toggleDropdown('year')}
              >
                <Ionicons name="calendar-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <Text style={styles.inputText}>
                  {year || 'Select Year'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>

              {showYearDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                    {years.map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[
                          styles.dropdownItem,
                          year === y && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setYear(y);
                          setShowYearDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            year === y && styles.dropdownItemTextActive
                          ]}
                        >
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* 2-Column Row for Color & Chassis Number */}
          <View style={styles.rowLayout}>
            {/* Color Dropdown */}
            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Color</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                activeOpacity={0.7}
                onPress={() => toggleDropdown('color')}
              >
                <Ionicons name="color-palette-outline" size={18} color="#64748B" style={styles.inputIcon} />
                {color ? (
                  <View style={styles.selectedColorRow}>
                    <View style={[styles.colorSwatch, { backgroundColor: VEHICLE_COLORS.find(c => c.value === color)?.hex || '#ccc' }]} />
                    <Text style={styles.inputText}>
                      {VEHICLE_COLORS.find(c => c.value === color)?.label || color}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.inputText, styles.placeholderText]}>Select Color</Text>
                )}
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>

              {showColorDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                    {VEHICLE_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c.value}
                        style={[
                          styles.dropdownItem,
                          color === c.value && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          setColor(c.value);
                          setShowColorDropdown(false);
                        }}
                      >
                        <View style={styles.dropdownItemContent}>
                          <View style={[styles.colorSwatch, { backgroundColor: c.hex }]} />
                          <Text
                            style={[
                              styles.dropdownItemText,
                              color === c.value && styles.dropdownItemTextActive
                            ]}
                          >
                            {c.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Chassis Number Input */}
            <View style={styles.fieldColumn}>
              <Text style={styles.inputLabel}>Chassis Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="barcode-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="CHA123456"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={chassisNumber}
                  onChangeText={setChassisNumber}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ------------------- Info Alert Card ------------------- */}
        <View style={styles.infoAlertCard}>
          <Ionicons name="information-circle" size={20} color="#0046AD" style={styles.infoAlertIcon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoAlertTitle}>Please ensure all details are correct.</Text>
            <Text style={styles.infoAlertSubtext}>You can edit these details later from your profile settings.</Text>
          </View>
        </View>

        {/* ------------------- Action Buttons ------------------- */}
        <TouchableOpacity
          style={styles.primaryAddBtn}
          activeOpacity={0.8}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryAddBtnText}>+ Add {getTypeName()}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryCancelBtn}
          activeOpacity={0.7}
          onPress={onCancel}
        >
          <Text style={styles.secondaryCancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 60,
    alignItems: 'center'
  },

  /* Header Banner */
  headerBanner: {
    width: '100%',
    maxWidth: 720,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 8
  },
  backBtnCard: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  headerTextCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center'
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18
  },
  illustrationCircle: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center'
  },
  illustrationBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  checkBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0046AD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },

  /* Main Form Card */
  mainFormCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1
  },

  /* Step Sections */
  stepSection: {
    marginBottom: 24
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0046AD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },

  /* Step 1: Type Chips */
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  typeChip: {
    flex: 1,
    minWidth: 80,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  typeChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0046AD',
    borderWidth: 1.5
  },
  typeChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  typeChipLabelActive: {
    color: '#0046AD',
    fontWeight: '700'
  },

  /* Form Layout Grid */
  rowLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 14
  },
  fieldColumn: {
    flex: 1,
    minWidth: 160
  },
  fullWidthField: {
    width: '100%',
    marginTop: 14
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6
  },
  inputContainer: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  disabledInput: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9'
  },
  inputIcon: {
    marginRight: 8
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500'
  },
  inputText: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500'
  },
  placeholderText: {
    color: '#94A3B8'
  },
  helperSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: -8,
    marginBottom: 8,
    lineHeight: 15
  },
  detectedStateText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 8
  },

  /* Dropdown Styles */
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000
  },
  dropdownScrollView: {
    maxHeight: 180
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF'
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155'
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: '#0046AD'
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  selectedColorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },

  /* Info Alert Card */
  infoAlertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10
  },
  infoAlertIcon: {
    marginTop: 1
  },
  infoAlertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2
  },
  infoAlertSubtext: {
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 16
  },

  /* Primary & Secondary Buttons */
  primaryAddBtn: {
    height: 50,
    backgroundColor: '#0046AD',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0046AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  primaryAddBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  secondaryCancelBtn: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryCancelBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600'
  }
});
