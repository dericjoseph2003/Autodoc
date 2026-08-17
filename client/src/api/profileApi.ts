import { api } from '../services/api';

export const profileApi = {
  updateProfile: async (data: any) => {
    return api.updateProfile(data);
  }
};
