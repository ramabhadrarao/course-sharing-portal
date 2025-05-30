import { create } from 'zustand';
import axios from 'axios';

interface QuizOption {
  _id?: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  _id?: string;
  text: string;
  options: QuizOption[];
  type: 'single' | 'multiple';
}

interface Quiz {
  _id: string;
  id: string;
  title: string;
  course: string | {
    _id: string;
    title: string;
  };
  questions: QuizQuestion[];
  timeLimit: number;
  createdAt: string;
  updatedAt?: string;
}

interface QuizAttempt {
  _id: string;
  id: string;
  quiz: string | {
    _id: string;
    title: string;
  };
  student: string | {
    _id: string;
    name: string;
    email: string;
  };
  answers: Array<{
    question: string;
    selectedOptions: string[];
  }>;
  score: number;
  startedAt: string;
  completedAt?: string;
}

interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  scoreDistribution: {
    excellent: number; // 90-100%
    good: number;      // 80-89%
    average: number;   // 70-79%
    poor: number;      // below 70%
  };
}

interface CreateQuizData {
  title: string;
  course: string;
  questions: QuizQuestion[];
  timeLimit: number;
}

interface UpdateQuizData {
  title?: string;
  questions?: QuizQuestion[];
  timeLimit?: number;
}

interface QuizAttemptData {
  answers: Array<{
    question: string;
    selectedOptions: string[];
  }>;
}

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  quizAttempts: QuizAttempt[];
  currentAttempt: QuizAttempt | null;
  quizStats: QuizStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Quiz CRUD operations
  fetchQuizzes: (courseId: string) => Promise<void>;
  fetchQuizById: (id: string) => Promise<void>;
  createQuiz: (courseId: string, quizData: CreateQuizData) => Promise<Quiz>;
  updateQuiz: (id: string, quizData: UpdateQuizData) => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  
  // Quiz attempt operations
  submitQuizAttempt: (quizId: string, attemptData: QuizAttemptData) => Promise<QuizAttempt>;
  fetchQuizAttempts: (quizId: string) => Promise<void>;
  fetchMyQuizAttempt: (quizId: string) => Promise<void>;
  fetchQuizStats: (quizId: string) => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  clearCurrentQuiz: () => void;
  clearCurrentAttempt: () => void;
  clearQuizStats: () => void;
}

// Set base URL for API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper function to normalize quiz data
const normalizeQuiz = (quiz: any): Quiz => ({
  ...quiz,
  id: quiz._id
});

// Helper function to normalize quiz attempt data
const normalizeQuizAttempt = (attempt: any): QuizAttempt => ({
  ...attempt,
  id: attempt._id
});

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  currentQuiz: null,
  quizAttempts: [],
  currentAttempt: null,
  quizStats: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),
  clearCurrentQuiz: () => set({ currentQuiz: null }),
  clearCurrentAttempt: () => set({ currentAttempt: null }),
  clearQuizStats: () => set({ quizStats: null }),

  fetchQuizzes: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/quizzes`);
      const quizzes = response.data.data.map((quiz: any) => normalizeQuiz(quiz));
      
      set({ quizzes, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch quizzes';
      set({ error: errorMessage, isLoading: false });
      console.error('Fetch quizzes error:', error);
    }
  },

  fetchQuizById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/quizzes/${id}`);
      const quiz = normalizeQuiz(response.data.data);
      
      set({ currentQuiz: quiz, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch quiz';
      set({ error: errorMessage, isLoading: false, currentQuiz: null });
      console.error('Fetch quiz by ID error:', error);
    }
  },

  createQuiz: async (courseId: string, quizData: CreateQuizData) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        ...quizData,
        course: courseId
      };

      const response = await axios.post(`${API_BASE_URL}/courses/${courseId}/quizzes`, payload);
      const newQuiz = normalizeQuiz(response.data.data);
      
      set(state => ({ 
        quizzes: [...state.quizzes, newQuiz],
        currentQuiz: newQuiz,
        isLoading: false 
      }));
      
      return newQuiz;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create quiz';
      set({ error: errorMessage, isLoading: false });
      console.error('Create quiz error:', error);
      throw error;
    }
  },

  updateQuiz: async (id: string, quizData: UpdateQuizData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_BASE_URL}/quizzes/${id}`, quizData);
      const updatedQuiz = normalizeQuiz(response.data.data);
      
      set(state => {
        const updatedQuizzes = state.quizzes.map(quiz => 
          quiz._id === id ? updatedQuiz : quiz
        );
        
        const updatedCurrentQuiz = state.currentQuiz && state.currentQuiz._id === id
          ? updatedQuiz
          : state.currentQuiz;
        
        return { 
          quizzes: updatedQuizzes, 
          currentQuiz: updatedCurrentQuiz,
          isLoading: false 
        };
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update quiz';
      set({ error: errorMessage, isLoading: false });
      console.error('Update quiz error:', error);
      throw error;
    }
  },

  deleteQuiz: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${API_BASE_URL}/quizzes/${id}`);
      
      set(state => ({
        quizzes: state.quizzes.filter(quiz => quiz._id !== id),
        currentQuiz: state.currentQuiz?._id === id ? null : state.currentQuiz,
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete quiz';
      set({ error: errorMessage, isLoading: false });
      console.error('Delete quiz error:', error);
      throw error;
    }
  },

  submitQuizAttempt: async (quizId: string, attemptData: QuizAttemptData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/quizzes/${quizId}/attempt`, attemptData);
      const newAttempt = normalizeQuizAttempt(response.data.data);
      
      set(state => ({ 
        quizAttempts: [...state.quizAttempts, newAttempt],
        currentAttempt: newAttempt,
        isLoading: false 
      }));
      
      return newAttempt;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to submit quiz attempt';
      set({ error: errorMessage, isLoading: false });
      console.error('Submit quiz attempt error:', error);
      throw error;
    }
  },

  fetchQuizAttempts: async (quizId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/attempts`);
      const attempts = response.data.data.map((attempt: any) => normalizeQuizAttempt(attempt));
      
      set({ quizAttempts: attempts, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch quiz attempts';
      set({ error: errorMessage, isLoading: false });
      console.error('Fetch quiz attempts error:', error);
    }
  },

  fetchMyQuizAttempt: async (quizId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/my-attempt`);
      const attempt = normalizeQuizAttempt(response.data.data);
      
      set({ currentAttempt: attempt, isLoading: false });
    } catch (error: any) {
      // 404 is expected if user hasn't attempted the quiz yet
      if (error.response?.status === 404) {
        set({ currentAttempt: null, isLoading: false, error: null });
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to fetch your quiz attempt';
        set({ error: errorMessage, isLoading: false });
        console.error('Fetch my quiz attempt error:', error);
      }
    }
  },

  fetchQuizStats: async (quizId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/stats`);
      const stats = response.data.data;
      
      set({ quizStats: stats, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch quiz statistics';
      set({ error: errorMessage, isLoading: false });
      console.error('Fetch quiz stats error:', error);
    }
  },
}));