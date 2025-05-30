import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Default base URL - replace with your actual API endpoint
// axios.defaults.baseURL = 'https://api.your-college-portal.com';

// Dummy base URL for simulation
axios.defaults.baseURL = 'https://api.example.com';

export const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const { token } = useAuthStore.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Unauthorized, clear auth state
        useAuthStore.getState().logout();
        // Redirect to login if needed
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

export default axios;