import { create } from 'zustand';
import axios from 'axios';

// Types
export interface Section {
  _id: string;
  id: string;
  title: string;
  description?: string;
  order: number;
  subsections: Subsection[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subsection {
  _id: string;
  id: string;
  title: string;
  content: string;
  contentType: 'text' | 'video' | 'file' | 'quiz' | 'embed' | 'link';
  order: number;
  fileUrl?: string;
  videoUrl?: string;
  embedUrl?: string;
  linkUrl?: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    description?: string;
  };
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  _id: string;
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  accessCode: string;
  coverImage?: string;
  category: string;
  difficulty: string;
  duration: number;
  prerequisites?: string[];
  learningOutcomes?: string[];
  tags?: string[];
  createdBy: {
    _id: string;
    id: string;
    name: string;
    email: string;
  };
  enrolledStudents: string[];
  enrolledStudentsCount: number;
  sections: Section[];
  isActive: boolean;
  isPublished: boolean;
  publishedAt?: string;
  settings: {
    allowComments: boolean;
    allowDownloads: boolean;
    requireApproval: boolean;
  };
  analytics: {
    totalViews: number;
    totalCompletions: number;
    averageRating: number;
    totalRatings: number;
  };
  totalContent: number;
  estimatedDuration: number;
  createdAt: string;
  updatedAt: string;
}

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  
  // Course CRUD operations
  fetchCourses: (params?: SearchParams) => Promise<void>;
  fetchCourseById: (id: string) => Promise<void>;
  createCourse: (courseData: CreateCourseData) => Promise<Course>;
  updateCourse: (id: string, courseData: Partial<CreateCourseData>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  joinCourse: (accessCode: string) => Promise<void>;
  leaveCourse: (courseId: string) => Promise<void>;
  
  // Section management
  addSection: (courseId: string, section: CreateSectionData) => Promise<void>;
  updateSection: (courseId: string, sectionId: string, data: Partial<CreateSectionData>) => Promise<void>;
  deleteSection: (courseId: string, sectionId: string) => Promise<void>;
  
  // Subsection management
  addSubsection: (courseId: string, sectionId: string, subsection: CreateSubsectionData) => Promise<void>;
  updateSubsection: (courseId: string, sectionId: string, subsectionId: string, data: Partial<CreateSubsectionData>) => Promise<void>;
  deleteSubsection: (courseId: string, sectionId: string, subsectionId: string) => Promise<void>;

  // Utility functions
  clearError: () => void;
  clearCurrentCourse: () => void;
}

interface SearchParams {
  search?: string;
  category?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}

interface CreateCourseData {
  title: string;
  description: string;
  shortDescription?: string;
  accessCode: string;
  coverImage?: string;
  category?: string;
  difficulty?: string;
  prerequisites?: string[];
  learningOutcomes?: string[];
  tags?: string[];
}

interface CreateSectionData {
  title: string;
  description?: string;
  order: number;
}

interface CreateSubsectionData {
  title: string;
  content: string;
  contentType: 'text' | 'video' | 'file' | 'quiz' | 'embed' | 'link';
  order: number;
  fileUrl?: string;
  videoUrl?: string;
  embedUrl?: string;
  linkUrl?: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    description?: string;
  };
}

