import { api } from '../services/api';

export const appointmentApi = {
  getAppointments: async () => {
    return api.listAppointments();
  },
  createAppointment: async (body: any) => {
    return api.createAppointment(body);
  },
  updateAppointmentStatus: async (id: string, status: string) => {
    return api.updateAppointmentStatus(id, status);
  }
};

export default appointmentApi;
