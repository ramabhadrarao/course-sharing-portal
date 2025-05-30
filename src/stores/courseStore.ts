import { create } from 'zustand';
import axios from 'axios';

// Types
export interface Section {
  _id: string;
  id: string;
  title: string;
  order: number;
  subsections: Subsection[];
}

export interface Subsection {
  _id: string;
  id: string;
  title: string;
  content: string;
  contentType: 'text' | 'video' | 'file' | 'quiz';
  order: number;
  fileUrl?: string;
  videoUrl?: string;
}

export interface Course {
  _id: string;
  id: string;
  title: string;
  description: string;
  slug: string;
  accessCode: string;
  coverImage?: string;
  coverImageUrl?: string;
  createdBy: {
    _id: string;
    id: string;
    name: string;
    email: string;
  };
  enrolledStudents: any[];
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  
  // Course CRUD operations
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

  // Utility functions
  clearError: () => void;
  clearCurrentCourse: () => void;
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

// Helper function to normalize course data
const normalizeCourse = (course: any): Course => ({
  ...course,
  id: course._id,
  coverImageUrl: course.coverImage,
  createdBy: {
    ...course.createdBy,
    id: course.createdBy._id
  },
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

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/courses`);
      const courses = response.data.data.map((course: any) => ({
        ...normalizeCourse(course),
        enrolledStudents: Array.isArray(course.enrolledStudents) 
          ? course.enrolledStudents.length 
          : course.enrolledStudents || 0
      }));
      
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
      const course = {
        ...normalizeCourse(response.data.data),
        enrolledStudents: Array.isArray(response.data.data.enrolledStudents)
          ? response.data.data.enrolledStudents.length
          : response.data.data.enrolledStudents || 0
      };
      
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
      const payload = {
        ...courseData,
        coverImage: courseData.coverImage || undefined
      };

      const response = await axios.post(`${API_BASE_URL}/courses`, payload);
      const newCourse = {
        ...normalizeCourse(response.data.data),
        enrolledStudents: 0
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
      console.error('Create course error:', error);
      throw error;
    }
  },

  updateCourse: async (id: string, courseData: Partial<Course>) => {
    set({ isLoading: true, error: null });
    try {
      // Clean the data before sending
      const payload = {
        title: courseData.title,
        description: courseData.description,
        accessCode: courseData.accessCode,
        coverImage: courseData.coverImage || courseData.coverImageUrl
      };

      const response = await axios.put(`${API_BASE_URL}/courses/${id}`, payload);
      const updatedCourse = {
        ...normalizeCourse(response.data.data),
        enrolledStudents: Array.isArray(response.data.data.enrolledStudents)
          ? response.data.data.enrolledStudents.length
          : response.data.data.enrolledStudents || 0
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
      console.error('Join course error:', error);
      throw error;
    }
  },

  // Section management
  addSection: async (courseId: string, sectionData: CreateSectionData) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCourse } = get();
      if (!currentCourse) throw new Error('No current course loaded');

      const newSection = {
        ...sectionData,
        _id: `temp_${Date.now()}`,
        id: `temp_${Date.now()}`,
        subsections: []
      };

      const updatedSections = [...currentCourse.sections, newSection];
      
      await get().updateCourse(courseId, { 
        sections: updatedSections 
      });
      
      // Refresh the current course
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add section';
      set({ error: errorMessage, isLoading: false });
      console.error('Add section error:', error);
      throw error;
    }
  },

  updateSection: async (courseId: string, sectionId: string, data: Partial<Section>) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCourse } = get();
      if (!currentCourse) throw new Error('No current course loaded');

      const updatedSections = currentCourse.sections.map(section =>
        section._id === sectionId || section.id === sectionId
          ? { ...section, ...data }
          : section
      );

      await get().updateCourse(courseId, { 
        sections: updatedSections 
      });
      
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
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
      const { currentCourse } = get();
      if (!currentCourse) throw new Error('No current course loaded');

      const updatedSections = currentCourse.sections.filter(section => 
        section._id !== sectionId && section.id !== sectionId
      );

      await get().updateCourse(courseId, { 
        sections: updatedSections 
      });
      
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
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
      const { currentCourse } = get();
      if (!currentCourse) throw new Error('No current course loaded');

      const newSubsection = {
        ...subsectionData,
        _id: `temp_${Date.now()}`,
        id: `temp_${Date.now()}`
      };

      const updatedSections = currentCourse.sections.map(section => {
        if (section._id === sectionId || section.id === sectionId) {
          return {
            ...section,
            subsections: [...section.subsections, newSubsection]
          };
        }
        return section;
      });

      await get().updateCourse(courseId, { 
        sections: updatedSections 
      });
      
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add subsection';
      set({ error: errorMessage, isLoading: false });
      console.error('Add subsection error:', error);
      throw error;
    }
  },

  updateSubsection: async (courseId: string, sectionId: string, subsectionId: string, data: Partial<Subsection>) => {
    set({ isLoading: true, error: null });
    try {
      const { currentCourse } = get();
      if (!currentCourse) throw new Error('No current course loaded');

      const updatedSections = currentCourse.sections.map(section => {
        if (section._id === sectionId || section.id === sectionId) {
          return {
            ...section,
            subsections: section.subsections.map(subsection =>
              subsection._id === subsectionId || subsection.id === subsectionId
                ? { ...subsection, ...data }
                : subsection
            )
          };
        }
        return section;
      });

      await get().updateCourse(courseId, { 
        sections: updatedSections 
      });
      
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
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
      const { currentCourse } = get();
      if (!currentCourse) throw new Error('No current course loaded');

      const updatedSections = currentCourse.sections.map(section => {
        if (section._id === sectionId || section.id === sectionId) {
          return {
            ...section,
            subsections: section.subsections.filter(subsection =>
              subsection._id !== subsectionId && subsection.id !== subsectionId
            )
          };
        }
        return section;
      });

      await get().updateCourse(courseId, { 
        sections: updatedSections 
      });
      
      await get().fetchCourseById(courseId);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete subsection';
      set({ error: errorMessage, isLoading: false });
      console.error('Delete subsection error:', error);
      throw error;
    }
  },
}));