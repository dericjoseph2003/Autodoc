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
import OwnerServiceCentersScreen from './owner/OwnerServiceCentersScreen';
import ServiceCenterHomeScreen from './serviceCenter/ServiceCenterHomeScreen';
import ServiceCenterAppointmentsScreen from './serviceCenter/ServiceCenterAppointmentsScreen';
import ServiceCenterInventoryScreen from './serviceCenter/ServiceCenterInventoryScreen';
import ServiceCenterRoadsideScreen from './serviceCenter/ServiceCenterRoadsideScreen';
import AdminHomeScreen from './admin/AdminHomeScreen';
import PendingApprovalScreen from '../../screens/PendingApprovalScreen';
import ProfileEditScreen from '../../screens/ProfileEditScreen';
import VehicleProfileScreen from './owner/VehicleProfileScreen';
import BackButton from '../components/ui/BackButton';
import AuthScreen from '../components/AuthScreen';
import WelcomeScreen from '../components/WelcomeScreen';

// Consistent Premium Light-Mode Design System
const THEME = {
  background: '#F4F6F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  primaryDark: '#003380',
  accent: '#F5A524',
  success: '#10B981',
  error: '#EF4444'
};

export default function AppIndex() {
  // Global States
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<
    'splash' | 'welcome' | 'role_selection' | 'login' | 'signup' | 'forgot_password' | 'dashboard' | 'pending_approval'
  >('splash');
  const [authRole, setAuthRole] = useState<'owner' | 'service_center'>('owner');

  // Navigation tabs state per role
  const [activeTab, setActiveTab] = useState<
    'Home' | 'My Vehicles' | 'Service Centers' | 'Roadside' | 'Profile' | 'ProfileEdit' | 'Appointments' | 'Spare Parts' | 'Roadside Requests' | 'Users' | 'Reports'
  >('Home');

  // Vehicle Form & Documents Data
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
        setCurrentScreen(prev =>
          (prev === 'dashboard' || prev === 'pending_approval' || prev === 'splash') ? 'welcome' : prev
        );
      }
    });
  }, []);

  // Auto-restore user session on startup/reload
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
          setCurrentScreen(prev => prev === 'splash' ? 'welcome' : prev);
        }
      } catch (err: any) {
        setToken(null);
        setUser(null);
        setCurrentScreen(prev => prev === 'splash' ? 'welcome' : prev);
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
        setCurrentScreen(prev => prev === 'splash' ? 'welcome' : prev);
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
    setCurrentScreen('welcome');
  };

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
        return (
          <VehicleProfileScreen
            vehicles={vehicles}
            documents={documents}
            onAddVehicle={() => alertMsg('Add Vehicle', 'Vehicle registration modal')}
            onDeleteVehicle={handleDeleteVehicle}
            onUploadDoc={(vehicleId, docType) => triggerDocUpload(vehicleId, docType as any)}
            onDeleteDoc={handleDeleteDoc}
            onRefresh={loadVehiclesData}
            onBack={() => setActiveTab('Home')}
          />
        );
      }
      if (activeTab === 'Service Centers') {
        return <OwnerServiceCentersScreen onBack={() => setActiveTab('Home')} />;
      }
      if (activeTab === 'Roadside') {
        return (
          <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true}>
            <BackButton variant="card" label="Back to Home" onPress={() => setActiveTab('Home')} style={{ marginBottom: 12 }} />
            <Text style={styles.viewHeader}>Roadside Emergency Help</Text>
            <TouchableOpacity style={styles.roadsideBigBtn} onPress={() => alert('🚨 Emergency roadside rescue dispatched!')}>
              <Text style={styles.roadsideBigBtnText}>Tap for Roadside Assistance 🚨</Text>
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
        return <ServiceCenterAppointmentsScreen onBack={() => setActiveTab('Home')} />;
      }
      if (activeTab === 'Spare Parts') {
        return <ServiceCenterInventoryScreen onBack={() => setActiveTab('Home')} />;
      }
      if (activeTab === 'Roadside Requests') {
        return <ServiceCenterRoadsideScreen onBack={() => setActiveTab('Home')} />;
      }
    }

    if (role === 'admin') {
      if (activeTab === 'Home') {
        return <AdminHomeScreen user={user} onNavigateToTab={(t) => setActiveTab(t as any)} />;
      }
      if (activeTab === 'Users') {
        return (
          <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true}>
            <BackButton variant="card" label="Back to Home" onPress={() => setActiveTab('Home')} style={{ marginBottom: 12 }} />
            <Text style={styles.viewHeader}>Registered Users</Text>
            <Text style={styles.mutedText}>Audit registered drivers and workshop managers.</Text>
          </ScrollView>
        );
      }
      if (activeTab === 'Service Centers') {
        return <AdminHomeScreen user={user} onNavigateToTab={(t) => setActiveTab(t as any)} />;
      }
      if (activeTab === 'Reports') {
        return (
          <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true}>
            <BackButton variant="card" label="Back to Home" onPress={() => setActiveTab('Home')} style={{ marginBottom: 12 }} />
            <Text style={styles.viewHeader}>System Reports & Metrics</Text>
            <Text style={styles.mutedText}>Platform analytics, user signups, and service logs.</Text>
          </ScrollView>
        );
      }
    }

    // Common Profile Tab
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
        <ScrollView contentContainerStyle={styles.paddedContent} showsVerticalScrollIndicator={true}>
          {/* Top Header Banner */}
          <View style={styles.profileHeaderBanner}>
            <View style={styles.profileHeaderTextGroup}>
              <Text style={styles.profileHeaderMainTitle}>My Profile</Text>
              <Text style={styles.profileHeaderSubTitle}>Manage your account and settings</Text>
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

          {/* Account Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileCardHeaderRow}>
              <View style={styles.profileCardHeaderIconBg}>
                <Ionicons name="person-outline" size={22} color="#0046AD" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileCardTitle}>Account Information</Text>
                <Text style={styles.profileCardSubTitle}>Your registered AutoDoc credentials</Text>
              </View>
            </View>

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
                <Text style={styles.roleBadgePillText}>
                  {user.role === 'service_center' ? 'SERVICE CENTER' : (user.role || 'USER').toUpperCase()}
                </Text>
              </View>
            </View>

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

    return null;
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

      {/* 1. SPLASH SCREEN */}
      {currentScreen === 'splash' && (
        <View style={styles.splashContainer}>
          <View style={styles.splashContent}>
            <View style={styles.splashIconBox}>
              <Ionicons name="car-sport" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.splashLogoText}>AutoDoc</Text>
            <Text style={styles.splashTagline}>We've Got Your Back</Text>
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 32 }} />
          </View>
        </View>
      )}

      {/* 2. PROFESSIONAL FIRST WELCOME SCREEN */}
      {currentScreen === 'welcome' && (
        <WelcomeScreen
          onGetStarted={() => setCurrentScreen('role_selection')}
          onLogin={() => setCurrentScreen('login')}
        />
      )}

      {/* 3. ROLE SELECTION & EXPLORATION SCREEN */}
      {currentScreen === 'role_selection' && (
        <SafeAreaView style={styles.landingContainer}>
          <ScrollView
            contentContainerStyle={styles.landingScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Navigation Row */}
            <View style={styles.topNavRowWelcome}>
              <BackButton
                variant="ghost"
                label="Back"
                onPress={() => setCurrentScreen('welcome')}
              />
              <TouchableOpacity
                style={styles.loginPillBtnSmall}
                activeOpacity={0.8}
                onPress={() => setCurrentScreen('login')}
              >
                <Text style={styles.loginPillTextSmall}>Sign In</Text>
                <Ionicons name="chevron-forward" size={13} color="#0046AD" />
              </TouchableOpacity>
            </View>

            {/* Hero Card */}
            <View style={styles.heroDarkCard}>
              <Text style={styles.welcomeTag}>SELECT YOUR ACCOUNT TYPE</Text>
              <Text style={styles.heroTitle}>How will you use AutoDoc?</Text>
              <Text style={styles.heroSubtitle}>
                Choose your profile to proceed with tailored account registration and smart tools.
              </Text>
            </View>

            {/* Direct Role Registration Cards */}
            <View style={styles.rolesSection}>
              {/* Option 1: Vehicle Owner -> Directly opens Owner Registration */}
              <TouchableOpacity
                style={styles.roleCard}
                activeOpacity={0.85}
                onPress={() => {
                  setAuthRole('owner');
                  setCurrentScreen('signup');
                }}
              >
                <View style={[styles.roleIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="car-sport" size={24} color="#0284C7" />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>I'm a Vehicle Owner</Text>
                  <Text style={styles.roleSubtitle}>
                    Book services, manage digital garage, track repairs, and get roadside help.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#0046AD" />
              </TouchableOpacity>

              {/* Option 2: Service Center -> Directly opens Service Center Registration */}
              <TouchableOpacity
                style={styles.roleCard}
                activeOpacity={0.85}
                onPress={() => {
                  setAuthRole('service_center');
                  setCurrentScreen('signup');
                }}
              >
                <View style={[styles.roleIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="construct" size={22} color="#16A34A" />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>I Run a Service Center</Text>
                  <Text style={styles.roleSubtitle}>
                    Register your garage, accept online bookings, and manage service bays.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#16A34A" />
              </TouchableOpacity>
            </View>

            {/* Features Overview */}
            <View style={styles.featuresSection}>
              <View style={styles.featuresHeader}>
                <Text style={styles.featuresTitle}>Platform Capabilities</Text>
                <Text style={styles.featuresCountBadge}>6 modules</Text>
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
                  <Text style={styles.featureCardTitle}>Vehicle Assessments</Text>
                  <Text style={styles.featureCardDesc}>
                    Digital inspection logs and condition scores.
                  </Text>
                </TouchableOpacity>

                {/* 2. Service appointments */}
                <TouchableOpacity
                  style={styles.featureGridCard}
                  activeOpacity={0.8}
                  onPress={() => enterAsGuestOwner('Home')}
                >
                  <View style={[styles.featureIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="calendar-outline" size={20} color="#D97706" />
                  </View>
                  <Text style={styles.featureCardTitle}>Service Bookings</Text>
                  <Text style={styles.featureCardDesc}>
                    Book, reschedule, and track maintenance.
                  </Text>
                </TouchableOpacity>

                {/* 3. Roadside assistance */}
                <TouchableOpacity
                  style={styles.featureGridCard}
                  activeOpacity={0.8}
                  onPress={() => enterAsGuestOwner('Roadside')}
                >
                  <View style={[styles.featureIconBox, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="warning-outline" size={20} color="#16A34A" />
                  </View>
                  <Text style={styles.featureCardTitle}>Roadside Rescue</Text>
                  <Text style={styles.featureCardDesc}>
                    One-tap help for breakdowns and towing.
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
                  <Text style={styles.featureCardTitle}>Workshop Operations</Text>
                  <Text style={styles.featureCardDesc}>
                    Manage bays, technicians, and queues.
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
                  <Text style={styles.featureCardTitle}>Maintenance History</Text>
                  <Text style={styles.featureCardDesc}>
                    Service logs, invoices, and part logs.
                  </Text>
                </TouchableOpacity>

                {/* 6. Digital garage */}
                <TouchableOpacity
                  style={styles.featureGridCard}
                  activeOpacity={0.8}
                  onPress={() => enterAsGuestOwner('My Vehicles')}
                >
                  <View style={[styles.featureIconBox, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="folder-outline" size={20} color="#0284C7" />
                  </View>
                  <Text style={styles.featureCardTitle}>Digital Garage</Text>
                  <Text style={styles.featureCardDesc}>
                    Store RC, insurance, and PUC certificates.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      )}

      {/* 4. STANDALONE AUTH SCREEN (LOGIN / SIGNUP / FORGOT PASSWORD) */}
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
          onBackToLanding={() => setCurrentScreen('role_selection')}
        />
      )}

      {/* 5. PENDING APPROVAL SCREEN */}
      {currentScreen === 'pending_approval' && (
        <PendingApprovalScreen onBackToLogin={() => setCurrentScreen('login')} />
      )}

      {/* 6. DASHBOARD WRAPPER */}
      {currentScreen === 'dashboard' && user && (
        <View style={styles.dashboardContainer}>
          <View style={styles.pageContent}>
            {renderDashboardScreen()}
          </View>

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
  splashContainer: {
    flex: 1,
    backgroundColor: '#0046AD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  splashContent: {
    alignItems: 'center'
  },
  splashIconBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  splashLogoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  splashTagline: {
    fontSize: 14,
    color: '#93C5FD',
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: 1
  },
  landingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  landingScrollContent: {
    padding: 16,
    paddingBottom: 32,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
  },
  topNavRowWelcome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  loginPillBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF'
  },
  loginPillTextSmall: {
    color: '#0046AD',
    fontSize: 12,
    fontWeight: '700'
  },
  heroDarkCard: {
    backgroundColor: '#0F2C59',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6
  },
  welcomeTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1,
    marginBottom: 6
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18
  },
  rolesSection: {
    gap: 12,
    marginBottom: 20
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    fontSize: 15,
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
    marginBottom: 12,
    paddingHorizontal: 2
  },
  featuresTitle: {
    fontSize: 17,
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
    gap: 10
  },
  featureGridCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 110
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  featureCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3
  },
  featureCardDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15
  },
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
  paddedContent: {
    padding: 16,
    backgroundColor: THEME.background
  },
  viewHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 8
  },
  mutedText: {
    fontSize: 13,
    color: THEME.textSecondary
  },
  roadsideBigBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30
  },
  roadsideBigBtnText: {
    color: '#B91C1C',
    fontSize: 17,
    fontWeight: '800'
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileCardTitle: {
    fontSize: 16,
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
  }
});
