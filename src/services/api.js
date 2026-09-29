import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const RESTAURANT_ID = import.meta.env.VITE_RESTAURANT_ID;
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

// ============================================
// MENU API
// ============================================
export const menuAPI = {
  getMenu: () => api.get(`/api/menu?restaurant_id=${RESTAURANT_ID}`),
  getItem: (id) => api.get(`/api/menu/item/${id}`),
  search: (q) => api.get(`/api/menu/search?restaurant_id=${RESTAURANT_ID}&q=${encodeURIComponent(q)}`),
  getFeatured: () => api.get(`/api/menu/featured?restaurant_id=${RESTAURANT_ID}`)
};

// ============================================
// CUSTOMER API
// ============================================
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

// ============================================
// ORDER API
// ============================================
export const orderAPI = {
  create: (data) => {
    const customerName =
      data.customer_name ||
      data.name ||
      localStorage.getItem('customerName') ||
      'Guest';

    const customerMobile =
      data.customer_mobile ||
      data.mobile ||
      localStorage.getItem('customerMobile') ||
      '';

    const payload = {
      ...data,
      restaurant_id: RESTAURANT_ID,
      customer_name: customerName,
      customer_mobile: customerMobile
    };

    console.log('📤 Order payload:', payload);
    return api.post('/api/order', payload);
  },

  get: (orderId) => api.get(`/api/order/${orderId}`),

  customerHistory: (mobile, limit = 20) =>
    api.get(
      `/api/order/customer-history?mobile=${encodeURIComponent(mobile)}&restaurant_id=${RESTAURANT_ID}&limit=${limit}`
    ),

  getLive: () => api.get(`/api/order/live?restaurant_id=${RESTAURANT_ID}`),

  settleCash: (orderId) => api.patch(`/api/order/${orderId}/settle-cash`),

  printBill: (orderId) => api.patch(`/api/order/${orderId}/print-bill`),

  updateStatus: (orderId, status) =>
    api.patch(`/api/order/${orderId}/status`, { status })
};

// ============================================
// PAYMENT API
// ============================================
export const paymentAPI = {
  initiateUPI: (orderId) =>
    api.post('/api/payment/initiate-upi', { order_id: orderId }),
  checkStatus: (orderId) =>
    api.get(`/api/payment/status/${orderId}`),
  mockSuccess: (orderId) =>
    api.post('/api/payment/mock-success', { order_id: orderId })
};