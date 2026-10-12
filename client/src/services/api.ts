import { Platform } from 'react-native';
import Constants from 'expo-constants';

const LIVE_BACKEND_URL = 'https://autodoc-41i8.onrender.com';

export const getBackendHost = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
      }
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    return 'http://localhost:5000';
  }

  // If running in development with an active Expo packager
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const rawUri = 
      Constants.expoConfig?.hostUri || 
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
      (Constants as any).manifest?.debuggerHost ||
      '';

    if (rawUri) {
      const cleanUri = String(rawUri).replace(/^[a-z]+:\/\//i, '');
      const ip = cleanUri.split(':')[0]?.split('/')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1' && !ip.includes('ngrok') && !ip.includes('exp.direct')) {
        return `http://${ip}:5000`;
      }
    }
  }

  // Default for standalone Android and iOS builds
  return LIVE_BACKEND_URL;
};

export const getApiBaseUrl = () => `${getBackendHost()}/api`;
export const BACKEND_HOST = getBackendHost();
export const API_BASE_URL = `${BACKEND_HOST}/api`;


const STORAGE_KEY = 'autodoc_token';

function getStoredToken(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(STORAGE_KEY);
    }
  } catch (_) {}
  return null;
}

let authToken: string | null = getStoredToken();
const listeners = new Set<(token: string | null) => void>();

export const subscribeToToken = (listener: (token: string | null) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setToken = (token: string | null) => {
  authToken = token;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        window.localStorage.setItem(STORAGE_KEY, token);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (_) {}
  listeners.forEach(l => l(token));
};

export const getToken = () => {
  if (!authToken) {
    authToken = getStoredToken();
  }
  return authToken;
};

/**
 * Custom fetch wrapper that appends Auth headers and handles responses
 */
async function request(endpoint: string, options: RequestInit = {}) {
  const currentToken = getToken();
  const headers = new Headers(options.headers || {});
  
  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const isPublicAuthEndpoint = endpoint.includes('/login') || endpoint.includes('/register') || endpoint.includes('/forgot') || endpoint.includes('/reset');

  try {
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && (!currentToken || !isPublicAuthEndpoint)) {
        return { success: true, vehicles: [], appointments: [], documents: [], notifications: [], requests: [], serviceCenters: [] };
      }
      const error: any = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.code = data.error;
      error.errors = data.errors;
      throw error;
    }

    return data;
  } catch (err: any) {
    if (err.status === 401 && (!currentToken || !isPublicAuthEndpoint)) {
      return { success: true, vehicles: [], appointments: [], documents: [], notifications: [], requests: [], serviceCenters: [] };
    }
    throw err;
  }
}

