// src/constants/vehicleData.js
// Reference data for AutoDoc's Add/Edit Vehicle form dropdowns.
// Brands and models are separated by vehicle TYPE so dropdowns are always contextual.

// ---------------------------------------------------------
// 1. VEHICLE TYPES
// ---------------------------------------------------------
export const VEHICLE_TYPES = [
  { label: 'Car',   value: 'car',   icon: 'car' },
  { label: 'Bike',  value: 'bike',  icon: 'motorbike' },
  { label: 'SUV',   value: 'suv',   icon: 'car-suv' },
  { label: 'Truck', value: 'truck', icon: 'truck' },
  { label: 'Other', value: 'other', icon: 'help-circle' },
];

// ---------------------------------------------------------
// 2. VEHICLE BRANDS + MODELS — keyed by vehicle TYPE
// ---------------------------------------------------------

/** 🚗 CAR brands & models */
const CAR_BRANDS_MODELS = {
  'Maruti Suzuki': [
    'Swift', 'Baleno', 'Dzire', 'Alto K10', 'WagonR', 'Ertiga',
    'Brezza', 'Celerio', 'Ignis', 'XL6', 'Grand Vitara', 'Fronx', 'Jimny',
  ],
  Hyundai: [
    'i20', 'Creta', 'Venue', 'Verna', 'Grand i10 Nios', 'Exter',
    'Alcazar', 'Tucson', 'Aura', 'Ioniq 5',
  ],
  Tata: [
    'Nexon', 'Punch', 'Altroz', 'Tiago', 'Harrier', 'Safari',
    'Tigor', 'Curvv', 'Nexon EV', 'Punch EV',
  ],
  Honda: ['City', 'Amaze', 'Elevate', 'WR-V', 'Jazz'],
  Toyota: [
    'Innova Crysta', 'Innova HyCross', 'Fortuner', 'Glanza',
    'Urban Cruiser Hyryder', 'Camry', 'Vellfire',
  ],
  Kia: ['Seltos', 'Sonet', 'Carens', 'EV6', 'EV9'],
  Volkswagen: ['Virtus', 'Taigun', 'Polo'],
  Skoda: ['Slavia', 'Kushaq', 'Kodiaq', 'Superb'],
  Renault: ['Kwid', 'Triber', 'Kiger', 'Duster'],
  Nissan: ['Magnite', 'Kicks'],
  MG: ['Hector', 'Astor', 'ZS EV', 'Comet EV', 'Gloster'],
  Citroen: ['C3', 'C3 Aircross', 'eC3'],
  Jeep: ['Compass', 'Meridian', 'Wrangler', 'Grand Cherokee'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLC', 'GLE', 'S-Class'],
  BMW: ['3 Series', '5 Series', 'X1', 'X3', 'X5', 'i4', 'iX'],
  Audi: ['A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron'],
  Other: ['Other / Not Listed'],
};

/** 🏍️ BIKE brands & models */
const BIKE_BRANDS_MODELS = {
  'Royal Enfield': [
    'Classic 350', 'Hunter 350', 'Bullet 350', 'Meteor 350',
    'Thunderbird 350', 'Himalayan', 'Scram 411', 'Continental GT 650',
    'Interceptor 650', 'Super Meteor 650', 'Shotgun 650',
  ],
  'Hero MotoCorp': [
    'Splendor Plus', 'Splendor+', 'HF Deluxe', 'Passion Pro',
    'Glamour', 'Xtreme 160R', 'Xtreme 200S', 'XPulse 200',
    'XPulse 200T', 'Maestro Edge', 'Destini 125', 'Xoom 110',
  ],
  Bajaj: [
    'Pulsar 125', 'Pulsar 150', 'Pulsar NS160', 'Pulsar NS200',
    'Pulsar RS200', 'Pulsar 220F', 'Dominar 250', 'Dominar 400',
    'Avenger Street 160', 'Avenger Cruise 220', 'Platina 100',
    'Platina 110 H-Gear', 'CT100', 'Chetak EV',
  ],
  TVS: [
    'Apache RTR 160', 'Apache RTR 160 4V', 'Apache RTR 200 4V',
    'Apache RR 310', 'Raider 125', 'Radeon', 'Star City+',
    'Jupiter 125', 'Jupiter Classic', 'Ntorq 125', 'iQube S',
    'iQube ST', 'Ronin', 'X21',
  ],
  Honda: [
    'Activa 6G', 'Activa 125', 'Shine 100', 'Shine', 'Unicorn',
    'SP125', 'Hornet 2.0', 'CB200X', 'CB300R', 'CB300F',
    'CB350', 'CB350RS', 'H\'ness CB350', 'CBR150R', 'CBR250R',
    'Africa Twin', 'CB500X',
  ],
  Yamaha: [
    'FZ-S FI', 'FZ-X', 'FZS 25', 'MT-15 V2', 'R15 V4',
    'R15 S', 'R15M', 'Fascino 125 FI', 'Ray ZR 125 FI',
    'RayZR Street Rally', 'Aerox 155', 'MT-03', 'R3', 'FZ-09',
  ],
  Suzuki: [
    'Access 125', 'Burgman Street', 'Gixxer SF 150', 'Gixxer SF 250',
    'Gixxer 250', 'V-Strom SX', 'Hayabusa', 'Intruder',
  ],
  KTM: [
    'Duke 125', 'Duke 200', 'Duke 250', 'Duke 390',
    'RC 125', 'RC 200', 'RC 390', '125 Adventure', '250 Adventure',
    '390 Adventure', '390 Enduro R',
  ],
  'Kawasaki': [
    'Ninja 300', 'Ninja 400', 'Ninja 650', 'Ninja 1000 SX',
    'Z400', 'Z650', 'Z900', 'Versys 650', 'Versys-X 300',
    'W175', 'Eliminator 450',
  ],
  Jawa: ['Jawa 42', 'Jawa 42 FJ', 'Jawamoto', 'Perak', 'Yezdi Road King', 'Yezdi Adventure', 'Yezdi Scrambler'],
  'CF Moto': ['300NK', '650NK', '650MT', '650GT', '300SR'],
  'Triumph': ['Speed 400', 'Scrambler 400 X', 'Trident 660', 'Tiger 660', 'Street Triple'],
  Harley: ['X440', 'Iron 883', 'Forty-Eight', 'Fat Boy', 'Street Glide'],
  'Ola Electric': ['S1 Pro', 'S1 Air', 'S1 X', 'S1 X+'],
  'Ather': ['450X', '450S', 'Rizta'],
  'Revolt': ['RV400', 'RV300'],
  Other: ['Other / Not Listed'],
};

/** 🚙 SUV brands & models */
const SUV_BRANDS_MODELS = {
  Mahindra: [
    'Scorpio-N', 'Scorpio Classic', 'XUV700', 'XUV400', 'XUV300',
    'Thar', 'Bolero', 'Bolero Neo', 'Marazzo', 'BE 6', 'XEV 9e',
  ],
  Tata: ['Harrier', 'Safari', 'Nexon', 'Punch', 'Curvv', 'Sierra EV'],
  Hyundai: ['Creta', 'Alcazar', 'Venue', 'Tucson', 'Exter'],
  Kia: ['Seltos', 'Carens', 'Sonet', 'EV6'],
  Toyota: ['Fortuner', 'Urban Cruiser Hyryder', 'Innova HyCross', 'Land Cruiser', 'Rush'],
  Jeep: ['Compass', 'Meridian', 'Wrangler', 'Grand Cherokee', 'Avenger'],
  MG: ['Hector', 'Gloster', 'Astor', 'ZS EV', 'Windsor EV'],
  Volkswagen: ['Taigun', 'Tiguan'],
  Skoda: ['Kushaq', 'Kodiaq', 'Karoq'],
  Honda: ['Elevate', 'CR-V'],
  Ford: ['EcoSport', 'Endeavour'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover Sport', 'Range Rover'],
  'Mercedes-Benz': ['GLA', 'GLC', 'GLE', 'GLB', 'GLS', 'G-Class'],
  BMW: ['X1', 'X3', 'X5', 'X7', 'iX'],
  Audi: ['Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
  Other: ['Other / Not Listed'],
};

/** 🚚 TRUCK brands & models */
const TRUCK_BRANDS_MODELS = {
  Tata: [
    'Ace HT+', 'Intra V30', 'Ultra T.7', 'LPT 709', 'LPT 1613',
    'Prima 4940.S', 'Signa 3718.TK', 'Yodha Pickup', 'Xenon',
  ],
  Mahindra: [
    'Jeeto Plus', 'Supro Profit Truck', 'Blazo X 28', 'Furio 7',
    'Furio 14', 'Bolero Maxi Truck Plus',
  ],
  Ashok_Leyland: [
    'DOST+', 'BOSS', 'Ecomet 1015', 'U-Truck 1616', 'Captain',
    'Phoenix', 'Stile',
  ],
  'Eicher': ['Pro 2049', 'Pro 3015', 'Pro 6016', 'Pro 8031'],
  'BharatBenz': ['914R', '1217C', '2528R', '4228R'],
  Isuzu: ['D-Max', 'D-Max V-Cross', 'MU-X'],
  Maruti: ['Super Carry'],
  Other: ['Other / Not Listed'],
};

/** ⚙️ OTHER vehicle types */
const OTHER_BRANDS_MODELS = {
  'Auto Rickshaw': ['Bajaj RE', 'TVS King', 'Mahindra Alfa', 'Piaggio Ape'],
  'Electric Scooter': ['Ola S1 Pro', 'Ather 450X', 'Hero Optima', 'Ampere Magnus EX'],
  'Tractor': ['Mahindra 575 DI', 'John Deere 5050 D', 'Sonalika DI 745 III', 'Eicher 241'],
  'Quadricycle': ['Bajaj Qute'],
  Other: ['Other / Not Listed'],
};

// ---------------------------------------------------------
// 3. MASTER MAP — keyed by vehicle type
// ---------------------------------------------------------
export const BRANDS_MODELS_BY_TYPE = {
  car:   CAR_BRANDS_MODELS,
  bike:  BIKE_BRANDS_MODELS,
  suv:   SUV_BRANDS_MODELS,
  truck: TRUCK_BRANDS_MODELS,
  other: OTHER_BRANDS_MODELS,
};

/**
 * Get the list of brand names for a given vehicle type.
 * @param {string} vehicleType - 'car' | 'bike' | 'suv' | 'truck' | 'other'
 */
export const getBrandsForType = (vehicleType) =>
  Object.keys(BRANDS_MODELS_BY_TYPE[vehicleType] || {});

/**
 * Get the list of models for a given vehicle type + brand combination.
 * @param {string} vehicleType
 * @param {string} brand
 */
export const getModelsForBrand = (brand, vehicleType = 'car') => {
  const typeMap = BRANDS_MODELS_BY_TYPE[vehicleType] || CAR_BRANDS_MODELS;
  return typeMap[brand] || [];
};

// Legacy flat list kept for backward compatibility (used by some imports)
export const VEHICLE_BRANDS = Object.keys(CAR_BRANDS_MODELS);
export const VEHICLE_BRANDS_MODELS = CAR_BRANDS_MODELS;

// ---------------------------------------------------------
// 4. FUEL TYPES — filtered based on vehicle type
// ---------------------------------------------------------
export const FUEL_TYPES_BY_TYPE = {
  car:   [
    { label: 'Petrol',   value: 'petrol' },
    { label: 'Diesel',   value: 'diesel' },
    { label: 'CNG',      value: 'cng' },
    { label: 'Electric', value: 'electric' },
    { label: 'Hybrid',   value: 'hybrid' },
    { label: 'LPG',      value: 'lpg' },
  ],
  bike:  [
    { label: 'Petrol',   value: 'petrol' },
    { label: 'Electric', value: 'electric' },
    { label: 'CNG',      value: 'cng' },
  ],
  suv:   [
    { label: 'Petrol',   value: 'petrol' },
    { label: 'Diesel',   value: 'diesel' },
    { label: 'Electric', value: 'electric' },
    { label: 'Hybrid',   value: 'hybrid' },
  ],
  truck: [
    { label: 'Diesel',   value: 'diesel' },
    { label: 'CNG',      value: 'cng' },
    { label: 'Electric', value: 'electric' },
  ],
  other: [
    { label: 'Petrol',   value: 'petrol' },
    { label: 'Diesel',   value: 'diesel' },
    { label: 'Electric', value: 'electric' },
    { label: 'CNG',      value: 'cng' },
  ],
};

// Legacy — defaults to all fuel types
export const FUEL_TYPES = FUEL_TYPES_BY_TYPE.car;

/**
 * Get the fuel types available for a given vehicle type.
 * @param {string} vehicleType
 */
export const getFuelTypesForVehicleType = (vehicleType) =>
  FUEL_TYPES_BY_TYPE[vehicleType] || FUEL_TYPES_BY_TYPE.car;

// ---------------------------------------------------------
// 5. VEHICLE COLORS
// ---------------------------------------------------------
export const VEHICLE_COLORS = [
  { label: 'White',      value: 'white',      hex: '#FFFFFF' },
  { label: 'Black',      value: 'black',      hex: '#1A1A1A' },
  { label: 'Silver',     value: 'silver',     hex: '#C0C0C0' },
  { label: 'Grey',       value: 'grey',       hex: '#808080' },
  { label: 'Red',        value: 'red',        hex: '#C0392B' },
  { label: 'Blue',       value: 'blue',       hex: '#2E5FA3' },
  { label: 'Yellow',     value: 'yellow',     hex: '#E8C547' },
  { label: 'Orange',     value: 'orange',     hex: '#D2691E' },
  { label: 'Green',      value: 'green',      hex: '#2E7D4F' },
  { label: 'Maroon',     value: 'maroon',     hex: '#5C1A1A' },
  { label: 'Brown',      value: 'brown',      hex: '#6B4423' },
  { label: 'Beige',      value: 'beige',      hex: '#D8C6A5' },
  { label: 'Gold',       value: 'gold',       hex: '#B8860B' },
  { label: 'Pearl White',value: 'pearl_white',hex: '#F5F5F5' },
  { label: 'Matte Black',value: 'matte_black',hex: '#2C2C2C' },
  { label: 'Other',      value: 'other',      hex: '#999999' },
];

// ---------------------------------------------------------
// 6. RTO STATE CODES (India)
// ---------------------------------------------------------
export const RTO_STATE_CODES = {
  AP: 'Andhra Pradesh',     AR: 'Arunachal Pradesh',
  AS: 'Assam',              BR: 'Bihar',
  CG: 'Chhattisgarh',       GA: 'Goa',
  GJ: 'Gujarat',            HR: 'Haryana',
  HP: 'Himachal Pradesh',   JH: 'Jharkhand',
  KA: 'Karnataka',          KL: 'Kerala',
  MP: 'Madhya Pradesh',     MH: 'Maharashtra',
  MN: 'Manipur',            ML: 'Meghalaya',
  MZ: 'Mizoram',            NL: 'Nagaland',
  OD: 'Odisha',             PB: 'Punjab',
  RJ: 'Rajasthan',          SK: 'Sikkim',
  TN: 'Tamil Nadu',         TS: 'Telangana',
  TR: 'Tripura',            UP: 'Uttar Pradesh',
  UK: 'Uttarakhand',        WB: 'West Bengal',
  AN: 'Andaman and Nicobar Islands',
  CH: 'Chandigarh',
  DN: 'Dadra and Nagar Haveli and Daman and Diu',
  DL: 'Delhi',              JK: 'Jammu and Kashmir',
  LA: 'Ladakh',             LD: 'Lakshadweep',
  PY: 'Puducherry',
};

// Comprehensive Indian Vehicle Registration Regex (Standard State RTO + MoRTH Bharat BH Series)
// Examples supported:
//  - Standard State RTO: "MH 12 AB 1234", "KL 29 P 1829", "DL 1C AB 1234", "KA 05 1234", "MH12AB1234"
//  - Bharat Series (BH):  "21 BH 1234 AA", "22 BH 9876 AB", "26BH1234AB"
export const RTO_FORMAT_REGEX = /^(?:[A-Z]{2}[\s-]?[0-9]{1,2}(?:[\s-]?[A-Z]{1,3})?[\s-]?[0-9]{4}|[0-9]{2}[\s-]?BH[\s-]?[0-9]{4}[\s-]?[A-Z]{1,2})$/i;

/** Extract and validate the state/series from an Indian registration number */
export const getStateFromRegistrationNumber = (regNumber) => {
  if (!regNumber) return null;
  const cleaned = regNumber.replace(/[\s-]/g, '').toUpperCase();

  // 1. Check for Bharat (BH) Series (format: YY BH NNNN AA)
  if (/^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/.test(cleaned)) {
    return 'Bharat Series (Pan-India)';
  }

  // 2. Check for Standard State RTO Code (first two characters)
  const stateCode = cleaned.substring(0, 2);
  if (RTO_STATE_CODES[stateCode]) {
    return RTO_STATE_CODES[stateCode];
  }

  return null;
};

// ---------------------------------------------------------
// 7. MODEL YEARS — last 30 years dynamically
// ---------------------------------------------------------
export const getModelYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= currentYear - 29; y--) {
    years.push(y.toString());
  }
  return years;
};
