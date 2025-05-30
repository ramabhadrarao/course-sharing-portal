import { create } from 'zustand';
import axios from 'axios';

interface User {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  profileImage?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'faculty' | 'admin';
  profileImage?: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  profileImage?: string;
}

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  
  // User CRUD operations
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  createUser: (userData: CreateUserData) => Promise<User>;
  updateUser: (id: string, userData: UpdateUserData) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  clearCurrentUser: () => void;
}

// Set base URL for API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper function to normalize user data
const normalizeUser = (user: any): User => ({
  ...user,
  id: user._id,
  profileImageUrl: user.profileImage
});

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),
  clearCurrentUser: () => set({ currentUser: null }),

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      const users = response.data.data.map((user: any) => normalizeUser(user));
      
      set({ users, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch users';
      set({ error: errorMessage, isLoading: false });
      console.error('Fetch users error:', error);
    }
  },

  fetchUserById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${id}`);
      const user = normalizeUser(response.data.data);
      
      set({ currentUser: user, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch user';
      set({ error: errorMessage, isLoading: false, currentUser: null });
      console.error('Fetch user by ID error:', error);
    }
  },

  createUser: async (userData: CreateUserData) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        ...userData,
        profileImage: userData.profileImage || undefined
      };

      const response = await axios.post(`${API_BASE_URL}/users`, payload);
      const newUser = normalizeUser(response.data.data);
      
      set(state => ({ 
        users: [...state.users, newUser],
        currentUser: newUser,
        isLoading: false 
      }));
      
      return newUser;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create user';
      set({ error: errorMessage, isLoading: false });
      console.error('Create user error:', error);
      throw error;
    }
  },

  updateUser: async (id: string, userData: UpdateUserData) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        name: userData.name,
        email: userData.email,
        profileImage: userData.profileImage
      };

      const response = await axios.put(`${API_BASE_URL}/users/${id}`, payload);
      const updatedUser = normalizeUser(response.data.data);
      
      set(state => {
        const updatedUsers = state.users.map(user => 
          user._id === id ? updatedUser : user
        );
        
        const updatedCurrentUser = state.currentUser && state.currentUser._id === id
          ? updatedUser
          : state.currentUser;
        
        return { 
          users: updatedUsers, 
          currentUser: updatedCurrentUser,
          isLoading: false 
        };
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update user';
      set({ error: errorMessage, isLoading: false });
      console.error('Update user error:', error);
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
      
      set(state => ({
        users: state.users.filter(user => user._id !== id),
        currentUser: state.currentUser?._id === id ? null : state.currentUser,
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete user';
      set({ error: errorMessage, isLoading: false });
      console.error('Delete user error:', error);
      throw error;
    }
  },
}));