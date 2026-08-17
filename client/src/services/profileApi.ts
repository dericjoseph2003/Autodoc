import { api } from './api';

export const profileApi = {
  updateProfile: async (data: any) => {
    return api.updateProfile(data);
  }
};
