import { api } from '../services/api';

export const vehicleApi = {
  getVehicles: async () => {
    return api.listVehicles();
  },
  getVehicle: async (id: string) => {
    return api.getVehicle(id);
  },
  registerVehicle: async (body: any) => {
    return api.registerVehicle(body);
  },
  updateVehicle: async (id: string, body: any) => {
    return api.updateVehicle(id, body);
  },
  deleteVehicle: async (id: string) => {
    return api.deleteVehicle(id);
  }
};

export default vehicleApi;
