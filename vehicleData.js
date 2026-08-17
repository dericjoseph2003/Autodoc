// src/constants/vehicleData.js
// Reference data for AutoDoc's Add/Edit Vehicle form dropdowns.
// Import wherever needed: import { VEHICLE_TYPES, VEHICLE_BRANDS_MODELS, VEHICLE_COLORS, RTO_STATE_CODES } from '../constants/vehicleData';

// ---------------------------------------------------------
// 1. VEHICLE TYPES
// ---------------------------------------------------------
export const VEHICLE_TYPES = [
  { label: 'Car', value: 'car', icon: 'car' },
  { label: 'Bike', value: 'bike', icon: 'motorbike' },
  { label: 'SUV', value: 'suv', icon: 'car-suv' },
  { label: 'Truck', value: 'truck', icon: 'truck' },
  { label: 'Other', value: 'other', icon: 'help-circle' },
];

// ---------------------------------------------------------
// 2. VEHICLE BRANDS + MODELS
// Structured as { brand: [models] } so the Model dropdown can filter
// based on the selected Make.
// ---------------------------------------------------------
export const VEHICLE_BRANDS_MODELS = {
  'Maruti Suzuki': ['Swift', 'Baleno', 'Dzire', 'Alto', 'WagonR', 'Ertiga', 'Brezza', 'Celerio', 'Ignis', 'XL6'],
  Hyundai: ['i20', 'Creta', 'Venue', 'Verna', 'Grand i10 Nios', 'Exter', 'Alcazar', 'Tucson', 'Aura'],
  Tata: ['Nexon', 'Punch', 'Altroz', 'Tiago', 'Harrier', 'Safari', 'Tigor'],
  Mahindra: ['Scorpio-N', 'XUV700', 'Thar', 'Bolero', 'XUV300', 'Marazzo'],
  Honda: ['City', 'Amaze', 'Elevate', 'WR-V'],
  Toyota: ['Innova Crysta', 'Fortuner', 'Glanza', 'Urban Cruiser', 'Camry', 'Corolla'],
  Kia: ['Seltos', 'Sonet', 'Carens', 'EV6'],
  Volkswagen: ['Virtus', 'Taigun', 'Polo'],
  Skoda: ['Slavia', 'Kushaq', 'Kodiaq'],
  Renault: ['Kwid', 'Triber', 'Kiger'],
  Nissan: ['Magnite'],
  MG: ['Hector', 'Astor', 'ZS EV', 'Comet EV'],
  'Honda (Two-Wheeler)': ['Activa', 'Shine', 'Unicorn', 'SP125'],
  'Hero MotoCorp': ['Splendor', 'HF Deluxe', 'Passion Pro', 'Glamour', 'Xtreme'],
  'Bajaj': ['Pulsar', 'Platina', 'Avenger', 'Chetak (EV)', 'Dominar'],
  'TVS': ['Apache', 'Jupiter', 'Ntorq', 'Raider'],
  'Royal Enfield': ['Classic 350', 'Hunter 350', 'Bullet 350', 'Meteor 350'],
  'Yamaha': ['FZ', 'R15', 'MT-15', 'Fascino'],
  Other: ['Other / Not Listed'],
};

// Flat list of just brand names, useful for the Make dropdown
export const VEHICLE_BRANDS = Object.keys(VEHICLE_BRANDS_MODELS);

// Helper to get models for a selected brand
export const getModelsForBrand = (brand) => VEHICLE_BRANDS_MODELS[brand] || [];

// ---------------------------------------------------------
// 3. VEHICLE COLORS
// ---------------------------------------------------------
export const VEHICLE_COLORS = [
  { label: 'White', value: 'white', hex: '#FFFFFF' },
  { label: 'Black', value: 'black', hex: '#1A1A1A' },
  { label: 'Silver', value: 'silver', hex: '#C0C0C0' },
  { label: 'Grey', value: 'grey', hex: '#808080' },
  { label: 'Red', value: 'red', hex: '#C0392B' },
  { label: 'Blue', value: 'blue', hex: '#2E5FA3' },
  { label: 'Maroon', value: 'maroon', hex: '#5C1A1A' },
  { label: 'Brown', value: 'brown', hex: '#6B4423' },
  { label: 'Beige', value: 'beige', hex: '#D8C6A5' },
  { label: 'Green', value: 'green', hex: '#2E7D4F' },
  { label: 'Yellow', value: 'yellow', hex: '#E8C547' },
  { label: 'Orange', value: 'orange', hex: '#D2691E' },
  { label: 'Gold', value: 'gold', hex: '#B8860B' },
  { label: 'Other', value: 'other', hex: '#999999' },
];

// ---------------------------------------------------------
// 4. RTO STATE CODES (India) — first two letters of the registration number
// Useful for validating/auto-suggesting the state once a user types
// the first two letters (e.g. "MH" -> Maharashtra)
// ---------------------------------------------------------
export const RTO_STATE_CODES = {
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CG: 'Chhattisgarh',
  GA: 'Goa',
  GJ: 'Gujarat',
  HR: 'Haryana',
  HP: 'Himachal Pradesh',
  JH: 'Jharkhand',
  KA: 'Karnataka',
  KL: 'Kerala',
  MP: 'Madhya Pradesh',
  MH: 'Maharashtra',
  MN: 'Manipur',
  ML: 'Meghalaya',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  OD: 'Odisha',
  PB: 'Punjab',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TN: 'Tamil Nadu',
  TS: 'Telangana',
  TR: 'Tripura',
  UP: 'Uttar Pradesh',
  UK: 'Uttarakhand',
  WB: 'West Bengal',
  AN: 'Andaman and Nicobar Islands',
  CH: 'Chandigarh',
  DN: 'Dadra and Nagar Haveli and Daman and Diu',
  DL: 'Delhi',
  JK: 'Jammu and Kashmir',
  LA: 'Ladakh',
  LD: 'Lakshadweep',
  PY: 'Puducherry',
};

// Regex to validate standard Indian RTO format: e.g. "MH 12 AB 1234" or "MH12AB1234"
export const RTO_FORMAT_REGEX = /^[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{4}$/;

// Helper: extract and validate the state from a registration number
export const getStateFromRegistrationNumber = (regNumber) => {
  if (!regNumber) return null;
  const cleaned = regNumber.replace(/[\s-]/g, '').toUpperCase();
  const stateCode = cleaned.substring(0, 2);
  return RTO_STATE_CODES[stateCode] || null;
};

// ---------------------------------------------------------
// 5. FUEL TYPES (commonly needed alongside vehicle details)
// ---------------------------------------------------------
export const FUEL_TYPES = [
  { label: 'Petrol', value: 'petrol' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'CNG', value: 'cng' },
  { label: 'Electric', value: 'electric' },
  { label: 'Hybrid', value: 'hybrid' },
];

// ---------------------------------------------------------
// 6. MODEL YEARS — generate last 25 years dynamically
// ---------------------------------------------------------
export const getModelYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= currentYear - 24; y--) {
    years.push(y.toString());
  }
  return years;
};
