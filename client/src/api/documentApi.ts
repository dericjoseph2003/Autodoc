import { api } from '../services/api';

export const documentApi = {
  getExpiringDocuments: async () => {
    return api.listExpiringDocuments();
  },
  listDocuments: async (vehicleId: string) => {
    return api.listDocuments(vehicleId);
  },
  uploadDocument: async (formData: FormData) => {
    return api.uploadDocument(formData);
  },
  deleteDocument: async (id: string) => {
    return api.deleteDocument(id);
  }
};

export default documentApi;
