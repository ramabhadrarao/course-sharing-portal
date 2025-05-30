import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  profileImageUrl?: string;
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
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'faculty';
}

// Mock API functions (replace with actual API calls)
const mockLogin = async (email: string, password: string) => {
  // Simulating API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, create different users based on email
  if (email.includes('faculty')) {
    return {
      token: 'mock-faculty-jwt-token',
      user: {
        id: 'faculty-123',
        email,
        name: 'Faculty User',
        role: 'faculty' as const,
      }
    };
  } else if (email.includes('admin')) {
    return {
      token: 'mock-admin-jwt-token',
      user: {
        id: 'admin-123',
        email,
        name: 'Admin User',
        role: 'admin' as const,
      }
    };
  } else {
    return {
      token: 'mock-student-jwt-token',
      user: {
        id: 'student-123',
        email,
        name: 'Student User',
        role: 'student' as const,
      }
    };
  }
};

const mockRegister = async (userData: RegisterData) => {
  // Simulating API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    token: 'mock-jwt-token',
    user: {
      id: 'user-123',
      email: userData.email,
      name: userData.name,
      role: userData.role,
    }
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Replace with actual API call when available
          const { token, user } = await mockLogin(email, password);
          
          // In a real app, you would decode the JWT here
          // const decodedToken = jwtDecode(token);
          
          set({ 
            token, 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: 'Invalid email or password', 
            isLoading: false 
          });
        }
      },
      
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          // Replace with actual API call when available
          const { token, user } = await mockRegister(userData);
          
          set({ 
            token, 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: 'Registration failed', 
            isLoading: false 
          });
        }
      },
      
      logout: () => {
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false 
        });
      },
      
      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set(state => ({ 
            user: state.user ? { ...state.user, ...userData } : null,
            isLoading: false 
          }));
        } catch (error) {
          set({ 
            error: 'Failed to update profile', 
            isLoading: false 
          });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);