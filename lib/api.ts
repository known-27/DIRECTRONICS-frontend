'use client';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { FilterState } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject:  (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null): void => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else       prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing            = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── API Helpers ──────────────────────────────────────────────────────────────

export const authApi = {
  login:   (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout:  () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  me:      () => api.get<{ data: { user: import('@/types').AuthUser } }>('/auth/me'),
};

export const usersApi = {
  list:       ()                           => api.get('/users'),
  create:     (data: unknown)              => api.post('/users', data),
  getById:    (id: string)                 => api.get(`/users/${id}`),
  getProfile: (id: string)                 => api.get(`/users/${id}/profile`),
  update:     (id: string, data: unknown)  => api.patch(`/users/${id}`, data),
  delete:     (id: string)                 => api.delete(`/users/${id}`),
};

export const uploadsApi = {
  /**
   * Upload a profile picture.
   * @param file  - The image file
   * @param targetUserId - If provided (admin context), uploads for this employee; otherwise self-upload
   */
  uploadProfilePicture: (file: File, targetUserId?: string) => {
    const form = new FormData();
    form.append('file', file);
    const url = targetUserId
      ? `/uploads/profile-picture/${targetUserId}`
      : '/uploads/profile-picture';
    return api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  /**
   * Upload an identity document.
   * @param file  - The image or PDF file
   * @param targetUserId - If provided (admin context), uploads for this employee; otherwise self-upload
   */
  uploadIdentityDoc: (file: File, targetUserId?: string) => {
    const form = new FormData();
    form.append('file', file);
    const url = targetUserId
      ? `/uploads/identity-doc/${targetUserId}`
      : '/uploads/identity-doc';
    return api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadProjectImage: (projectId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/uploads/project-image/${projectId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  /**
   * Returns the API path for a protected file, suitable for use with the
   * axios client (useProtectedFile hook) or for constructing fetch URLs.
   * The returned path is relative to the API base (e.g. /uploads/profile-pictures/id/file.jpg)
   * and SHOULD be fetched via the authenticated axios client, NOT used directly in <img src>.
   */
  getApiPath: (relativeUrl: string) => relativeUrl,

  /**
   * Full URL including API base — only use when you can attach auth credentials
   * (e.g. via the axios client, NOT for plain <img src> tags).
   */
  getFileUrl: (relativeUrl: string) =>
    `${BASE_URL}${relativeUrl}`,

  serveFile: (category: string, entityId: string, filename: string) =>
    `${BASE_URL}/uploads/${category}/${entityId}/${filename}`,
};

export const servicesApi = {
  list:          (all = false)             => api.get(`/services${all ? '?all=true' : ''}`),
  create:        (data: unknown)           => api.post('/services', data),
  getById:       (id: string)              => api.get(`/services/${id}`),
  update:        (id: string, data: unknown) => api.patch(`/services/${id}`, data),
  delete:        (id: string)              => api.delete(`/services/${id}`),
  createMapping: (data: unknown)           => api.post('/services/mappings', data),
  deleteMapping: (id: string)              => api.delete(`/services/mappings/${id}`),
};

export const formulasApi = {
  list:   (serviceId?: string)                                  => api.get(`/formulas${serviceId ? `?serviceId=${serviceId}` : ''}`),
  create: (data: unknown)                                        => api.post('/formulas', data),
  getById:(id: string)                                           => api.get(`/formulas/${id}`),
  update: (id: string, data: unknown)                            => api.patch(`/formulas/${id}`, data),
  test:   (id: string, values: Record<string, unknown>)          => api.post(`/formulas/${id}/test`, { values }),
};

export const projectsApi = {
  list:          (params?: FilterState)               => api.get('/projects', { params }),
  create:        (data: unknown)                      => api.post('/projects', data),
  getById:       (id: string)                         => api.get(`/projects/${id}`),
  update:        (id: string, data: unknown)          => api.patch(`/projects/${id}`, data),
  updateFinish:  (id: string, data: unknown)          => api.patch(`/projects/${id}/update`, data),
  submit:        (id: string)                         => api.post(`/projects/${id}/submit`),
  approve:       (id: string, data: unknown)          => api.patch(`/projects/${id}/approve`, data),
  updateStatus:  (id: string, data: unknown)          => api.patch(`/projects/${id}/status`, data),
  delete:        (id: string)                         => api.delete(`/projects/${id}`),
  checkInvoice:  (number: string)                     => api.get<{ data: { available: boolean } }>(`/projects/check-invoice`, { params: { number } }),
  exportPdf:     (params?: FilterState)               =>
    api.get('/export/projects/pdf', { params, responseType: 'blob' }),
};

export const paymentsApi = {
  /** List all payments (admin) with optional filters */
  list: (params?: FilterState) => api.get('/payments', { params }),

  /** List all transactions for a payment */
  listTransactions: (paymentId: string) =>
    api.get(`/payments/${paymentId}/transactions`),

  /** Record a partial payment installment */
  addTransaction: (paymentId: string, data: { amount: number; note?: string }) =>
    api.post(`/payments/${paymentId}/transactions`, data),

  /** Reverse / delete a specific transaction */
  reverseTransaction: (paymentId: string, transactionId: string) =>
    api.delete(`/payments/${paymentId}/transactions/${transactionId}`),

  /** Export all payments as PDF */
  exportPdf: (params?: FilterState) =>
    api.get('/export/payments/pdf', { params, responseType: 'blob' }),
};

export const dashboardApi = {
  admin:    () => api.get('/dashboard/admin'),
  employee: () => api.get('/dashboard/employee'),
};

export const notificationsApi = {
  getCounts: () => api.get<{ data: { pendingReviewCount: number } }>('/notifications/counts'),
};

