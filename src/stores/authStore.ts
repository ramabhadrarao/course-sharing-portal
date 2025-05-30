import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  profileImageUrl?: string;
  createdAt: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  getCurrentUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'faculty';
}

// Set base URL for API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password,
          });
          
          const { token } = response.data;
          
          // Set token in axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data
          const userResponse = await axios.get(`${API_BASE_URL}/auth/me`);
          const user = userResponse.data.data;
          
          set({ 
            token, 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed';
          set({ 
            error: errorMessage, 
            isLoading: false,
            token: null,
            user: null,
            isAuthenticated: false
          });
          throw error;
        }
      },
      
      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
          
          const { token } = response.data;
          
          // Set token in axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data
          const userResponse = await axios.get(`${API_BASE_URL}/auth/me`);
          const user = userResponse.data.data;
          
          set({ 
            token, 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Registration failed';
          set({ 
            error: errorMessage, 
            isLoading: false,
            token: null,
            user: null,
            isAuthenticated: false
          });
          throw error;
        }
      },
      
      logout: () => {
        // Remove token from axios defaults
        delete axios.defaults.headers.common['Authorization'];
        
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false,
          error: null
        });
      },
      
      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.put(`${API_BASE_URL}/auth/updatedetails`, userData);
          const updatedUser = response.data.data;
          
          set(state => ({ 
            user: updatedUser,
            isLoading: false,
            error: null
          }));
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to update profile';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          throw error;
        }
      },

      getCurrentUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${API_BASE_URL}/auth/me`);
          const user = response.data.data;
          
          set({ 
            user, 
            isAuthenticated: true,
            error: null
          });
        } catch (error: any) {
          // Token is invalid, logout
          get().logout();
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Restore axios authorization header on app load
        if (state?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          // Verify token is still valid
          state.getCurrentUser();
        }
      },
    }
  )
);