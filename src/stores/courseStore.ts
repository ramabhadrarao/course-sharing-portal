import { create } from 'zustand';
import axios from 'axios';

// Types
export interface Section {
  _id: string;
  title: string;
  order: number;
  subsections: Subsection[];
}

export interface Subsection {
  _id: string;
  title: string;
  content: string;
  contentType: 'text' | 'video' | 'file' | 'quiz';
  order: number;
  fileUrl?: string;
  videoUrl?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  slug: string;
  accessCode: string;
  coverImage?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  enrolledStudents: string[]; // Array of user IDs
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  
  fetchCourses: () => Promise<void>;
  fetchCourseById: (id: string) => Promise<void>;
  createCourse: (courseData: CreateCourseData) => Promise<Course>;
  updateCourse: (id: string, courseData: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  joinCourse: (accessCode: string) => Promise<void>;
  
  // Section management
  addSection: (courseId: string, section: CreateSectionData) => Promise<void>;
  updateSection: (courseId: string, sectionId: string, data: Partial<Section>) => Promise<void>;
  deleteSection: (courseId: string, sectionId: string) => Promise<void>;
  
  // Subsection management
  addSubsection: (courseId: string, sectionId: string, subsection: CreateSubsectionData) => Promise<void>;
  updateSubsection: (courseId: string, sectionId: string, subsectionId: string, data: Partial<Subsection>) => Promise<void>;
  deleteSubsection: (courseId: string, sectionId: string, subsectionId: string) => Promise<void>;
}

interface CreateCourseData {
  title: string;
  description: string;
  accessCode: string;
  coverImage?: string;
}

interface CreateSectionData {
  title: string;
  order: number;
}

interface CreateSubsectionData {
  title: string;
  content: string;
  contentType: 'text' | 'video' | 'file' | 'quiz';
  order: number;
  fileUrl?: string;
  videoUrl?: string;
}

// Set base URL for API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  currentCourse: null,
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/courses`);
      const courses = response.data.data.map((course: any) => ({
        ...course,
        id: course._id, // Add id field for compatibility
        enrolledStudents: course.enrolledStudents.length, // Convert to count for display
        coverImageUrl: course.coverImage
      }));
      
      set({ courses, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch courses';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchCourseById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/${id}`);
      const course = {
        ...response.data.data,
        id: response.data.data._id,
        enrolledStudents: response.data.data.enrolledStudents.length,
        coverImageUrl: response.data.data.coverImage
      };
      
      set({ currentCourse: course, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch course';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createCourse: async (courseData: CreateCourseData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/courses`, courseData);
      const newCourse = {
        ...response.data.data,
        id: response.data.data._id,
        enrolledStudents: 0,
        coverImageUrl: response.data.data.coverImage
      };
      
      set(state => ({ 
        courses: [...state.courses, newCourse],
        currentCourse: newCourse,
        isLoading: false 
      }));
      
      return newCourse;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create course';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateCourse: async (id: string, courseData: Partial<Course>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_BASE_URL}/courses/${id}`, courseData);
      const updatedCourse = {
        ...response.data.data,
        id: response.data.data._id,
        enrolledStudents: response.data.data.enrolledStudents.length,
        coverImageUrl: response.data.data.coverImage
      };
      
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
      throw error;
    }
  },

  joinCourse: async (accessCode: string) => {
    set({ isLoading: true, error: null });
    try {
      // Find course by access code first
      const coursesResponse = await axios.get(`${API_BASE_URL}/courses`);
      const course = coursesResponse.data.data.find((c: any) => c.accessCode === accessCode);
      
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
      throw error;
    }
  },

  // Section management
  addSection: async (courseId: string, sectionData: CreateSectionData) => {
    set({ isLoading: true, error: null });
    try {
      // In a real implementation, you would have a separate endpoint for sections
      // For now, we'll update the course directly
      const response = await axios.put(`${API_BASE_URL}/courses/${courseId}`, {
        $push: { sections: sectionData }
      });
      
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add section';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateSection: async (courseId: string, sectionId: string, data: Partial<Section>) => {
    set({ isLoading: true, error: null });
    try {
      // Implementation would depend on your API structure
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update section';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteSection: async (courseId: string, sectionId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Implementation would depend on your API structure
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete section';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Subsection management
  addSubsection: async (courseId: string, sectionId: string, subsectionData: CreateSubsectionData) => {
    set({ isLoading: true, error: null });
    try {
      // Implementation would depend on your API structure
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add subsection';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateSubsection: async (courseId: string, sectionId: string, subsectionId: string, data: Partial<Subsection>) => {
    set({ isLoading: true, error: null });
    try {
      // Implementation would depend on your API structure
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update subsection';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteSubsection: async (courseId: string, sectionId: string, subsectionId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Implementation would depend on your API structure
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete subsection';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));