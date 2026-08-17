import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  TextInput,
  Platform,
  Alert,
  RefreshControl
} from 'react-native';
import { adminApi } from '../../api/adminApi';
import { api } from '../../services/api';
import ServiceCenterDetailScreen from '../../../screens/admin/ServiceCenterDetailScreen';
import PendingServiceCentersScreen from '../../../screens/admin/PendingServiceCentersScreen';

const THEME = {
  background: '#F4F6F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',         // Deep Cobalt Blue from Autodoc
  success: '#10B981',
  warning: '#F5A524',
  error: '#EF4444',
  accentLight: '#FEF3C7',
  successLight: '#D1FAE5',
  errorLight: '#FEE2E2',
  grayLight: '#F3F4F6',
  grayText: '#374151',
  blueLight: '#E0F2FE',
  blueText: '#0369A1'
};

interface AdminHomeScreenProps {
  user: any;
  onNavigateToTab: (tabName: string) => void;
}

export default function AdminHomeScreen({ user, onNavigateToTab }: AdminHomeScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  // Active view inside Admin panel
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'users' | 'providers' | 'analytics' | 'compliance' | 'content' | 'notifications'>('dashboard');

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Real live stats state
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingSummary, setPendingSummary] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);

  // Detailed screen viewing state
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [showPendingScreen, setShowPendingScreen] = useState<boolean>(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Notification input form state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifRecipient, setNotifRecipient] = useState('all_users');
  const [notifChannel, setNotifChannel] = useState('push');

  // Load dashboard stats, recent users, and pending summary in parallel
  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const [statsRes, usersRes, pendingRes, allUsersRes, allCentersRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentUsers(),
        adminApi.getPendingServiceCentersSummary(),
        api.listAllUsers(),
        api.listServiceCenters()
      ]);

      if (statsRes.success && usersRes.success && pendingRes.success && allUsersRes.success) {
        setStats(statsRes.stats);
        setRecentUsers(usersRes.users || []);
        setPendingSummary(pendingRes.serviceCenters || []);
        setUsers(allUsersRes.users || []);
        setServiceCenters(allCentersRes.serviceCenters || []);
      } else {
        throw new Error('Backend failed to return dashboard stats');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to connect to the administration server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setLoading(true);
      await adminApi.updateApprovalStatus(id, 'approved');
      Alert.alert('Success', 'Service Center approved successfully!');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', `Approval failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      setLoading(true);
      await adminApi.updateApprovalStatus(id, 'rejected', 'Suspended by admin');
      Alert.alert('Success', 'Service Center suspended successfully!');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', `Suspension failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      Alert.alert('Validation Error', 'Please fill in Title and Message fields.');
      return;
    }
    setLoading(true);
    try {
      // Mock notification alert broadcast endpoint or similar logic
      await new Promise(resolve => setTimeout(resolve, 800));
      Alert.alert('Success', 'Broadcast notification dispatched successfully!');
      setNotifTitle('');
      setNotifMessage('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Notification broadcast failed');
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'providers', label: 'Providers', icon: '🛠️' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'compliance', label: 'Compliance', icon: '🛡️' },
    { id: 'content', label: 'Content', icon: '📁' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  // Render Sidebar menu (Desktop)
  const renderSidebar = () => {
    return (
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarLogo}>Autodoc</Text>
        </View>

        <View style={styles.sidebarMenu}>
          {sidebarItems.map(item => {
            const isActive = activeSubTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                onPress={() => setActiveSubTab(item.id as any)}
              >
                <Text style={[styles.sidebarIcon, isActive && styles.sidebarIconActive]}>{item.icon}</Text>
                <Text style={[styles.sidebarLabel, isActive && styles.sidebarLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sidebarFooter}>
          <View style={styles.adminAvatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.adminMeta}>
            <Text style={styles.adminName}>Admin User</Text>
            <Text style={styles.adminEmail} numberOfLines={1}>{user?.email || 'admin@gmail.com'}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Mobile Horizontal Tabs bar
  const renderMobileTabs = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileTabsScroll}>
        <View style={styles.mobileTabsContainer}>
          {sidebarItems.map(item => {
            const isActive = activeSubTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.mobileTabItem, isActive && styles.mobileTabItemActive]}
                onPress={() => setActiveSubTab(item.id as any)}
              >
                <Text style={styles.mobileTabLabel}>{item.icon} {item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  // Tab View: Dashboard Overview
  const renderDashboardTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* Statistics Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle}>Total Users</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: THEME.blueLight }]}><Text style={styles.kpiIcon}>👥</Text></View>
            </View>
            <Text style={styles.kpiNumber}>{stats?.totalUsers ?? 0}</Text>
            <Text style={[styles.kpiTrend, { color: THEME.success }]}>↑ {stats?.newUsersThisWeek ?? 0} new this week</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle}>Active Providers</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: THEME.successLight }]}><Text style={styles.kpiIcon}>🛠️</Text></View>
            </View>
            <Text style={styles.kpiNumber}>{stats?.totalServiceCenters ?? 0}</Text>
            <Text style={[styles.kpiTrend, { color: THEME.warning }]}>{stats?.pendingApprovals ?? 0} pending review</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle}>Active Roadside</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: THEME.errorLight }]}><Text style={styles.kpiIcon}>🚨</Text></View>
            </View>
            <Text style={styles.kpiNumber}>{stats?.activeRoadsideRequests ?? 0}</Text>
            <Text style={[styles.kpiTrend, { color: THEME.error }]}>Emergency requests</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle}>Registered Vehicles</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: THEME.blueLight }]}><Text style={styles.kpiIcon}>🚗</Text></View>
            </View>
            <Text style={styles.kpiNumber}>{stats?.totalVehiclesRegistered ?? 0}</Text>
            <Text style={styles.kpiTrend}>{stats?.appointmentsToday ?? 0} appointments today</Text>
          </View>
        </View>

        {/* Charts Row */}
        <View style={styles.chartsGrid}>
          {/* Weekly Bookings Bar Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Weekly Bookings</Text>
            <View style={styles.barChartContainer}>
              <View style={styles.barChartAxis}>
                <Text style={styles.axisLabel}>100</Text>
                <Text style={styles.axisLabel}>75</Text>
                <Text style={styles.axisLabel}>50</Text>
                <Text style={styles.axisLabel}>25</Text>
                <Text style={styles.axisLabel}>0</Text>
              </View>
              <View style={styles.barChartBars}>
                {[45, 50, 65, 60, 75, 90, 70].map((val, idx) => (
                  <View key={idx} style={styles.barColumn}>
                    <View style={[styles.barFill, { height: `${val}%` }]} />
                    <Text style={styles.barLabel}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* User Growth Trend Line Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>User Growth Trend</Text>
            <View style={styles.lineChartContainer}>
              <View style={styles.lineChartGrid}>
                {[2600, 1950, 1300, 650, 0].map((lbl, idx) => (
                  <View key={idx} style={styles.gridLineRow}>
                    <Text style={styles.gridLineLabel}>{lbl}</Text>
                    <View style={styles.gridLine} />
                  </View>
                ))}
              </View>
              <View style={styles.lineChartPointsContainer}>
                <View style={styles.connectingLine} />
                {[
                  { month: 'Jan', top: 85 },
                  { month: 'Feb', top: 75 },
                  { month: 'Mar', top: 68 },
                  { month: 'Apr', top: 60 },
                  { month: 'May', top: 48 },
                  { month: 'Jun', top: 35 }
                ].map((pt, idx) => (
                  <View key={idx} style={[styles.linePointWrapper, { left: `${(idx * 16) + 12}%`, top: `${pt.top}%` }]}>
                    <View style={styles.linePoint} />
                    <Text style={styles.pointLabel}>{pt.month}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Real Live Playlists / Tables Row */}
        <View style={styles.chartsGrid}>
          {/* Pending Service Centers Summary */}
          <View style={styles.chartCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: THEME.text }}>Pending Service Center Owner Approvals</Text>
              <TouchableOpacity onPress={() => setShowPendingScreen(true)}>
                <Text style={{ fontSize: 12, color: THEME.primary, fontWeight: 'bold' }}>View All →</Text>
              </TouchableOpacity>
            </View>
            {pendingSummary.length === 0 ? (
              <Text style={styles.emptyTableText}>No pending Service Center Owner registrations to review</Text>
            ) : (
              pendingSummary.map(center => (
                <TouchableOpacity
                  key={center._id}
                  style={styles.centerListItem}
                  onPress={() => setSelectedCenterId(center._id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: THEME.text }}>{center.businessName}</Text>
                    <Text style={{ fontSize: 11, color: THEME.textSecondary }}>📍 {center.city} | Reg: {center.businessRegistrationNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: THEME.accentLight }]}>
                    <Text style={[styles.statusBadgeText, { color: THEME.warning }]}>PENDING</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Recent Users List */}
          <View style={styles.chartCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: THEME.text }}>Recent Registered Users</Text>
              <TouchableOpacity onPress={() => setActiveSubTab('users')}>
                <Text style={{ fontSize: 12, color: THEME.primary, fontWeight: 'bold' }}>View All →</Text>
              </TouchableOpacity>
            </View>
            {recentUsers.length === 0 ? (
              <Text style={styles.emptyTableText}>No recently registered users</Text>
            ) : (
              recentUsers.slice(0, 5).map(u => (
                <View key={u._id} style={styles.centerListItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: THEME.text }}>👤 {u.name}</Text>
                    <Text style={{ fontSize: 11, color: THEME.textSecondary }}>{u.email} | {u.phone}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    u.role === 'admin' && { backgroundColor: THEME.errorLight },
                    u.role === 'service_center' && { backgroundColor: THEME.blueLight },
                    u.role === 'owner' && { backgroundColor: THEME.grayLight }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      u.role === 'admin' && { color: THEME.error },
                      u.role === 'service_center' && { color: THEME.primary },
                      u.role === 'owner' && { color: THEME.textSecondary }
                    ]}>
                      {u.role.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    );
  };

  // Tab View: Users List
  const renderUsersTab = () => {
    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      try {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {
        return 'N/A';
      }
    };

    const formattedDbUsers = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone || 'N/A',
      cars: u.role === 'owner' ? 1 : 0,
      bookings: u.role === 'owner' ? 1 : 0,
      joinDate: formatDate(u.createdAt),
      status: u.role === 'admin' ? 'active' : (u.role === 'service_center' ? 'pending' : 'active')
    }));

    const filteredUsers = formattedDbUsers.filter(u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
    );

    return (
      <View style={styles.tabContent}>
        {/* User Management Title Block */}
        <View style={styles.tabHeaderRow}>
          <View>
            <Text style={styles.tabTitle}>User Management</Text>
            <Text style={styles.tabSubtitle}>Manage and monitor platform users</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={() => Alert.alert('Export data', 'Platform users list exported successfully.')}>
            <Text style={styles.exportBtnText}>📥 Export Data</Text>
          </TouchableOpacity>
        </View>

        {/* User Summary KPI Cards */}
        <View style={styles.userKpiGrid}>
          <View style={[styles.userKpiCard, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
            <Text style={styles.userKpiTitle}>Total Users</Text>
            <Text style={[styles.userKpiNumber, { color: '#1E40AF' }]}>{stats?.totalUsers ?? users.length}</Text>
          </View>
          <View style={[styles.userKpiCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
            <Text style={styles.userKpiTitle}>Active Users</Text>
            <Text style={[styles.userKpiNumber, { color: '#15803D' }]}>{stats?.totalOwners ?? users.filter(u => u.role === 'owner').length}</Text>
          </View>
          <View style={[styles.userKpiCard, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
            <Text style={styles.userKpiTitle}>Pending Approval</Text>
            <Text style={[styles.userKpiNumber, { color: '#B45309' }]}>{stats?.pendingApprovals ?? 0}</Text>
          </View>
          <View style={[styles.userKpiCard, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
            <Text style={styles.userKpiTitle}>Suspended</Text>
            <Text style={[styles.userKpiNumber, { color: '#B91C1C' }]}>0</Text>
          </View>
        </View>

        {/* Filters Row */}
        <View style={styles.filterRow}>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.filterSearchInput}
              placeholder="Search by name, email, or phone..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.dropdownsWrap}>
            <View style={styles.filterDropdown}>
              <Text style={styles.dropdownText}>All Status ▾</Text>
            </View>
            <View style={styles.filterDropdown}>
              <Text style={styles.dropdownText}>Most Recent ▾</Text>
            </View>
          </View>
        </View>

        {/* Users Table */}
        <View style={styles.tableCard}>
          <View style={styles.table}>
            <View style={[styles.tableHeader, styles.tableRow]}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>User</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Contact</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Cars</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Bookings</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Join Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'center' }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}></Text>
            </View>

            {filteredUsers.length === 0 ? (
              <Text style={styles.emptyTableText}>No platform users found matching query</Text>
            ) : (
              filteredUsers.map(u => (
                <View key={u._id} style={styles.tableRow}>
                  <View style={{ flex: 3 }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: THEME.text }}>{u.name}</Text>
                    <Text style={{ fontSize: 11, color: THEME.textSecondary, marginTop: 1 }}>{u.email}</Text>
                  </View>
                  <Text style={[styles.tableCell, { flex: 2.5 }]}>{u.phone}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'center' }]}>{u.cars}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'center' }]}>{u.bookings}</Text>
                  <Text style={[styles.tableCell, { flex: 2, color: THEME.textSecondary }]}>{u.joinDate}</Text>
                  <View style={{ flex: 2, alignItems: 'center' }}>
                    <View style={[
                      styles.statusBadge,
                      u.status === 'active' && { backgroundColor: THEME.successLight },
                      u.status === 'pending' && { backgroundColor: THEME.accentLight },
                      u.status === 'suspended' && { backgroundColor: THEME.errorLight }
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        u.status === 'active' && { color: THEME.success },
                        u.status === 'pending' && { color: THEME.warning },
                        u.status === 'suspended' && { color: THEME.error }
                      ]}>
                        {u.status === 'active' ? 'Active' : (u.status === 'pending' ? 'Pending' : 'Suspended')}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ flex: 0.5, fontSize: 16, color: '#94A3B8', textAlign: 'right' }}>⋮</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    );
  };

  // Tab View: Providers Approvals
  const renderProvidersTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.tableCard}>
          <Text style={styles.tableCardTitle}>Workshops & Service Providers</Text>
          <View style={styles.table}>
            <View style={[styles.tableHeader, styles.tableRow]}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Workshop Name</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Location</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'center' }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Actions</Text>
            </View>

            {serviceCenters.length === 0 ? (
              <Text style={styles.emptyTableText}>No workshops currently registered</Text>
            ) : (
              serviceCenters.map(sc => (
                <View key={sc._id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold' }]}>🛠️ {sc.businessName}</Text>
                  <Text style={[styles.tableCell, { flex: 3 }]}>📍 {sc.address || sc.businessAddress}</Text>
                  <View style={{ flex: 2, alignItems: 'center' }}>
                    <View style={[
                      styles.statusBadge,
                      sc.status === 'pending' && { backgroundColor: THEME.accentLight },
                      sc.status === 'approved' && { backgroundColor: THEME.successLight },
                      sc.status === 'deactivated' && { backgroundColor: THEME.errorLight }
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        sc.status === 'pending' && { color: THEME.warning },
                        sc.status === 'approved' && { color: THEME.success },
                        sc.status === 'deactivated' && { color: THEME.error }
                      ]}>
                        {sc.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                    {sc.status !== 'approved' && (
                      <TouchableOpacity style={[styles.smallActionBtn, { backgroundColor: THEME.primary }]} onPress={() => handleApprove(sc._id)}>
                        <Text style={styles.smallActionText}>Approve</Text>
                      </TouchableOpacity>
                    )}
                    {sc.status !== 'deactivated' && (
                      <TouchableOpacity style={[styles.smallActionBtn, { backgroundColor: THEME.error }]} onPress={() => handleDeactivate(sc._id)}>
                        <Text style={styles.smallActionText}>Suspend</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    );
  };

  // Tab View: Compliance
  const renderComplianceTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle}>PDPL Compliance</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: THEME.blueLight }]}><Text style={styles.kpiIcon}>🛡️</Text></View>
            </View>
            <Text style={styles.kpiNumber}>98.5%</Text>
            <Text style={[styles.kpiTrend, { color: THEME.success }]}>Compliant Status</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle}>Data Requests</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: THEME.accentLight }]}><Text style={styles.kpiIcon}>📂</Text></View>
            </View>
            <Text style={styles.kpiNumber}>3</Text>
            <Text style={[styles.kpiTrend, { color: THEME.warning }]}>Pending Audit</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle}>Security Events</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: THEME.errorLight }]}><Text style={styles.kpiIcon}>⚠️</Text></View>
            </View>
            <Text style={styles.kpiNumber}>12</Text>
            <Text style={[styles.kpiTrend, { color: THEME.error }]}>High Security Audits</Text>
          </View>
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiTitle}>Data Encryption</Text>
              <View style={[styles.kpiIconWrapper, { backgroundColor: THEME.successLight }]}><Text style={styles.kpiIcon}>🔒</Text></View>
            </View>
            <Text style={styles.kpiNumber}>100%</Text>
            <Text style={[styles.kpiTrend, { color: THEME.success }]}>Secure Socket Layer</Text>
          </View>
        </View>

        {/* Data Access & Deletion Table */}
        <View style={styles.tableCard}>
          <Text style={styles.tableCardTitle}>Data Access & Deletion Requests</Text>
          <View style={styles.table}>
            <View style={[styles.tableHeader, styles.tableRow]}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Request Type</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>User</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Request Date</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'center' }]}>Status</Text>
            </View>
            {[
              { type: 'Data Export', user: 'Ahmed Mohammed', date: 'Mar 8, 2026', status: 'Pending' },
              { type: 'Data Deletion', user: 'Fatima Ali', date: 'Mar 7, 2026', status: 'Completed' },
              { type: 'Data Access', user: 'Omar Hassan', date: 'Mar 6, 2026', status: 'In-progress' }
            ].map((reqItem, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{reqItem.type}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{reqItem.user}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{reqItem.date}</Text>
                <View style={{ flex: 2, alignItems: 'center' }}>
                  <View style={[
                    styles.statusBadge,
                    reqItem.status === 'Pending' && { backgroundColor: THEME.accentLight },
                    reqItem.status === 'Completed' && { backgroundColor: THEME.successLight },
                    reqItem.status === 'In-progress' && { backgroundColor: THEME.blueLight }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      reqItem.status === 'Pending' && { color: THEME.warning },
                      reqItem.status === 'Completed' && { color: THEME.success },
                      reqItem.status === 'In-progress' && { color: THEME.primary }
                    ]}>
                      {reqItem.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Tab View: Content
  const renderContentTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.tableCard}>
          <Text style={styles.tableCardTitle}>AutoDoc Service Categories</Text>
          <View style={styles.table}>
            <View style={[styles.tableHeader, styles.tableRow]}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Category Name</Text>
              <Text style={[styles.tableHeaderCell, { flex: 5 }]}>Description</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'center' }]}>Status</Text>
            </View>
            {[
              { name: 'Oil Change', desc: 'Regular engine oil flush and filter replacement.', status: 'Active' },
              { name: 'Tire Service', desc: 'Tire rotation, pressure balance, alignment, and patch.', status: 'Active' },
              { name: 'Brake Service', desc: 'Brake pads replacement, caliper audit, and oil flush.', status: 'Active' },
              { name: 'AC Repair', desc: 'Air conditioning gas topping, filter cleaning, and diagnostics.', status: 'Active' },
              { name: 'Engine Repair', desc: 'Engine tuning, spark plugs replacement, and assessor inspection.', status: 'Active' }
            ].map((cat, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{cat.name}</Text>
                <Text style={[styles.tableCell, { flex: 5 }]}>{cat.desc}</Text>
                <View style={{ flex: 2, alignItems: 'center' }}>
                  <View style={[styles.statusBadge, { backgroundColor: THEME.successLight }]}><Text style={[styles.statusBadgeText, { color: THEME.success }]}>{cat.status}</Text></View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Tab View: Notifications Broadcaster
  const renderNotificationsTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.broadcastCard}>
          <Text style={styles.broadcastTitle}>📣 Broadcast New Platform Alert</Text>
          <Text style={styles.broadcastSubtitle}>Push real-time messages and notifications to registered users and providers.</Text>
          
          <Text style={styles.inputLabel}>Notification Title</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Schedule Maintenance Reminder"
            placeholderTextColor="#888"
            value={notifTitle}
            onChangeText={setNotifTitle}
          />

          <Text style={styles.inputLabel}>Notification Message</Text>
          <TextInput
            style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Enter the broadcast message..."
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
            value={notifMessage}
            onChangeText={setNotifMessage}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Recipient Type</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleOption, notifRecipient === 'all_users' && styles.toggleOptionActive]}
                  onPress={() => setNotifRecipient('all_users')}
                >
                  <Text style={[styles.toggleOptionText, notifRecipient === 'all_users' && styles.toggleOptionTextActive]}>All Users</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, notifRecipient === 'service_centers' && styles.toggleOptionActive]}
                  onPress={() => setNotifRecipient('service_centers')}
                >
                  <Text style={[styles.toggleOptionText, notifRecipient === 'service_centers' && styles.toggleOptionTextActive]}>Providers Only</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.inputLabel}>Delivery Channel</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleOption, notifChannel === 'push' && styles.toggleOptionActive]}
                  onPress={() => setNotifChannel('push')}
                >
                  <Text style={[styles.toggleOptionText, notifChannel === 'push' && styles.toggleOptionTextActive]}>Push App</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleOption, notifChannel === 'sms' && styles.toggleOptionActive]}
                  onPress={() => setNotifChannel('sms')}
                >
                  <Text style={[styles.toggleOptionText, notifChannel === 'sms' && styles.toggleOptionTextActive]}>SMS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.sendButton} onPress={handleBroadcastNotification}>
            <Text style={styles.sendButtonText}>Send Notification</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActiveTabContent = () => {
    switch (activeSubTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'users':
        return renderUsersTab();
      case 'providers':
        return renderProvidersTab();
      case 'compliance':
        return renderComplianceTab();
      case 'content':
        return renderContentTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'analytics':
      default:
        return renderDashboardTab();
    }
  };

  // If viewing a detail page overlay
  if (selectedCenterId) {
    return (
      <ServiceCenterDetailScreen
        centerId={selectedCenterId}
        onBack={() => setSelectedCenterId(null)}
        onActionSuccess={() => {
          setSelectedCenterId(null);
          loadData();
        }}
      />
    );
  }

  // If viewing all pending list overlay
  if (showPendingScreen) {
    return (
      <PendingServiceCentersScreen
        onSelectCenter={(id: string) => setSelectedCenterId(id)}
        onBack={() => setShowPendingScreen(false)}
      />
    );
  }

  // Render error recovery screen
  if (error && !stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTextTitle}>Failed to Connect</Text>
        <Text style={styles.errorTextMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
          <Text style={styles.retryButtonText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      {/* Sidebar rendered only on Desktop layouts */}
      {isDesktop && renderSidebar()}

      {/* Main Dashboard Panel */}
      <View style={styles.mainPanel}>
        <ScrollView 
          contentContainerStyle={styles.panelScroll}
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={[THEME.primary]}
              tintColor={THEME.primary}
            />
          }
        >
          {/* Header Panel */}
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Dashboard Overview</Text>
              <Text style={styles.panelSubtitle}>Welcome back, manage your car care platform</Text>
              <Text style={styles.panelDate}>Monday, March 9, 2026</Text>
            </View>
            
            {/* Topbar actions */}
            <View style={styles.topActions}>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput style={styles.searchInput} placeholder="Search users or bookings..." placeholderTextColor="#888" />
              </View>
              <TouchableOpacity style={styles.alertBtn} onPress={() => Alert.alert('Notifications', 'No new system alarms.')}>
                <Text style={styles.alertIcon}>🔔</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation layout for Mobile devices */}
          {!isDesktop && renderMobileTabs()}

          {/* Loading indicator */}
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color={THEME.primary} style={{ marginTop: 80 }} />
          ) : (
            renderActiveTabContent()
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: THEME.background
  },
  // Sidebar Styles
  sidebar: {
    width: 240,
    backgroundColor: THEME.card,
    borderRightWidth: 1,
    borderRightColor: THEME.border,
    paddingVertical: 20,
    justifyContent: 'space-between'
  },
  sidebarHeader: {
    paddingHorizontal: 24,
    marginBottom: 24
  },
  sidebarLogo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: THEME.primary,
    fontStyle: 'italic'
  },
  sidebarMenu: {
    flex: 1
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 4
  },
  sidebarItemActive: {
    backgroundColor: '#0046AD10',
    borderLeftWidth: 4,
    borderLeftColor: THEME.primary
  },
  sidebarIcon: {
    fontSize: 16,
    marginRight: 12,
    color: THEME.textSecondary
  },
  sidebarIconActive: {
    color: THEME.primary
  },
  sidebarLabel: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  sidebarLabelActive: {
    color: THEME.primary
  },
  sidebarFooter: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 16
  },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  },
  adminMeta: {
    marginLeft: 10,
    flex: 1
  },
  adminName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.text
  },
  adminEmail: {
    fontSize: 11,
    color: THEME.textSecondary
  },
  // Mobile Tabs Styles
  mobileTabsScroll: {
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: 8
  },
  mobileTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8
  },
  mobileTabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: THEME.grayLight,
    borderWidth: 1,
    borderColor: THEME.border
  },
  mobileTabItemActive: {
    backgroundColor: '#0046AD10',
    borderColor: THEME.primary
  },
  mobileTabLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.text
  },
  // Main Panel Styles
  mainPanel: {
    flex: 1
  },
  panelScroll: {
    flexGrow: 1
  },
  panelHeader: {
    padding: 24,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    gap: 16
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text
  },
  panelSubtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 4
  },
  panelDate: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.primary,
    marginTop: 4
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    width: Platform.OS === 'web' ? 240 : '100%',
    maxWidth: 300
  },
  searchIcon: {
    marginRight: 6,
    fontSize: 12
  },
  searchInput: {
    fontSize: 12,
    color: THEME.text,
    flex: 1
  },
  alertBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertIcon: {
    fontSize: 16
  },
  // Active Tab Content
  tabContent: {
    padding: 24
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24
  },
  kpiCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.textSecondary
  },
  kpiIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  kpiIcon: {
    fontSize: 14
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 4
  },
  kpiTrend: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  chartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24
  },
  chartCard: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 320 : '100%',
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 16
  },
  // Bar Chart Styles
  barChartContainer: {
    flexDirection: 'row',
    height: 180,
    paddingTop: 10
  },
  barChartAxis: {
    width: 24,
    justifyContent: 'space-between',
    paddingBottom: 20,
    alignItems: 'flex-end',
    paddingRight: 6
  },
  axisLabel: {
    fontSize: 9,
    color: THEME.textSecondary,
    fontWeight: 'bold'
  },
  barChartBars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: THEME.border,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 2
  },
  barColumn: {
    alignItems: 'center',
    flex: 1
  },
  barFill: {
    width: 20,
    backgroundColor: THEME.primary,
    borderRadius: 4
  },
  barLabel: {
    fontSize: 9,
    color: THEME.textSecondary,
    fontWeight: 'bold',
    marginTop: 4,
    position: 'absolute',
    bottom: -16
  },
  // Line Chart Styles
  lineChartContainer: {
    height: 180,
    position: 'relative'
  },
  lineChartGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 1
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 12
  },
  gridLineLabel: {
    width: 28,
    fontSize: 9,
    color: THEME.textSecondary,
    fontWeight: 'bold'
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.border,
    marginLeft: 6
  },
  lineChartPointsContainer: {
    position: 'absolute',
    left: 34,
    right: 0,
    top: 6,
    bottom: 12,
    zIndex: 2
  },
  connectingLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: THEME.primary,
    left: '12%',
    right: '12%',
    top: '55%',
    transform: [{ rotate: '-12deg' }],
    opacity: 0.8
  },
  linePointWrapper: {
    position: 'absolute',
    alignItems: 'center'
  },
  linePoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  pointLabel: {
    fontSize: 9,
    color: THEME.textSecondary,
    fontWeight: 'bold',
    marginTop: 2
  },
  // Table Card Styles
  tableCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20
  },
  tableCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 16
  },
  searchBarInput: {
    backgroundColor: THEME.background,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: THEME.text,
    marginBottom: 16
  },
  table: {
    width: '100%'
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  tableHeader: {
    borderBottomWidth: 2,
    borderBottomColor: THEME.border,
    backgroundColor: '#F9FAFB'
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tableCell: {
    fontSize: 13,
    color: THEME.text
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  viewLink: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: 'bold'
  },
  emptyTableText: {
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center',
    paddingVertical: 20
  },
  smallActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4
  },
  smallActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold'
  },
  // Broadcaster Card
  broadcastCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  broadcastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 4
  },
  broadcastSubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 6,
    marginTop: 12
  },
  textInput: {
    backgroundColor: THEME.background,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: THEME.text
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: THEME.background,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: THEME.border
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6
  },
  toggleOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  toggleOptionText: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: 'bold'
  },
  toggleOptionTextActive: {
    color: THEME.primary
  },
  sendButton: {
    backgroundColor: THEME.primary,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  // User Management Specific Styles
  tabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text
  },
  tabSubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2
  },
  exportBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  userKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  userKpiCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  userKpiTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.textSecondary,
    marginBottom: 6
  },
  userKpiNumber: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    flexWrap: 'wrap'
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    flex: 2,
    minWidth: 200
  },
  filterSearchInput: {
    fontSize: 12,
    color: THEME.text,
    flex: 1,
    marginLeft: 6
  },
  dropdownsWrap: {
    flexDirection: 'row',
    gap: 8
  },
  filterDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dropdownText: {
    fontSize: 12,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  centerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    justifyContent: 'space-between'
  },
  // Error Recovery State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF'
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 16
  },
  errorTextTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 8
  },
  errorTextMessage: {
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24
  },
  retryButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
