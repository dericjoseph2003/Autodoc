import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, setToken, getToken, subscribeToToken } from '../services/api';

// Importing Role Dashboard Home Screens
import OwnerHomeScreen from './owner/OwnerHomeScreen';
import ServiceCenterHomeScreen from './serviceCenter/ServiceCenterHomeScreen';
import AdminHomeScreen from './admin/AdminHomeScreen';
import PendingApprovalScreen from '../../screens/PendingApprovalScreen';
import ProfileEditScreen from '../../screens/ProfileEditScreen';
import VehicleProfileScreen from './owner/VehicleProfileScreen';
import VehicleOwnerLandingScreen from './owner/VehicleOwnerLandingScreen';
import ServiceCenterLandingScreen from './serviceCenter/ServiceCenterLandingScreen';
import BackButton from '../components/ui/BackButton';
import AuthScreen from '../components/AuthScreen';

// Consistent Premium Light-Mode Design System
const THEME = {
  background: '#F4F6F9',      // Premium light grey/blue from Autodoc
  card: '#FFFFFF',            // Pure white card background
  border: '#E2E8F0',          // Soft light slate border
  inputBorder: '#E2E8F0',
  inputBg: '#EEF2F6',         // Muted input background
  text: '#0F172A',            // Charcoal/Navy text from Autodoc
  textSecondary: '#64748B',   // Slate grey subtext
  primary: '#0046AD',         // Deep Royal Blue from Autodoc
  accent: '#F5A524',          // Amber accent
  accentLight: '#FEF3C7',
  success: '#10B981',
  error: '#EF4444',
  buttonBg: '#EEF2F6',
  selectedBg: '#0046AD10'     // Selected background tint
};

