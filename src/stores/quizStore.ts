// src/stores/quizStore.ts - FIXED VERSION
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
const normalizeQuiz = (quiz: any): Quiz => {
  // Ensure questions and options are properly handled
  const normalizedQuestions = (quiz.questions || []).map((q: any) => ({
    ...q,
    _id: q._id || q.id,
    options: (q.options || []).map((opt: any) => ({
      ...opt,
      _id: opt._id || opt.id
    }))
  }));

  return {
    ...quiz,
    id: quiz._id,
    questions: normalizedQuestions
  };
};

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
    if (!courseId) {
      set({ error: 'Course ID is required', isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/quizzes`);
      
      if (response.data.success && response.data.data) {
        const quizzes = response.data.data.map((quiz: any) => normalizeQuiz(quiz));
        set({ quizzes, isLoading: false });
      } else {
        set({ quizzes: [], isLoading: false });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch quizzes';
      set({ error: errorMessage, isLoading: false, quizzes: [] });
      console.error('Fetch quizzes error:', error);
    }
  },

  fetchQuizById: async (id: string) => {
    if (!id) {
      set({ error: 'Quiz ID is required', isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/quizzes/${id}`);
      
      if (response.data.success && response.data.data) {
        const quiz = normalizeQuiz(response.data.data);
        set({ currentQuiz: quiz, isLoading: false });
      } else {
        set({ currentQuiz: null, isLoading: false, error: 'Quiz not found' });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch quiz';
      set({ error: errorMessage, isLoading: false, currentQuiz: null });
      console.error('Fetch quiz by ID error:', error);
    }
  },

  createQuiz: async (courseId: string, quizData: CreateQuizData) => {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    if (!quizData.title?.trim()) {
      throw new Error('Quiz title is required');
    }

    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error('At least one question is required');
    }

    // Validate questions
    for (let i = 0; i < quizData.questions.length; i++) {
      const question = quizData.questions[i];
      
      if (!question.text?.trim()) {
        throw new Error(`Question ${i + 1} text is required`);
      }
      
      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        throw new Error(`Question ${i + 1} must have at least 2 options`);
      }
      
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        throw new Error(`Question ${i + 1} must have at least one correct answer`);
      }
      
      if (question.type === 'single' && correctOptions.length > 1) {
        throw new Error(`Single choice question ${i + 1} can only have one correct answer`);
      }
      
      // Check that all options have text
      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j].text?.trim()) {
          throw new Error(`Question ${i + 1}, option ${j + 1} text is required`);
        }
      }
    }

    set({ isLoading: true, error: null });
    try {
      const payload = {
        ...quizData,
        course: courseId
      };

      const response = await axios.post(`${API_BASE_URL}/courses/${courseId}/quizzes`, payload);
      
      if (response.data.success && response.data.data) {
        const newQuiz = normalizeQuiz(response.data.data);
        
        set(state => ({ 
          quizzes: [...state.quizzes, newQuiz],
          currentQuiz: newQuiz,
          isLoading: false 
        }));
        
        return newQuiz;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create quiz';
      set({ error: errorMessage, isLoading: false });
      console.error('Create quiz error:', error);
      throw error;
    }
  },

  updateQuiz: async (id: string, quizData: UpdateQuizData) => {
    if (!id) {
      throw new Error('Quiz ID is required');
    }

    // Validate if data is provided
    if (quizData.title !== undefined && !quizData.title?.trim()) {
      throw new Error('Quiz title cannot be empty');
    }

    if (quizData.questions !== undefined) {
      if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
        throw new Error('At least one question is required');
      }
      
      // Validate questions (same as create)
      for (let i = 0; i < quizData.questions.length; i++) {
        const question = quizData.questions[i];
        
        if (!question.text?.trim()) {
          throw new Error(`Question ${i + 1} text is required`);
        }
        
        if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
          throw new Error(`Question ${i + 1} must have at least 2 options`);
        }
        
        const correctOptions = question.options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
          throw new Error(`Question ${i + 1} must have at least one correct answer`);
        }
        
        if (question.type === 'single' && correctOptions.length > 1) {
          throw new Error(`Single choice question ${i + 1} can only have one correct answer`);
        }
      }
    }

    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_BASE_URL}/quizzes/${id}`, quizData);
      
      if (response.data.success && response.data.data) {
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
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update quiz';
      set({ error: errorMessage, isLoading: false });
      console.error('Update quiz error:', error);
      throw error;
    }
  },

  deleteQuiz: async (id: string) => {
    if (!id) {
      throw new Error('Quiz ID is required');
    }

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
    if (!quizId) {
      throw new Error('Quiz ID is required');
    }

    if (!attemptData.answers || !Array.isArray(attemptData.answers)) {
      throw new Error('Answers are required');
    }

    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/quizzes/${quizId}/attempt`, attemptData);
      
      if (response.data.success && response.data.data) {
        const newAttempt = normalizeQuizAttempt(response.data.data);
        
        set(state => ({ 
          quizAttempts: [...state.quizAttempts, newAttempt],
          currentAttempt: newAttempt,
          isLoading: false 
        }));
        
        return newAttempt;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to submit quiz attempt';
      set({ error: errorMessage, isLoading: false });
      console.error('Submit quiz attempt error:', error);
      throw error;
    }
  },

  fetchQuizAttempts: async (quizId: string) => {
    if (!quizId) {
      set({ error: 'Quiz ID is required', isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/attempts`);
      
      if (response.data.success && response.data.data) {
        const attempts = response.data.data.map((attempt: any) => normalizeQuizAttempt(attempt));
        set({ quizAttempts: attempts, isLoading: false });
      } else {
        set({ quizAttempts: [], isLoading: false });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch quiz attempts';
      set({ error: errorMessage, isLoading: false, quizAttempts: [] });
      console.error('Fetch quiz attempts error:', error);
    }
  },

  fetchMyQuizAttempt: async (quizId: string) => {
    if (!quizId) {
      set({ error: 'Quiz ID is required', isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/my-attempt`);
      
      if (response.data.success && response.data.data) {
        const attempt = normalizeQuizAttempt(response.data.data);
        set({ currentAttempt: attempt, isLoading: false });
      } else {
        set({ currentAttempt: null, isLoading: false });
      }
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
    if (!quizId) {
      set({ error: 'Quiz ID is required', isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/stats`);
      
      if (response.data.success && response.data.data) {
        const stats = response.data.data;
        set({ quizStats: stats, isLoading: false });
      } else {
        set({ quizStats: null, isLoading: false });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch quiz statistics';
      set({ error: errorMessage, isLoading: false, quizStats: null });
      console.error('Fetch quiz stats error:', error);
    }
  },
}));