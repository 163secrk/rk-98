import axios from 'axios';
import { useAuthStore } from '../store/auth';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  getProfile: () => request.get('/auth/profile'),
};

export const storesApi = {
  list: () => request.get('/stores'),
  get: (id) => request.get(`/stores/${id}`),
  create: (data) => request.post('/stores', data),
  update: (id, data) => request.patch(`/stores/${id}`, data),
  remove: (id) => request.delete(`/stores/${id}`),
};

export const staffApi = {
  list: () => request.get('/staff'),
  get: (id) => request.get(`/staff/${id}`),
  create: (data) => request.post('/staff', data),
  update: (id, data) => request.patch(`/staff/${id}`, data),
  remove: (id) => request.delete(`/staff/${id}`),
};

export const clothingApi = {
  list: () => request.get('/clothing-types'),
  active: () => request.get('/clothing-types/active/list'),
  get: (id) => request.get(`/clothing-types/${id}`),
  create: (data) => request.post('/clothing-types', data),
  update: (id, data) => request.patch(`/clothing-types/${id}`, data),
  remove: (id) => request.delete(`/clothing-types/${id}`),
};

export const ordersApi = {
  list: (params) => request.get('/orders', { params }),
  get: (id) => request.get(`/orders/${id}`),
  getByNo: (orderNo) => request.get(`/orders/no/${orderNo}`),
  create: (data) => request.post('/orders', data),
  updateStatus: (id, data) => request.patch(`/orders/${id}/status`, data),
  getVoucher: (id) => request.get(`/orders/${id}/voucher`),
  getStats: (params) => request.get('/orders/stats/summary', { params }),
};

export const membersApi = {
  list: (params) => request.get('/members', { params }),
  get: (id) => request.get(`/members/${id}`),
  findByPhone: (phone) => request.get(`/members/phone/${phone}`),
  findByMemberNo: (memberNo) => request.get(`/members/member-no/${memberNo}`),
  register: (data) => request.post('/members/register', data),
  recharge: (data) => request.post('/members/recharge', data),
  purchasePackage: (data) => request.post('/members/purchase-package', data),
  settleOrder: (data) => request.post('/members/settle-order', data),
  update: (id, data) => request.patch(`/members/${id}`, data),
  getRechargeRecords: (id) => request.get(`/members/${id}/recharge-records`),
  getDeductionRecords: (id) => request.get(`/members/${id}/deduction-records`),
  getMemberPackages: (id) => request.get(`/members/${id}/member-packages`),
  getStats: () => request.get('/members/stats'),
};

export const packagesApi = {
  list: () => request.get('/packages'),
  active: () => request.get('/packages/active/list'),
  get: (id) => request.get(`/packages/${id}`),
  create: (data) => request.post('/packages', data),
  update: (id, data) => request.patch(`/packages/${id}`, data),
  remove: (id) => request.delete(`/packages/${id}`),
};

export const consumablesApi = {
  list: (params) => request.get('/consumables', { params }),
  get: (id) => request.get(`/consumables/${id}`),
  create: (data) => request.post('/consumables', data),
  update: (id, data) => request.patch(`/consumables/${id}`, data),
  remove: (id) => request.delete(`/consumables/${id}`),
  inbound: (id, data) => request.post(`/consumables/${id}/inbound`, data),
  consume: (id, data) => request.post(`/consumables/${id}/consume`, data),
  adjust: (id, data) => request.post(`/consumables/${id}/adjust`, data),
  getLowStockAlerts: (params) => request.get('/consumables/alerts/low-stock', { params }),
  getRecords: (params) => request.get('/consumables/records', { params }),
  getRecommendedForWash: (params) => request.get('/consumables/recommended/wash', { params }),
  getOrderRecords: (orderId) => request.get(`/consumables/order/${orderId}/records`),
};

export const reportsApi = {
  getDailyReport: (params) => request.get('/reports/daily', { params }),
  exportDailyReport: (params) =>
    request.get('/reports/daily/export', {
      params,
      responseType: 'blob',
    }),
};
