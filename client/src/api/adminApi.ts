import { api } from '../services/api';

export const adminApi = {
  getPendingServiceCenters: async () => {
    return api.getPendingServiceCenters();
  },
  getServiceCenterDetail: async (id: string) => {
    return api.getServiceCenterDetail(id);
  },
  updateApprovalStatus: async (id: string, approvalStatus: 'approved' | 'rejected', rejectionReason?: string) => {
    return api.updateApprovalStatus(id, { approvalStatus, rejectionReason });
  },
  getDashboardStats: async () => {
    return api.getDashboardStats();
  },
  getRecentUsers: async () => {
    return api.getRecentUsers();
  },
  getPendingServiceCentersSummary: async () => {
    return api.getPendingSummary();
  }
};