// Set base URL for API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Helper function to normalize course data
const normalizeCourse = (course: any): Course => ({
  ...course,
  id: course._id,
  createdBy: {
    ...course.createdBy,
    id: course.createdBy._id
  },
  enrolledStudentsCount: Array.isArray(course.enrolledStudents) 
    ? course.enrolledStudents.length 
    : course.enrolledStudentsCount || 0,
  sections: course.sections?.map((section: any) => ({
    ...section,
    id: section._id,
    subsections: section.subsections?.map((subsection: any) => ({
      ...subsection,
      id: subsection._id
    })) || []
  })) || []
});

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  currentCourse: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),
  clearCurrentCourse: () => set({ currentCourse: null }),

  fetchCourses: async (params?: SearchParams) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.search) queryParams.append('search', params.search);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const url = `${API_BASE_URL}/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get(url);
      const courses = response.data.data.map((course: any) => normalizeCourse(course));
      
      set({ courses, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch courses';
      set({ error: errorMessage, isLoading: false });
      console.error('Fetch courses error:', error);
    }
  },

  fetchCourseById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/${id}`);
      const course = normalizeCourse(response.data.data);
      
      set({ currentCourse: course, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch course';
      set({ error: errorMessage, isLoading: false, currentCourse: null });
      console.error('Fetch course by ID error:', error);
    }
  },

  createCourse: async (courseData: CreateCourseData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/courses`, courseData);
      const newCourse = normalizeCourse(response.data.data);
      
      set(state => ({ 
        courses: [...state.courses, newCourse],
        currentCourse: newCourse,
        isLoading: false 
      }));
      
      return newCourse;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create course';
      set({ error: errorMessage, isLoading: false });
      console.error('Create course error:', error);
      throw error;
    }
  },

  updateCourse: async (id: string, courseData: Partial<CreateCourseData>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_BASE_URL}/courses/${id}`, courseData);
      const updatedCourse = normalizeCourse(response.data.data);
      
      set(state => {
        const updatedCourses = state.courses.map(course => 
          course._id === id ? updatedCourse : course
        );
        
        const updatedCurrentCourse = state.currentCourse && state.currentCourse._id === id
          ? updatedCourse
          : state.currentCourse;
        
        return { 
          courses: updatedCourses, 
          currentCourse: updatedCurrentCourse,
          isLoading: false 
        };
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update course';
      set({ error: errorMessage, isLoading: false });
      console.error('Update course error:', error);
      throw error;
    }
  },

  deleteCourse: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${API_BASE_URL}/courses/${id}`);
      
      set(state => ({
        courses: state.courses.filter(course => course._id !== id),
        currentCourse: state.currentCourse?._id === id ? null : state.currentCourse,
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete course';
      set({ error: errorMessage, isLoading: false });
      console.error('Delete course error:', error);
      throw error;
    }
  },

  joinCourse: async (accessCode: string) => {
    set({ isLoading: true, error: null });
    try {
      // Find course by access code first
      const coursesResponse = await axios.get(`${API_BASE_URL}/courses`);
      const course = coursesResponse.data.data.find((c: any) => 
        c.accessCode.toUpperCase() === accessCode.toUpperCase()
      );
      
      if (!course) {
        throw new Error('Invalid access code');
      }
      
      // Join the course
      await axios.post(`${API_BASE_URL}/courses/${course._id}/join`, { accessCode });
      
      // Refresh courses list
      await get().fetchCourses();
      
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to join course. Invalid access code.';
      set({ error: errorMessage, isLoading: false });
      console.error('Join course error:', error);
      throw error;
    }
  },

  leaveCourse: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_BASE_URL}/courses/${courseId}/leave`);
      
      // Refresh courses list
      await get().fetchCourses();
      
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to leave course';
      set({ error: errorMessage, isLoading: false });
      console.error('Leave course error:', error);
      throw error;
    }
  },

  // Section management
  addSection: async (courseId: string, sectionData: CreateSectionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/courses/${courseId}/sections`, sectionData);
      const updatedCourse = normalizeCourse(response.data.data);
      
      set(state => ({
        currentCourse: updatedCourse,
        courses: state.courses.map(course => 
          course._id === courseId ? updatedCourse : course
        ),
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add section';
      set({ error: errorMessage, isLoading: false });
      console.error('Add section error:', error);
      throw error;
    }
  },

  updateSection: async (courseId: string, sectionId: string, data: Partial<CreateSectionData>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_BASE_URL}/courses/${courseId}/sections/${sectionId}`, data);
      const updatedCourse = normalizeCourse(response.data.data);
      
      set(state => ({
        currentCourse: updatedCourse,
        courses: state.courses.map(course => 
          course._id === courseId ? updatedCourse : course
        ),
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update section';
      set({ error: errorMessage, isLoading: false });
      console.error('Update section error:', error);
      throw error;
    }
  },

  deleteSection: async (courseId: string, sectionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`${API_BASE_URL}/courses/${courseId}/sections/${sectionId}`);
      const updatedCourse = normalizeCourse(response.data.data);
      
      set(state => ({
        currentCourse: updatedCourse,
        courses: state.courses.map(course => 
          course._id === courseId ? updatedCourse : course
        ),
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete section';
      set({ error: errorMessage, isLoading: false });
      console.error('Delete section error:', error);
      throw error;
    }
  },

  // Subsection management
  addSubsection: async (courseId: string, sectionId: string, subsectionData: CreateSubsectionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${API_BASE_URL}/courses/${courseId}/sections/${sectionId}/subsections`, 
        subsectionData
      );
      const updatedCourse = normalizeCourse(response.data.data);
      
      set(state => ({
        currentCourse: updatedCourse,
        courses: state.courses.map(course => 
          course._id === courseId ? updatedCourse : course
        ),
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add subsection';
      set({ error: errorMessage, isLoading: false });
      console.error('Add subsection error:', error);
      throw error;
    }
  },

  updateSubsection: async (courseId: string, sectionId: string, subsectionId: string, data: Partial<CreateSubsectionData>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(
        `${API_BASE_URL}/courses/${courseId}/sections/${sectionId}/subsections/${subsectionId}`, 
        data
      );
      const updatedCourse = normalizeCourse(response.data.data);
      
      set(state => ({
        currentCourse: updatedCourse,
        courses: state.courses.map(course => 
          course._id === courseId ? updatedCourse : course
        ),
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update subsection';
      set({ error: errorMessage, isLoading: false });
      console.error('Update subsection error:', error);
      throw error;
    }
  },

  deleteSubsection: async (courseId: string, sectionId: string, subsectionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/courses/${courseId}/sections/${sectionId}/subsections/${subsectionId}`
      );
      const updatedCourse = normalizeCourse(response.data.data);
      
      set(state => ({
        currentCourse: updatedCourse,
        courses: state.courses.map(course => 
          course._id === courseId ? updatedCourse : course
        ),
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete subsection';
      set({ error: errorMessage, isLoading: false });
      console.error('Delete subsection error:', error);
      throw error;
    }
  },
}));