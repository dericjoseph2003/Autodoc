import { Platform } from 'react-native';

const BACKEND_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  resetPassword: (body: { email: string; otp: string; newPassword: string }) => request('/users/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/users/profile'),
  updateProfile: (body: any) => request('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),


  // Service Centers
  registerServiceCenter: (body: any) => request('/service-centers', { method: 'POST', body: JSON.stringify(body) }),
  listServiceCenters: () => request('/service-centers'),
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

  // Update appointment status (service_center / admin)
  updateAppointmentStatus: (id: string, status: string) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // --- ROADSIDE REQUESTS (real backend) ---

  // List roadside requests (role-filtered by backend)
  listRoadsideRequests: () => request('/roadside-requests'),

  // Create roadside request (owner)
  createRoadsideRequest: (body: any) =>
    request('/roadside-requests', { method: 'POST', body: JSON.stringify(body) }),

  // Update roadside request status (service_center / admin)
  updateRoadsideStatus: (id: string, status: string) =>
    request(`/roadside-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // --- SPARE PARTS ---

  listSpareParts: (params?: { serviceCenter?: string; category?: string }) => {
    const query = params
      ? '?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
      : '';
    return request(`/spare-parts${query}`);
  },

  createSparePart: (body: any) => request('/spare-parts', { method: 'POST', body: JSON.stringify(body) }),

  // --- ADMIN: List All Users (real backend) ---
  listAllUsers: () => request('/admin/users'),
};
