import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import BackButton from '../../src/components/ui/BackButton';

// react-native-webview is used on native; on web we use an iframe via dangerouslySetInnerHTML
let WebView = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    // Not installed — will fall back to placeholder
  }
}

const THEME = {
  background: '#F7F8FA',
  card: '#FFFFFF',
  border: '#E2E8F0',
  inputBg: '#EEF2F6',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  accent: '#F5A524',
  accentLight: '#FEF3C7',
  error: '#EF4444'
};

const BUSINESS_TYPES = [
  'Car Workshop',
  'Two-Wheeler Workshop',
  'Multi-brand Service Center',
  'Detailing & Wash',
  'Roadside Assistance Partner'
];

const AVAILABLE_SERVICES = [
  'Oil Change',
  'Tyres',
  'Battery',
  'Towing',
  'Bodywork',
  'Engine Tuning',
  'Detailing'
];

// Default center: Mumbai, India
const DEFAULT_LAT = 19.076;
const DEFAULT_LNG = 72.8777;

/**
 * Generates the HTML string for an embedded Leaflet + OpenStreetMap.
 * On click/tap, the page posts {lat, lng} back via window.ReactNativeWebView.postMessage
 * (native) or window.parent.postMessage (web iframe).
 */
function buildLeafletHTML(initialLat, initialLng) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { height: 100%; width: 100%; }
    .custom-pin {
      background: transparent;
      border: none;
    }
    .attribution-hint {
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.85);
      border-radius: 20px;
      padding: 3px 12px;
      font-size: 11px;
      font-family: sans-serif;
      color: #1A1A1A;
      font-weight: 600;
      pointer-events: none;
      z-index: 1000;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="attribution-hint" id="hint">Tap to pin your location</div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: true })
      .setView([${initialLat}, ${initialLng}], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    var pinIcon = L.divIcon({
      className: 'custom-pin',
      html: '<div style="font-size:32px;transform:translateY(-50%);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">📍</div>',
      iconAnchor: [16, 40],
      iconSize: [32, 40]
    });

    var marker = L.marker([${initialLat}, ${initialLng}], { icon: pinIcon, draggable: true }).addTo(map);

    function sendLocation(lat, lng) {
      var data = JSON.stringify({ lat: lat, lng: lng });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(data);
      } else if (window.parent !== window) {
        window.parent.postMessage({ type: 'MAP_PIN', lat: lat, lng: lng }, '*');
      }
      document.getElementById('hint').textContent = 'Location pinned ✓';
    }

    marker.on('dragend', function(e) {
      var pos = e.target.getLatLng();
      sendLocation(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      map.setView(e.latlng, map.getZoom());
      sendLocation(e.latlng.lat, e.latlng.lng);
    });

    // Send initial location immediately on load
    sendLocation(${initialLat}, ${initialLng});
  </script>
</body>
</html>`;
}

// ─── Web iframe component ─────────────────────────────────────────────────────
function WebIframeMap({ initialLat, initialLng, onLocationSelect }) {
  const iframeRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Listen for postMessage from the iframe
  React.useEffect(() => {
    const handler = (event) => {
      if (event.data && event.data.type === 'MAP_PIN') {
        onLocationSelect(event.data.lat, event.data.lng);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onLocationSelect]);

  const html = buildLeafletHTML(initialLat, initialLng);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  return (
    <View style={styles.mapWrapper}>
      {!mapReady && (
        <View style={styles.mapLoading}>
          <ActivityIndicator color={THEME.accent} size="small" />
          <Text style={styles.mapLoadingText}>Loading map…</Text>
        </View>
      )}
      <iframe
        ref={iframeRef}
        src={url}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 8,
          display: mapReady ? 'block' : 'none'
        }}
        onLoad={() => setMapReady(true)}
        title="OpenStreetMap Location Picker"
      />
    </View>
  );
}

// ─── Native WebView component ─────────────────────────────────────────────────
function NativeWebViewMap({ initialLat, initialLng, onLocationSelect }) {
  const [mapReady, setMapReady] = useState(false);
  const html = buildLeafletHTML(initialLat, initialLng);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.lat !== undefined && data.lng !== undefined) {
        onLocationSelect(data.lat, data.lng);
      }
    } catch (_) {}
  }, [onLocationSelect]);

  if (!WebView) {
    return (
      <View style={[styles.mapWrapper, styles.mapFallback]}>
        <Text style={styles.mapFallbackText}>📍 Map unavailable — enter address above</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapWrapper}>
      {!mapReady && (
        <View style={styles.mapLoading}>
          <ActivityIndicator color={THEME.accent} size="small" />
          <Text style={styles.mapLoadingText}>Loading map…</Text>
        </View>
      )}
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        onLoad={() => setMapReady(true)}
        style={mapReady ? styles.webView : styles.webViewHidden}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="compatibility"
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RegisterBusinessScreen({ formData, onContinue, onBack }) {
  const [error, setError] = useState('');

  const [contactPersonName, setContactPersonName] = useState(formData.contactPersonName || '');
  const [businessName, setBusinessName] = useState(formData.businessName || '');
  const [businessType, setBusinessType] = useState(formData.businessType || '');
  const [servicesOffered, setServicesOffered] = useState(formData.servicesOffered || []);
  const [businessAddress, setBusinessAddress] = useState(formData.businessAddress || '');
  const [city, setCity] = useState(formData.city || '');
  const [pincode, setPincode] = useState(formData.pincode || '');
  const [latitude, setLatitude] = useState(formData.latitude || DEFAULT_LAT);
  const [longitude, setLongitude] = useState(formData.longitude || DEFAULT_LNG);
  const [fetchedAddress, setFetchedAddress] = useState(formData.fetchedAddress || '');
  const [fetchingAddress, setFetchingAddress] = useState(false);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [locationPinned, setLocationPinned] = useState(
    !!(formData.latitude && formData.longitude)
  );

  const toggleService = (service) => {
    if (servicesOffered.includes(service)) {
      setServicesOffered(servicesOffered.filter(s => s !== service));
    } else {
      setServicesOffered([...servicesOffered, service]);
    }
  };

  const [gettingGps, setGettingGps] = useState(false);

  // Reverse geocode coordinates into full address details using OpenStreetMap Nominatim
  const fetchLocationAddress = useCallback(async (lat, lng) => {
    try {
      setFetchingAddress(true);
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const data = await response.json();
      if (data && data.display_name) {
        const fullAddr = data.display_name;
        setFetchedAddress(fullAddr);

        // Auto-extract city, pincode, and street address from geo location
        const addrObj = data.address || {};
        const detectedCity = addrObj.city || addrObj.town || addrObj.village || addrObj.suburb || addrObj.county || '';
        const detectedPincode = addrObj.postcode || '';

        // Clean street/area name for Business Address field
        const streetParts = [
          addrObj.building,
          addrObj.house_number,
          addrObj.road,
          addrObj.suburb || addrObj.neighbourhood || addrObj.residential,
          addrObj.city_district || addrObj.subdistrict
        ].filter(Boolean);

        const formattedGeoAddress = streetParts.length > 0 ? streetParts.join(', ') : fullAddr;

        // Auto-fill Business Address, City, and Pincode fields with geo location data
        setBusinessAddress(formattedGeoAddress);

        if (detectedCity) {
          setCity(detectedCity);
        }
        if (detectedPincode) {
          const cleanPin = detectedPincode.replace(/\D/g, '').slice(0, 6);
          if (cleanPin.length === 6) {
            setPincode(cleanPin);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch address from map coordinates:', err);
    } finally {
      setFetchingAddress(false);
    }
  }, []);

  // Fetch current GPS location from browser/device sensors
  const handleGetCurrentLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setGettingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          setLocationPinned(true);
          fetchLocationAddress(lat, lng);
          setGettingGps(false);
        },
        (error) => {
          console.error('GPS error:', error);
          setGettingGps(false);
          alert('Unable to retrieve GPS location. Please tap on the map to pin your location manually.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('GPS is not supported by this browser/device.');
    }
  };

  const handleLocationSelect = useCallback((lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationPinned(true);
    fetchLocationAddress(lat, lng);
  }, [fetchLocationAddress]);

  // Initial fetch for default pin location on mount
  React.useEffect(() => {
    if (!fetchedAddress) {
      fetchLocationAddress(latitude, longitude);
    }
  }, []);

  const handleContinue = () => {
    setError('');
    if (!contactPersonName || !businessName || !businessType || !businessAddress || !city) {
      setError('Please fill in required business details (Contact Person, Business Name, Type, Address, City).');
      return;
    }

    const finalPincode = pincode && pincode.trim().length === 6 && !isNaN(Number(pincode)) ? pincode.trim() : (pincode || '400001');
    const finalServices = servicesOffered.length > 0 ? servicesOffered : ['General Service'];

    onContinue({
      contactPersonName,
      businessName,
      businessType,
      servicesOffered: finalServices,
      businessAddress,
      city,
      pincode: finalPincode,
      latitude,
      longitude,
      fetchedAddress
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
      {/* Header & Back Button */}
      <View style={styles.header}>
        <BackButton variant="card" onPress={onBack} showLabel={false} />
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '33%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 3 (33%)</Text>
        </View>
      </View>

      <Text style={styles.heading}>Register your service center</Text>
      <Text style={styles.subtext}>Enter your business details to get started with AutoDoc.</Text>

      <View style={styles.card}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Contact Person Name */}
        <Text style={styles.label}>Contact Person Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Sarah Partner"
          placeholderTextColor="#888"
          value={contactPersonName}
          onChangeText={setContactPersonName}
        />

        {/* Business Name */}
        <Text style={styles.label}>Business Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Apex Auto Service"
          placeholderTextColor="#888"
          value={businessName}
          onChangeText={setBusinessName}
        />

        {/* Business Type */}
        <Text style={styles.label}>Business Type</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => setShowTypeDropdown(!showTypeDropdown)}
        >
          <Text style={styles.dropdownSelectorText}>
            {businessType || 'Select Business Type'}
          </Text>
          <Text style={styles.dropdownSelectorArrow}>▼</Text>
        </TouchableOpacity>

        {showTypeDropdown && (
          <View style={styles.dropdownList}>
            {BUSINESS_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.dropdownItem,
                  businessType === type && styles.dropdownItemActive
                ]}
                onPress={() => {
                  setBusinessType(type);
                  setShowTypeDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Services Offered */}
        <Text style={styles.label}>Services Offered</Text>
        <View style={styles.chipsContainer}>
          {AVAILABLE_SERVICES.map((service) => {
            const isSelected = servicesOffered.includes(service);
            return (
              <TouchableOpacity
                key={service}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => toggleService(service)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {service} {isSelected ? '✓' : '+'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Business Address */}
        <Text style={styles.label}>Business Address</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="e.g. 789 Grand Avenue, Industrial Zone"
          placeholderTextColor="#888"
          multiline
          numberOfLines={2}
          value={businessAddress}
          onChangeText={setBusinessAddress}
        />

        {/* City & Pincode */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Mumbai"
              placeholderTextColor="#888"
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="400001"
              placeholderTextColor="#888"
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />
          </View>
        </View>

        {/* OpenStreetMap Location Picker */}
        <View style={styles.locationHeaderRow}>
          <Text style={[styles.label, { marginTop: 0 }]}>Service Center Location</Text>
          <TouchableOpacity 
            style={styles.gpsBtn} 
            onPress={handleGetCurrentLocation}
            disabled={gettingGps}
          >
            {gettingGps ? (
              <ActivityIndicator size="small" color="#0046AD" />
            ) : (
              <Text style={styles.gpsBtnText}>🎯 Use GPS Location</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.mapHint}>
          Tap on the map to pin your exact location, or use GPS button above
        </Text>

        {Platform.OS === 'web' ? (
          <WebIframeMap
            initialLat={latitude}
            initialLng={longitude}
            onLocationSelect={handleLocationSelect}
          />
        ) : (
          <NativeWebViewMap
            initialLat={latitude}
            initialLng={longitude}
            onLocationSelect={handleLocationSelect}
          />
        )}

        {/* Location confirmation badge */}
        {locationPinned && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeIcon}>📍</Text>
            <Text style={styles.locationBadgeText}>
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </Text>
          </View>
        )}

        {/* Fetched Location Details Field */}
        <Text style={styles.label}>Fetched Location Details</Text>
        <View style={styles.fetchedAddressCard}>
          {fetchingAddress ? (
            <View style={styles.fetchingRow}>
              <ActivityIndicator size="small" color={THEME.accent} />
              <Text style={styles.fetchingText}>Fetching location details from map pin…</Text>
            </View>
          ) : (
            <TextInput
              style={[styles.input, styles.fetchedAddressInput]}
              value={fetchedAddress || `Pinned Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`}
              onChangeText={setFetchedAddress}
              placeholder="Address details fetched from map pin"
              placeholderTextColor="#888"
              multiline
              numberOfLines={2}
            />
          )}
        </View>

        {fetchedAddress ? (
          <TouchableOpacity
            style={styles.autoFillBtn}
            onPress={() => {
              setBusinessAddress(fetchedAddress);
            }}
          >
            <Text style={styles.autoFillBtnText}>⚡ Use as Business Address</Text>
          </TouchableOpacity>
        ) : null}

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: THEME.background,
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  backButton: {
    padding: 8,
    marginRight: 12
  },
  backArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.accent
  },
  progressContainer: {
    flex: 1
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.accent
  },
  progressText: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginTop: 4,
    fontWeight: '600'
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 6
  },
  subtext: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginBottom: 20
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  errorText: {
    color: THEME.error,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 6,
    marginTop: 12
  },
  input: {
    height: 44,
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: THEME.text,
    borderWidth: 1,
    borderColor: THEME.border
  },
  multilineInput: {
    height: 66,
    textAlignVertical: 'top',
    paddingVertical: 10
  },
  dropdownSelector: {
    height: 44,
    backgroundColor: THEME.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border
  },
  dropdownSelectorText: {
    fontSize: 13,
    color: THEME.text
  },
  dropdownSelectorArrow: {
    fontSize: 10,
    color: THEME.textSecondary
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 4,
    overflow: 'hidden'
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  dropdownItemActive: {
    backgroundColor: THEME.accentLight
  },
  dropdownItemText: {
    fontSize: 13,
    color: THEME.text
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 4
  },
  chip: {
    backgroundColor: '#EEF2F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  chipActive: {
    backgroundColor: THEME.accentLight,
    borderColor: THEME.accent
  },
  chipText: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '500'
  },
  chipTextActive: {
    color: '#92400E',
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  mapHint: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic'
  },
  mapWrapper: {
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#E8F5E9'
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    zIndex: 10
  },
  mapLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: THEME.textSecondary
  },
  webView: {
    flex: 1
  },
  webViewHidden: {
    height: 0,
    opacity: 0
  },
  mapFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9'
  },
  mapFallbackText: {
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center'
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0'
  },
  locationBadgeIcon: {
    fontSize: 14,
    marginRight: 6
  },
  locationBadgeText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  fetchedAddressCard: {
    marginTop: 6
  },
  fetchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8
  },
  fetchingText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '500'
  },
  fetchedAddressInput: {
    minHeight: 52,
    textAlignVertical: 'top',
    paddingTop: 8,
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    color: '#0369A1',
    fontWeight: '500'
  },
  autoFillBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F5A524',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  autoFillBtnText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: 'bold'
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4
  },
  gpsBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  gpsBtnText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: 'bold'
  },
  continueButton: {
    backgroundColor: THEME.accent,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