// API Service Functions
export const api = {
  // Auth & Profile
  register: (body: any) => request('/users/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request('/users/login', { method: 'POST', body: JSON.stringify(body) }),
  googleLogin: (idToken: string, role: string = 'owner') => request('/users/google-login', { method: 'POST', body: JSON.stringify({ idToken, role }) }),
  forgotPassword: (email: string) => request('/users/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (body: { email: string; otp: string }) => request('/users/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
  resetPassword: (body: { email: string; otp: string; newPassword: string }) => request('/users/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/users/profile'),
  updateProfile: (body: any) => request('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),


  // Service Centers
  registerServiceCenter: (body: any) => request('/service-centers', { method: 'POST', body: JSON.stringify(body) }),
  listServiceCenters: () => request('/service-centers'),
  getMyServiceCenter: () => request('/service-centers/my-center'),
  updateServiceCenterServices: (id: string, servicesOffered: any[]) =>
    request(`/service-centers/${id}/services`, { method: 'PUT', body: JSON.stringify({ servicesOffered }) }),
  approveServiceCenter: (id: string) => request(`/service-centers/${id}/approve`, { method: 'PATCH' }),
  deactivateServiceCenter: (id: string) => request(`/service-centers/${id}/deactivate`, { method: 'PATCH' }),
  getPendingServiceCenters: () => request('/service-centers/pending'),
  getServiceCenterDetail: (id: string) => request(`/service-centers/${id}/detail`),
  updateApprovalStatus: (id: string, body: any) => request(`/service-centers/${id}/approval`, { method: 'PUT', body: JSON.stringify(body) }),
  getDashboardStats: () => request('/admin/dashboard-stats'),
  getRecentUsers: () => request('/admin/recent-users'),
  getPendingSummary: () => request('/admin/pending-summary'),

  // Vehicles
  registerVehicle: (body: any) => request('/vehicles', { method: 'POST', body: JSON.stringify(body) }),
  listVehicles: () => request('/vehicles'),
  getVehicle: (id: string) => request(`/vehicles/${id}`),
  updateVehicle: (id: string, body: any) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVehicle: (id: string) => request(`/vehicles/${id}`, { method: 'DELETE' }),

  // Documents
  uploadDocument: (formData: FormData) => request('/documents', { method: 'POST', body: formData }),
  listDocuments: (vehicleId: string) => request(`/documents/vehicle/${vehicleId}`),
  deleteDocument: (id: string) => request(`/documents/${id}`, { method: 'DELETE' }),
  listExpiringDocuments: () => request('/documents/expiring'),

  // Notifications
  listNotifications: () => request('/notifications'),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),

  // --- APPOINTMENTS (real backend) ---

  // List appointments (role-filtered by backend)
  listAppointments: () => request('/appointments'),

  // Create appointment (owner)
  createAppointment: (body: any) => request('/appointments', { method: 'POST', body: JSON.stringify(body) }),

  // Mock Payment
  createMockPayment: (body: { amount: number; currency?: string; payment_method?: string }) => request('/payments/mock', { method: 'POST', body: JSON.stringify(body) }),

  // Update appointment status (service_center / admin)
  updateAppointmentStatus: (id: string, status: string) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Get available time slots for a service center on a date
  getAvailableSlots: (serviceCenterId: string, date?: string) =>
    request(`/service-centers/${encodeURIComponent(serviceCenterId)}/available-slots${date ? `?date=${encodeURIComponent(date)}` : ''}`),

  // Lock a time slot temporarily
  lockSlot: (service_center_id: string, date: string, time_slot: string) =>
    request('/appointments/lock-slot', { method: 'POST', body: JSON.stringify({ service_center_id, date, time_slot }) }),

  // --- ROADSIDE REQUESTS (real backend) ---

  // List roadside requests (role-filtered by backend)
  listRoadsideRequests: () => request('/roadside-requests'),

  // Create roadside request (owner)
  createRoadsideRequest: (body: any) =>
    request('/roadside-requests', { method: 'POST', body: JSON.stringify(body) }),

  // Update roadside request status (service_center / admin)
  updateRoadsideStatus: (id: string, status: string) =>
    request(`/roadside-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // --- PARTS CATALOG & SPARE PARTS ---

  listParts: (params?: { search?: string; category?: string; vehicle?: string; lowStockOnly?: boolean; page?: number; limit?: number; serviceCenter?: string }) => {
    if (!params) return request('/parts');
    const query = '?' + Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return request(`/parts${query}`);
  },

  getLowStockParts: () => request('/parts/low-stock'),

  getPartDetail: (id: string) => request(`/parts/${id}`),

  getPartAvailability: (sku: string, lat?: number, lng?: number, sortBy?: string) => {
    const query = [
      lat !== undefined ? `lat=${lat}` : '',
      lng !== undefined ? `lng=${lng}` : '',
      sortBy ? `sortBy=${sortBy}` : ''
    ].filter(Boolean).join('&');
    return request(`/parts/${encodeURIComponent(sku)}/availability${query ? `?${query}` : ''}`);
  },

  getNearbyServiceCenters: (lat: number, lng: number, radiusKm?: number) => {
    return request(`/service-centers/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm || 50}`);
  },

  comparePartPrices: (sku: string) => request(`/parts/compare/${encodeURIComponent(sku)}`),

  subscribeStockAlert: (partId: string, emailOrPhone?: string) =>
    request(`/parts/${partId}/stock-alert`, { method: 'POST', body: JSON.stringify({ emailOrPhone }) }),

  createPart: (body: any) => request('/parts', { method: 'POST', body: JSON.stringify(body) }),

  updatePart: (id: string, body: any) => request(`/parts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  adjustPartStock: (id: string, delta: number) => request(`/parts/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ delta }) }),

  deletePart: (id: string) => request(`/parts/${id}`, { method: 'DELETE' }),

  listSpareParts: (params?: { serviceCenter?: string; category?: string; search?: string; vehicle?: string }) => {
    const query = params
      ? '?' + Object.entries(params).filter(([_, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
      : '';
    return request(`/parts${query}`).catch(() => request(`/spare-parts${query}`));
  },

  listInventory: (params?: { serviceCenterId?: string; lowStockOnly?: boolean }) => {
    const query = params
      ? '?' + Object.entries(params).filter(([_, v]) => v !== undefined && v !== null).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
      : '';
    return request(`/inventory${query}`);
  },

  createInventory: (body: any) => request('/inventory', { method: 'POST', body: JSON.stringify(body) }),
  updateInventory: (id: string, body: any) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adjustInventoryStock: (id: string, delta: number) => request(`/inventory/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ delta }) }),
  deleteInventoryItem: (id: string) => request(`/inventory/${id}`, { method: 'DELETE' }),

  createSparePart: (body: any) => request('/parts', { method: 'POST', body: JSON.stringify(body) }),
  updateSparePart: (id: string, body: any) => request(`/parts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSparePart: (id: string) => request(`/parts/${id}`, { method: 'DELETE' }),

  // --- ADMIN: List All Users (real backend) ---
  listAllUsers: () => request('/admin/users'),
};
