import api from './client';

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

// Employees
export const getEmployees = () => api.get('/employees');
export const createEmployee = (data: any) => api.post('/employees', data);
export const updateEmployee = (id: string, data: any) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id: string) => api.delete(`/employees/${id}`);

// Services
export const getServices = () => api.get('/services');
export const createService = (data: any) => api.post('/services', data);
export const updateService = (id: string, data: any) => api.put(`/services/${id}`, data);
export const deleteService = (id: string) => api.delete(`/services/${id}`);

// Availability
export const getAvailability = (year: number, month: number) =>
  api.get('/availability', { params: { year, month } });
export const getSlots = (date: string, employeeId: string, duration: number) =>
  api.get('/availability/slots', { params: { date, employeeId, duration } });
export const setAvailability = (data: any) => api.post('/availability', data);
export const deleteAvailability = (id: string) => api.delete(`/availability/${id}`);

// Appointments
export const getAppointments = (params: any) => api.get('/appointments', { params });
export const createAppointment = (data: any) => api.post('/appointments', data);
export const cancelAppointment = (id: string) => api.patch(`/appointments/${id}/cancel`);

// Payments
export const createPaymentPreference = (data: any) => api.post('/payments/create-preference', data);
export const processPayment = (data: any) => api.post('/payments/process', data);
