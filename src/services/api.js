import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://puja-restaurant-api.onrender.com';
export const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID || 'b07af312-2c05-46c9-bf85-044e2620aacf';
export const RESTAURANT_NAME = import.meta.env.VITE_RESTAURANT_NAME || 'Restaurant';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customerToken');
    }
    return Promise.reject(error);
  }
);

export default api;

export const menuAPI = {
  getMenu: () => api.get(`/api/menu?restaurant_id=${RESTAURANT_ID}`),
  getItem: (id) => api.get(`/api/menu/item/${id}`),
  search: (q) => api.get(`/api/menu/search?restaurant_id=${RESTAURANT_ID}&q=${encodeURIComponent(q)}`),
  getFeatured: () => api.get(`/api/menu/featured?restaurant_id=${RESTAURANT_ID}`)
};

export const customerAPI = {
  sendOtp: (name, mobile) =>
    api.post('/api/customer/send-otp', {
      name,
      mobile,
      restaurant_id: RESTAURANT_ID
    }),
  verifyOtp: (mobile, otp) =>
    api.post('/api/customer/verify-otp', {
      mobile,
      otp,
      restaurant_id: RESTAURANT_ID
    }),
  me: () => api.get('/api/customer/me')
};

export const orderAPI = {
  create: (data) =>
    api.post('/api/order', { ...data, restaurant_id: RESTAURANT_ID }),
  get: (orderId) => api.get(`/api/order/${orderId}`)
};

export const paymentAPI = {
  initiateUPI: (orderId) =>
    api.post('/api/payment/initiate-upi', { order_id: orderId }),
  checkStatus: (orderId) =>
    api.get(`/api/payment/status/${orderId}`)
};