export default function AppIndex() {
  // Global States
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'onboarding' | 'owner_landing' | 'service_center_landing' | 'login' | 'signup' | 'forgot_password' | 'dashboard' | 'pending_approval'>('splash');
  const [authRole, setAuthRole] = useState<'owner' | 'service_center'>('owner');

  // Navigation tabs state per role
  const [activeTab, setActiveTab] = useState<'Home' | 'My Vehicles' | 'Service Centers' | 'Roadside' | 'Profile' | 'ProfileEdit' | 'Appointments' | 'Spare Parts' | 'Roadside Requests' | 'Users' | 'Reports'>('Home');

  // Vehicle Form Inputs (for Owner's "My Vehicles" tab)
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);

  // Lists Data
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [documents, setDocuments] = useState<{ [vehicleId: string]: any[] }>({});
  
  // File Upload Reference (for Web)
  const fileInputRef = useRef<any>(null);
  const [uploadingDocVehicleId, setUploadingDocVehicleId] = useState<string | null>(null);
  const [uploadingDocType, setUploadingDocType] = useState<'RC' | 'Insurance' | 'PUC' | 'Other' | null>(null);

  // Direct Guest / Role Entry (Bypassing Login/Registration)
  const enterAsGuestOwner = (defaultTab: any = 'Home') => {
    setToken('guest_owner_token');
    setUser({
      _id: 'guest_owner',
      name: 'Vehicle Owner',
      email: 'owner@autodoc.com',
      role: 'owner',
      phone: '9876543210'
    });
    setActiveTab(defaultTab);
    setCurrentScreen('dashboard');
  };

  const enterAsGuestServiceCenter = (defaultTab: any = 'Home') => {
    setToken('guest_sc_token');
    setUser({
      _id: 'guest_sc',
      name: 'Service Center Manager',
      email: 'service@autodoc.com',
      role: 'service_center',
      phone: '9876543210'
    });
    setActiveTab(defaultTab);
    setCurrentScreen('dashboard');
  };

  // Sync auth state
  useEffect(() => {
    return subscribeToToken((token) => {
      if (!token) {
        setUser(null);
        setCurrentScreen(prev => (prev === 'dashboard' || prev === 'pending_approval' || prev === 'splash') ? 'onboarding' : prev);
      }
    });
  }, []);

  // Auto-restore user session on page reload/startup
  useEffect(() => {
    const restoreUserSession = async () => {
      const savedToken = getToken();
      if (!savedToken) {
        return;
      }

      if (savedToken === 'guest_owner_token') {
        setUser({
          _id: 'guest_owner',
          name: 'Vehicle Owner',
          email: 'owner@autodoc.com',
          role: 'owner',
          phone: '9876543210'
        });
        setActiveTab('Home');
        setCurrentScreen('dashboard');
        return;
      }

      if (savedToken === 'guest_sc_token') {
        setUser({
          _id: 'guest_sc',
          name: 'Service Center Manager',
          email: 'service@autodoc.com',
          role: 'service_center',
          phone: '9876543210'
        });
        setActiveTab('Home');
        setCurrentScreen('dashboard');
        return;
      }

      try {
        setLoading(true);
        const res = await api.getProfile();
        if (res && res.user) {
          setUser(res.user);
          setActiveTab('Home');
          setCurrentScreen('dashboard');
        } else {
          setToken(null);
          setUser(null);
          setCurrentScreen(prev => prev === 'splash' ? 'onboarding' : prev);
        }
      } catch (err: any) {
        console.log('Session auto-restore error or token expired:', err);
        setToken(null);
        setUser(null);
        setCurrentScreen(prev => prev === 'splash' ? 'onboarding' : prev);
      } finally {
        setLoading(false);
      }
    };
    restoreUserSession();
  }, []);

  // Splash screen transition timer
  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        setCurrentScreen(prev => prev === 'splash' ? 'onboarding' : prev);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // Fetch Owner vehicles list
  const loadVehiclesData = async () => {
    if (!user || user.role !== 'owner') return;
    try {
      setLoading(true);
      const res = await api.listVehicles();
      setVehicles(res.vehicles || []);
      
      const docMap: { [key: string]: any[] } = {};
      for (const v of res.vehicles || []) {
        const docRes = await api.listDocuments(v._id);
        docMap[v._id] = docRes.documents || [];
      }
      setDocuments(docMap);
    } catch (err: any) {
      console.error('Failed to load vehicle dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'My Vehicles') {
      loadVehiclesData();
    }
  }, [user, activeTab]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setActiveTab('Home');
    setCurrentScreen('onboarding');
  };

  // Vehicle Addition handled inside AddVehicleScreen component

  const handleDeleteVehicle = async (id: string) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle and all its documents?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.deleteVehicle(id);
              await loadVehiclesData();
            } catch (err: any) {
              alertMsg('Error', err.message || 'Failed to delete vehicle');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const alertMsg = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  // File Upload Helper
  const triggerDocUpload = (vehicleId: string, docType: 'RC' | 'Insurance' | 'PUC' | 'Other') => {
    setUploadingDocVehicleId(vehicleId);
    setUploadingDocType(docType);

    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      handleMockUpload(vehicleId, docType);
    }
  };

  const handleWebFileSelect = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !uploadingDocVehicleId || !uploadingDocType) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vehicleId', uploadingDocVehicleId);
      formData.append('documentType', uploadingDocType);
      
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 365);
      formData.append('expiryDate', expiry.toISOString());

      await api.uploadDocument(formData);
      await loadVehiclesData();
      alertMsg('Success', `${uploadingDocType} uploaded successfully.`);
    } catch (err: any) {
      alertMsg('Error', err.message || 'File upload failed');
    } finally {
      setLoading(false);
      setUploadingDocVehicleId(null);
      setUploadingDocType(null);
    }
  };

  const handleMockUpload = async (vehicleId: string, docType: 'RC' | 'Insurance' | 'PUC' | 'Other') => {
    try {
      setLoading(true);
      const formData = new FormData();
      const mockBlob = new Blob([`Mock ${docType} content`], { type: 'image/png' });
      formData.append('file', mockBlob, `mock_${docType.toLowerCase()}.png`);
      formData.append('vehicleId', vehicleId);
      formData.append('documentType', docType);
      
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 15);
      formData.append('expiryDate', expiry.toISOString());

      await api.uploadDocument(formData);
      await loadVehiclesData();
      alertMsg('Success', `[Mock Upload] ${docType} document uploaded successfully.`);
    } catch (err: any) {
      alertMsg('Error', err.message || 'Mock file upload failed');
    } finally {
      setLoading(false);
      setUploadingDocVehicleId(null);
      setUploadingDocType(null);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      setLoading(true);
      await api.deleteDocument(docId);
      await loadVehiclesData();
      alertMsg('Success', 'Document deleted successfully.');
    } catch (err: any) {
      alertMsg('Error', err.message || 'Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const getDocStatus = (vehicleId: string, type: string) => {
    const list = documents[vehicleId] || [];
    return list.find(d => d.documentType === type);
  };

  // Navigations bottom bars per role
  const getTabIconName = (tab: string, isActive: boolean): keyof typeof Ionicons.glyphMap => {
    switch (tab) {
      case 'Home':
        return isActive ? 'home' : 'home-outline';
      case 'My Vehicles':
        return isActive ? 'car' : 'car-outline';
      case 'Service Centers':
        return isActive ? 'construct' : 'construct-outline';
      case 'Roadside':
      case 'Roadside Requests':
        return isActive ? 'warning' : 'warning-outline';
      case 'Profile':
        return isActive ? 'person' : 'person-outline';
      case 'Appointments':
        return isActive ? 'calendar' : 'calendar-outline';
      case 'Spare Parts':
        return isActive ? 'cube' : 'cube-outline';
      case 'Users':
        return isActive ? 'people' : 'people-outline';
      case 'Reports':
        return isActive ? 'stats-chart' : 'stats-chart-outline';
      default:
        return isActive ? 'grid' : 'grid-outline';
    }
  };

  const renderTabItem = (tab: string, displayLabel: string) => {
    const isActive = activeTab === tab;
    const iconName = getTabIconName(tab, isActive);

    return (
      <TouchableOpacity
        key={tab}
        style={styles.navTab}
        activeOpacity={0.7}
        onPress={() => setActiveTab(tab as any)}
      >
        <View style={[styles.navIconCircle, isActive && styles.navIconCircleActive]}>
          <Ionicons
            name={iconName}
            size={22}
            color={isActive ? '#FFFFFF' : '#64748B'}
          />
        </View>
        <Text style={[styles.navTabText, isActive && styles.navTabTextActive]}>
          {displayLabel}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderOwnerNavigator = () => {
    const tabs: Array<{ key: 'Home' | 'My Vehicles' | 'Service Centers' | 'Roadside' | 'Profile'; label: string }> = [
      { key: 'Home', label: 'Home' },
      { key: 'My Vehicles', label: 'Vehicles' },
      { key: 'Service Centers', label: 'Workshops' },
      { key: 'Roadside', label: 'Roadside' },
      { key: 'Profile', label: 'Profile' }
    ];

    return (
      <View style={styles.navBar}>
        {tabs.map(t => renderTabItem(t.key, t.label))}
      </View>
    );
  };

  const renderServiceCenterNavigator = () => {
    const tabs: Array<{ key: 'Home' | 'Appointments' | 'Spare Parts' | 'Roadside Requests' | 'Profile'; label: string }> = [
      { key: 'Home', label: 'Home' },
      { key: 'Appointments', label: 'Bookings' },
      { key: 'Spare Parts', label: 'Inventory' },
      { key: 'Roadside Requests', label: 'Requests' },
      { key: 'Profile', label: 'Profile' }
    ];

    return (
      <View style={styles.navBar}>
        {tabs.map(t => renderTabItem(t.key, t.label))}
      </View>
    );
  };

  const renderAdminNavigator = () => {
    const tabs: Array<{ key: 'Home' | 'Users' | 'Service Centers' | 'Reports' | 'Profile'; label: string }> = [
      { key: 'Home', label: 'Home' },
      { key: 'Users', label: 'Users' },
      { key: 'Service Centers', label: 'Approvals' },
      { key: 'Reports', label: 'Analytics' },
      { key: 'Profile', label: 'Profile' }
    ];

    return (
      <View style={styles.navBar}>
        {tabs.map(t => renderTabItem(t.key, t.label))}
      </View>
    );
  };

  // Render Screens based on activeTab state and Role Guard
  const renderDashboardScreen = () => {
    const role = user?.role;

    // Defensive check route guard
    if (role === 'owner') {
      if (activeTab === 'Home') {
        return <OwnerHomeScreen user={user} onNavigateToTab={(t) => setActiveTab(t as any)} />;
      }
      if (activeTab === 'ProfileEdit') {
        return (
          <ProfileEditScreen
            user={user}
            onSave={(updatedUser: any) => {
              setUser(updatedUser);
              setActiveTab('Home');
            }}
            onCancel={() => {
              setActiveTab('Home');
            }}
          />
        );
      }
      if (activeTab === 'My Vehicles') {
        return renderOwnerVehiclesScreen();
      }
      if (activeTab === 'Service Centers') {
        return (
          <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
            <BackButton variant="card" label="Back to Home" onPress={() => setActiveTab('Home')} style={{ marginBottom: 12 }} />
            <Text style={styles.viewHeader}>Partners & Service Centers</Text>
            <Text style={styles.mutedText}>List of verified service centers will appear here.</Text>
          </ScrollView>
        );
      }
      if (activeTab === 'Roadside') {
        return (
          <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
            <BackButton variant="card" label="Back to Home" onPress={() => setActiveTab('Home')} style={{ marginBottom: 12 }} />
            <Text style={styles.viewHeader}>Roadside Emergency</Text>
            <TouchableOpacity style={styles.roadsideBigBtn} onPress={() => alert('🚨 Emergency roadside request dispatched!')}>
              <Text style={styles.roadsideBigBtnText}>Tap for Roadside Help 🚨</Text>
            </TouchableOpacity>
          </ScrollView>
        );
      }
    }

    if (role === 'service_center') {
      if (activeTab === 'Home') {
        return <ServiceCenterHomeScreen user={user} onNavigateToTab={(t) => setActiveTab(t as any)} />;
      }
      if (activeTab === 'Appointments') {
        return (
          <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
            <BackButton variant="card" label="Back to Home" onPress={() => setActiveTab('Home')} style={{ marginBottom: 12 }} />
            <Text style={styles.viewHeader}>Appointments Registry</Text>
            <Text style={styles.mutedText}>Manage customer service bookings.</Text>
          </ScrollView>
        );
      }
      if (activeTab === 'Spare Parts') {
        return (
          <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
            <BackButton variant="card" label="Back to Home" onPress={() => setActiveTab('Home')} style={{ marginBottom: 12 }} />
            <Text style={styles.viewHeader}>Spare Parts Catalog</Text>
            <Text style={styles.mutedText}>Track inventory levels and pricing.</Text>
          </ScrollView>
        );
      }
      if (activeTab === 'Roadside Requests') {
        return (
          <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
            <BackButton variant="card" label="Back to Home" onPress={() => setActiveTab('Home')} style={{ marginBottom: 12 }} />
            <Text style={styles.viewHeader}>Roadside Breakdowns</Text>
            <Text style={styles.mutedText}>Assigned active roadside breakdown requests.</Text>
          </ScrollView>
        );
      }
    }

    if (role === 'admin') {
      if (activeTab === 'Home') {
        return <AdminHomeScreen user={user} onNavigateToTab={(t) => setActiveTab(t as any)} />;
      }
      if (activeTab === 'Users') {
        return (
          <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
            <BackButton variant="card" label="Back to Home" onPress={() => setActiveTab('Home')} style={{ marginBottom: 12 }} />
            <Text style={styles.viewHeader}>Registered Users</Text>
            <Text style={styles.mutedText}>View and audit registered owners and mechanics.</Text>
          </ScrollView>
        );
      }
      if (activeTab === 'Service Centers') {
        return <AdminHomeScreen user={user} onNavigateToTab={(t) => setActiveTab(t as any)} />;
      }
      if (activeTab === 'Reports') {
        return (
          <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
            <BackButton variant="card" label="Back to Home" onPress={() => setActiveTab('Home')} style={{ marginBottom: 12 }} />
            <Text style={styles.viewHeader}>System Reports</Text>
            <Text style={styles.mutedText}>System activity logs, usage stats, and revenue overviews.</Text>
          </ScrollView>
        );
      }
    }

    // Common Profile Tab for all roles
    if (activeTab === 'Profile') {
      const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length >= 2) {
          return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
      };

      const initials = getInitials(user.name);

      return (
        <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true} persistentScrollbar={true}>
          {/* Top Header Banner */}
          <View style={styles.profileHeaderBanner}>
            <View style={styles.profileHeaderTextGroup}>
              <Text style={styles.profileHeaderMainTitle}>My Profile</Text>
              <Text style={styles.profileHeaderSubTitle}>Manage your account and security settings</Text>
            </View>

            <TouchableOpacity 
              style={styles.avatarCircleContainer}
              activeOpacity={0.8}
              onPress={() => user.role === 'owner' && setActiveTab('ProfileEdit')}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitialsText}>{initials}</Text>
              </View>
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={9} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Account Profile Details Card */}
          <View style={styles.profileCard}>
            {/* Inner Header Row */}
            <View style={styles.profileCardHeaderRow}>
              <View style={styles.profileCardHeaderIconBg}>
                <Ionicons name="person-outline" size={22} color="#0046AD" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileCardTitle}>Account Profile</Text>
                <Text style={styles.profileCardSubTitle}>Your personal information</Text>
              </View>
            </View>

            {/* Profile Fields List */}
            <View style={styles.profileRowItem}>
              <View style={styles.profileRowLeft}>
                <Ionicons name="person-outline" size={18} color="#3B82F6" />
                <Text style={styles.profileRowLabel}>Name</Text>
              </View>
              <Text style={styles.profileRowVal}>{user.name}</Text>
            </View>

            <View style={styles.profileRowItem}>
              <View style={styles.profileRowLeft}>
                <Ionicons name="mail-outline" size={18} color="#3B82F6" />
                <Text style={styles.profileRowLabel}>Email</Text>
              </View>
              <Text style={styles.profileRowVal}>{user.email}</Text>
            </View>

            <View style={styles.profileRowItem}>
              <View style={styles.profileRowLeft}>
                <Ionicons name="call-outline" size={18} color="#3B82F6" />
                <Text style={styles.profileRowLabel}>Phone</Text>
              </View>
              <Text style={styles.profileRowVal}>{user.phone || 'N/A'}</Text>
            </View>

            <View style={[styles.profileRowItem, { borderBottomWidth: 0 }]}>
              <View style={styles.profileRowLeft}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#3B82F6" />
                <Text style={styles.profileRowLabel}>Role</Text>
              </View>
              <View style={styles.roleBadgePill}>
                <Text style={styles.roleBadgePillText}>{user.role ? user.role.toUpperCase() : 'USER'}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            {user.role === 'owner' && (
              <TouchableOpacity 
                style={styles.editProfileBtnNew} 
                activeOpacity={0.7}
                onPress={() => setActiveTab('ProfileEdit')}
              >
                <Ionicons name="pencil-outline" size={16} color="#0046AD" />
                <Text style={styles.editProfileBtnTextNew}>Edit Profile Details</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.logoutBtnNew} 
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={16} color="#DC2626" />
              <Text style={styles.logoutBtnTextNew}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    if (activeTab === 'ProfileEdit') {
      return (
        <ProfileEditScreen
          user={user}
          onSave={(updatedUser: any) => {
            setUser(updatedUser);
            setActiveTab('Profile');
          }}
          onCancel={() => setActiveTab('Profile')}
        />
      );
    }

    return null;
  };

  // Render Vehicles Tab specifically for Owner
  const renderOwnerVehiclesScreen = () => {
    return (
      <VehicleProfileScreen
        vehicles={vehicles}
        documents={documents}
        onAddVehicle={() => setShowAddVehicleForm(true)}
        onDeleteVehicle={handleDeleteVehicle}
        onUploadDoc={(vehicleId, docType) => triggerDocUpload(vehicleId, docType as any)}
        onDeleteDoc={handleDeleteDoc}
        onRefresh={loadVehiclesData}
        onBack={() => setActiveTab('Home')}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Hidden file input for web file picker */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleWebFileSelect}
          accept=".pdf,.png,.jpg,.jpeg"
        />
      )}

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME.accent} />
        </View>
      )}

      {/* SPLASH SCREEN */}
      {currentScreen === 'splash' && (
        <View style={styles.splashContainer}>
          <View style={styles.splashContent}>
            <Text style={styles.splashLogoText}>AutoDoc</Text>
            <Text style={styles.splashTagline}>We've Got Your Back</Text>
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 32 }} />
          </View>
        </View>
      )}

      {/* REDESIGNED LANDING PAGE */}
      {currentScreen === 'onboarding' && (
        <SafeAreaView style={styles.landingContainer}>
          <ScrollView
            contentContainerStyle={styles.landingScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Dark Blue Header Banner Card */}
            <View style={styles.heroDarkCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.brandBadge}>
                  <View style={styles.brandIconBox}>
                    <Ionicons name="car-sport" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.brandBadgeText}>AutoDoc</Text>
                </View>
                <TouchableOpacity
                  style={styles.loginPillBtn}
                  activeOpacity={0.8}
                  onPress={() => setCurrentScreen('login')}
                >
                  <Text style={styles.loginPillText}>Log in</Text>
                  <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.welcomeTag}>WELCOME BACK</Text>
              <Text style={styles.heroTitle}>One app for every vehicle, every workshop.</Text>
              <Text style={styles.heroSubtitle}>
                Continue as an owner tracking your car, or as a service center running your bays.
              </Text>
            </View>

            {/* Role Selection Cards */}
            <View style={styles.rolesSection}>
              {/* Option 1: Vehicle Owner */}
              <TouchableOpacity
                style={styles.roleCard}
                activeOpacity={0.85}
                onPress={() => setCurrentScreen('owner_landing')}
              >
                <View style={[styles.roleIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="car-sport" size={24} color="#0284C7" />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>I'm a vehicle owner</Text>
                  <Text style={styles.roleSubtitle}>
                    Book services, track assessments, get roadside help.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              {/* Option 2: Service Center */}
              <TouchableOpacity
                style={styles.roleCard}
                activeOpacity={0.85}
                onPress={() => setCurrentScreen('service_center_landing')}
              >
                <View style={[styles.roleIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="construct" size={22} color="#16A34A" />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>I run a service center</Text>
                  <Text style={styles.roleSubtitle}>
                    Manage bookings, technicians, and workshop operations.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* "What you can do" Grid Section */}
            <View style={styles.featuresSection}>
              <View style={styles.featuresHeader}>
                <Text style={styles.featuresTitle}>What you can do</Text>
                <Text style={styles.featuresCountBadge}>6 features</Text>
              </View>

              <View style={styles.featuresGrid}>
                {/* 1. Vehicle assessments */}
                <TouchableOpacity
                  style={styles.featureGridCard}
                  activeOpacity={0.8}
                  onPress={() => enterAsGuestOwner('Home')}
                >
                  <View style={[styles.featureIconBox, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="clipboard-outline" size={20} color="#4F46E5" />
                  </View>
                  <Text style={styles.featureCardTitle}>Vehicle assessments</Text>
                  <Text style={styles.featureCardDesc}>
                    Digital inspection reports with photos and condition scores.
                  </Text>
                </TouchableOpacity>

                {/* 2. Service appointments */}
                <TouchableOpacity
                  style={styles.featureGridCard}
                  activeOpacity={0.8}
                  onPress={() => enterAsGuestOwner('Appointments')}
                >
                  <View style={[styles.featureIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="calendar-outline" size={20} color="#D97706" />
                  </View>
                  <Text style={styles.featureCardTitle}>Service appointments</Text>
                  <Text style={styles.featureCardDesc}>
                    Book, reschedule, and track service slots in real time.
                  </Text>
                </TouchableOpacity>

                {/* 3. Roadside assistance */}
                <TouchableOpacity
                  style={styles.featureGridCard}
                  activeOpacity={0.8}
                  onPress={() => enterAsGuestOwner('Roadside')}
                >
                  <View style={[styles.featureIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="star-outline" size={20} color="#16A34A" />
                  </View>
                  <Text style={styles.featureCardTitle}>Roadside assistance</Text>
                  <Text style={styles.featureCardDesc}>
                    One-tap help for breakdowns, towing, and emergencies.
                  </Text>
                </TouchableOpacity>

                {/* 4. Workshop operations */}
                <TouchableOpacity
                  style={styles.featureGridCard}
                  activeOpacity={0.8}
                  onPress={() => enterAsGuestServiceCenter('Home')}
                >
                  <View style={[styles.featureIconBox, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="briefcase-outline" size={20} color="#9333EA" />
                  </View>
                  <Text style={styles.featureCardTitle}>Workshop operations</Text>
                  <Text style={styles.featureCardDesc}>
                    Manage bays, technicians, and job queues in one board.
                  </Text>
                </TouchableOpacity>

                {/* 5. Maintenance history */}
                <TouchableOpacity
                  style={styles.featureGridCard}
                  activeOpacity={0.8}
                  onPress={() => enterAsGuestOwner('My Vehicles')}
                >
                  <View style={[styles.featureIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="receipt-outline" size={20} color="#DC2626" />
                  </View>
                  <Text style={styles.featureCardTitle}>Maintenance history</Text>
                  <Text style={styles.featureCardDesc}>
                    A full timeline of every service, part, and invoice.
                  </Text>
                </TouchableOpacity>

                {/* 6. Digital garage */}
                <TouchableOpacity
                  style={styles.featureGridCard}
                  activeOpacity={0.8}
                  onPress={() => enterAsGuestOwner('My Vehicles')}
                >
                  <View style={[styles.featureIconBox, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="heart-outline" size={20} color="#0284C7" />
                  </View>
                  <Text style={styles.featureCardTitle}>Digital garage</Text>
                  <Text style={styles.featureCardDesc}>
                    Store registration, insurance, and warranty documents.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Info Tip Banner */}
            <View style={styles.bottomInfoBanner}>
              <Ionicons name="time-outline" size={20} color="#1D4ED8" style={styles.infoBannerIcon} />
              <Text style={styles.bottomInfoText}>
                <Text style={styles.bottomInfoBold}>New here?</Text> Pick a path above — owners and service centers each get a dashboard built for how they work.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      )}

      {/* DEDICATED VEHICLE OWNER LANDING PAGE */}
      {currentScreen === 'owner_landing' && (
        <VehicleOwnerLandingScreen
          onBack={() => setCurrentScreen('onboarding')}
          onContinueAsGuest={() => enterAsGuestOwner('Home')}
          onLogin={() => setCurrentScreen('login')}
          onRegister={() => {
            setAuthRole('owner');
            setCurrentScreen('signup');
          }}
        />
      )}

      {/* DEDICATED SERVICE CENTER LANDING PAGE */}
      {currentScreen === 'service_center_landing' && (
        <ServiceCenterLandingScreen
          onBack={() => setCurrentScreen('onboarding')}
          onContinueAsGuest={() => enterAsGuestServiceCenter('Home')}
          onLogin={() => setCurrentScreen('login')}
          onRegister={() => {
            setAuthRole('service_center');
            setCurrentScreen('signup');
          }}
        />
      )}

      {/* STANDALONE AUTH SCREEN (LOGIN / SIGNUP / FORGOT PASSWORD) */}
      {(currentScreen === 'login' || currentScreen === 'signup' || currentScreen === 'forgot_password') && (
        <AuthScreen
          initialScreen={currentScreen}
          initialRole={authRole}
          onSuccessAuth={(authUser) => {
            setUser(authUser);
            setActiveTab('Home');
            setCurrentScreen('dashboard');
          }}
          onPendingApproval={() => setCurrentScreen('pending_approval')}
          onBackToLanding={() => setCurrentScreen('onboarding')}
        />
      )}

      {/* PENDING APPROVAL SCREEN */}
      {currentScreen === 'pending_approval' && (
        <PendingApprovalScreen onBackToLogin={() => setCurrentScreen('login')} />
      )}

      {/* DASHBOARDS WRAPPER */}
      {currentScreen === 'dashboard' && user && (
        <View style={styles.dashboardContainer}>
          {/* Main Active Page View */}
          <View style={styles.pageContent}>
            {renderDashboardScreen()}
          </View>
          
          {/* Render Tab Bar based on User Role */}
          {user.role === 'owner' && renderOwnerNavigator()}
          {user.role === 'service_center' && renderServiceCenterNavigator()}
          {user.role === 'admin' && renderAdminNavigator()}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center'
  },
  loaderContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  authCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 40
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 10
  },
  logoIcon: {
    backgroundColor: THEME.buttonBg,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoIconText: {
    fontSize: 24
  },
  logoText: {
    color: THEME.text,
    fontSize: 24,
    fontWeight: 'bold'
  },
  authTitle: {
    color: THEME.text,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8
  },
  authSubtitle: {
    color: THEME.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.buttonBg,
    borderRadius: 8,
    padding: 4,
    marginBottom: 20
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  toggleBtnText: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '600'
  },
  toggleBtnTextActive: {
    color: '#1E1E1E'
  },
  label: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#1E1E1E',
    fontSize: 14,
    borderWidth: 0
  },
  subLabelText: {
    color: THEME.textSecondary,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8
  },
  forgotBtnText: {
    color: THEME.accent,
    fontSize: 12,
    fontWeight: '600'
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: THEME.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },
  switchAuthContainer: {
    marginTop: 16,
    alignItems: 'center'
  },
  switchAuthText: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: '600'
  },
  errorText: {
    color: THEME.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12
  },
  // Dashboard Wrapper Styles
  dashboardContainer: {
    flex: 1
  },
  pageContent: {
    flex: 1
  },
  navBar: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: Platform.OS === 'ios' ? 12 : 4,
    shadowColor: '#0046AD',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  navIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  navIconCircleActive: {
    backgroundColor: '#0046AD',
    shadowColor: '#0046AD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  navTabText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2
  },
  navTabTextActive: {
    color: '#0046AD',
    fontWeight: '700'
  },
  // Sub-views layouts
  paddedContent: {
    padding: 16,
    backgroundColor: THEME.background
  },
  viewHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 16
  },
  mutedText: {
    fontSize: 13,
    color: THEME.textSecondary
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  profileLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 12
  },
  profileVal: {
    fontWeight: '400',
    color: '#6B7280'
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold'
  },
  editProfileBtn: {
    backgroundColor: '#EEF2F6',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16
  },
  editProfileBtnText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: 'bold'
  },
  // Vehicle Tab specific styles
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  addVehBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  addVehBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  emptyCardText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8
  },
  emptyCardSubText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center'
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  vehHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
    marginBottom: 12
  },
  vehTitle: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: 'bold'
  },
  vehSub: {
    color: THEME.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  vehRegNum: {
    color: THEME.accent,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4
  },
  vehDeleteBtn: {
    padding: 4
  },
  vehDeleteIcon: {
    fontSize: 18
  },
  docsSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 8
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  docIcon: {
    fontSize: 20
  },
  docTitle: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600'
  },
  docStatusText: {
    fontSize: 11,
    marginTop: 2
  },
  statusUploaded: {
    color: THEME.success,
    fontWeight: '600'
  },
  statusMissing: {
    color: THEME.error,
    fontWeight: '600'
  },
  docUploadBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.accent
  },
  docUploadText: {
    color: THEME.accent,
    fontSize: 11,
    fontWeight: 'bold'
  },
  docDeleteBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  docActionText: {
    color: THEME.error,
    fontSize: 11,
    fontWeight: '600'
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20
  },
  backArrow: {
    color: THEME.accent,
    fontSize: 24,
    fontWeight: 'bold'
  },
  formHeaderTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: 'bold'
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  typeSelectorBtn: {
    minWidth: '30%',
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  typeSelectorBtnActive: {
    backgroundColor: THEME.selectedBg,
    borderWidth: 1,
    borderColor: THEME.accent
  },
  typeSelectorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.text
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4
  },
  fuelSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  fuelSelectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minWidth: '30%',
    alignItems: 'center'
  },
  fuelSelectorBtnActive: {
    borderColor: THEME.accent,
    backgroundColor: THEME.selectedBg
  },
  fuelSelectorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1A1A'
  },
  roadsideBigBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40
  },
  roadsideBigBtnText: {
    color: '#B91C1C',
    fontSize: 18,
    fontWeight: 'bold'
  },
  workspaceSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    maxWidth: 400,
    marginTop: 20,
    marginBottom: -20,
    zIndex: 10
  },
  workspaceTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6
  },
  workspaceTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  workspaceTabIcon: {
    fontSize: 16
  },
  workspaceTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280'
  },
  workspaceTabTextActive: {
    color: '#1A1A1A'
  },
  landingInfoCard: {
    backgroundColor: '#F9FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  landingInfoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6
  },
  landingInfoText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16
  },
  // Dev credentials hint card
  devHintCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  devHintTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8
  },
  devHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap'
  },
  devHintRole: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E40AF',
    minWidth: 55
  },
  devHintFill: {
    fontSize: 10,
    color: '#1D4ED8',
    flex: 1,
    flexWrap: 'wrap'
  },
  devHintTap: {
    fontSize: 10,
    color: '#93C5FD',
    fontStyle: 'italic'
  },
  // Password field with show/hide toggle
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    borderRadius: 8,
    overflow: 'hidden'
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    color: '#1E1E1E',
    fontSize: 14
  },
  eyeBtn: {
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  eyeBtnText: {
    fontSize: 16
  },
  // Splash & Onboarding Styles

  splashContainer: {
    flex: 1,
    backgroundColor: '#0046AD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  splashContent: {
    alignItems: 'center'
  },
  splashLogoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontStyle: 'italic',
    letterSpacing: 1
  },
  splashTagline: {
    fontSize: 15,
    color: '#93C5FD',
    marginTop: 10,
    fontWeight: '500',
    letterSpacing: 1
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    justifyContent: 'space-between'
  },
  onboardingHeader: {
    alignItems: 'center',
    paddingTop: 20
  },
  onboardingBrandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0046AD',
    fontStyle: 'italic'
  },
  onboardingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  illustrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  illustrationBlob: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  illustrationEmoji: {
    fontSize: 48
  },
  illustrationSubEmoji: {
    fontSize: 24,
    marginTop: 12
  },
  textWrap: {
    alignItems: 'center',
    marginBottom: 24
  },
  onboardingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12
  },
  onboardingSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0'
  },
  activeDot: {
    width: 20,
    backgroundColor: '#0046AD'
  },
  onboardingFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24
  },
  onboardingPrimaryBtn: {
    backgroundColor: '#0046AD',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  onboardingPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },
  onboardingSkipBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  onboardingSkipBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: 'bold'
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 2
  },
  passwordChecklistContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  passwordChecklistTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6
  },
  passwordChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  passwordChecklistIcon: {
    fontSize: 12,
    marginRight: 6,
    width: 16,
    textAlign: 'center'
  },
  metIcon: {
    color: '#10B981',
    fontWeight: 'bold'
  },
  unmetIcon: {
    color: '#94A3B8'
  },
  passwordChecklistText: {
    fontSize: 12
  },
  metText: {
    color: '#10B981',
    fontWeight: '500'
  },
  unmetText: {
    color: '#64748B'
  },
  devNoticeContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  devNoticeText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  forgotSuccessCard: {
    alignItems: 'center',
    paddingVertical: 16
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  validBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: 'bold'
  },
  inputValid: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: '#F0FDF4'
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    opacity: 0.7
  },
  disabledButtonText: {
    color: '#64748B'
  },
  logoutSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 8
  },
  logoutSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4
  },
  logoutSectionSubtext: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16
  },
  profileHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 4
  },
  profileHeaderTextGroup: {
    flex: 1,
    marginRight: 12
  },
  profileHeaderMainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2
  },
  profileHeaderSubTitle: {
    fontSize: 13,
    color: '#64748B'
  },
  avatarCircleContainer: {
    position: 'relative'
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarInitialsText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E40AF'
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0046AD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  profileCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  profileCardHeaderIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A'
  },
  profileCardSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  profileRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  profileRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  profileRowLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500'
  },
  profileRowVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  roleBadgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  roleBadgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0046AD'
  },
  editProfileBtnNew: {
    marginTop: 20,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0046AD',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  editProfileBtnTextNew: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0046AD'
  },
  logoutBtnNew: {
    marginTop: 12,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  logoutBtnTextNew: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626'
  },
  // Redesigned Landing Page Styles
  landingContainer: {
    flex: 1,
    backgroundColor: '#F4F7FC'
  },
  landingScrollContent: {
    padding: 16,
    paddingBottom: 32,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
  },
  heroDarkCard: {
    backgroundColor: '#0F2C59',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  brandIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  brandBadgeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3
  },
  loginPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)'
  },
  loginPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  welcomeTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1.2,
    marginBottom: 8
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 10
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 19
  },
  rolesSection: {
    gap: 12,
    marginBottom: 24
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  roleIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  roleTextContainer: {
    flex: 1,
    marginRight: 8
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3
  },
  roleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  },
  featuresSection: {
    marginBottom: 16
  },
  featuresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A'
  },
  featuresCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  featureGridCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 140
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  featureCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    lineHeight: 18
  },
  featureCardDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15
  },
  bottomInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 8
  },
  infoBannerIcon: {
    marginRight: 10,
    marginTop: 1
  },
  bottomInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18
  },
  bottomInfoBold: {
    fontWeight: '800',
    color: '#1E3A8A'
  }
});

