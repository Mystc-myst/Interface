import axios from 'axios';
import { ApiError, NetworkError, CancelledError } from './errors';

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for logging and auth
axiosClient.interceptors.request.use(
  (config) => {
    // In a real app, you would get the token from local storage or a state manager
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    console.log('Starting Request', config);
    return config;
  },
  (error) => {
    console.error('Request Error', error);
    return Promise.reject(new NetworkError(error.message));
  }
);

// Response interceptor for logging, error handling, and retries
axiosClient.interceptors.response.use(
  (response) => {
    console.log('Response:', response);
    return response;
  },
  (error) => {
    console.error('Response Error', error);

    if (axios.isCancel(error)) {
      return Promise.reject(new CancelledError());
    }

    const { config, response } = error;
    const originalRequest = config;

    // Retry logic for idempotent methods
    const idempotentMethods = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'];
    if (response && response.status >= 500 && idempotentMethods.includes(originalRequest.method.toUpperCase()) && (!originalRequest._retry || originalRequest._retry < 3)) {
      originalRequest._retry = (originalRequest._retry || 0) + 1;
      const delay = 1000 * originalRequest._retry;
      console.log(`Retrying request, attempt ${originalRequest._retry}, delay ${delay}ms`);
      return new Promise((resolve) => setTimeout(() => resolve(axiosClient(originalRequest)), delay));
    }


    if (response) {
      const { status, data } = response;
      const message = (data && data.message) ? data.message : 'An error occurred';

      if (status === 401) {
        // In a real app, you might redirect to a login page
        console.error('Unauthorized. Redirecting to login...');
        // window.location.href = '/login';
      }

      if (status === 403) {
        console.error('Forbidden. You do not have permission to access this resource.');
      }

      if (status === 429) {
        console.error('Too many requests. Please try again later.');
      }

      return Promise.reject(new ApiError(message, status));
    } else if (error.request) {
      return Promise.reject(new NetworkError('No response received from server.'));
    } else {
      return Promise.reject(new Error(error.message));
    }
  }
);

export default axiosClient;
