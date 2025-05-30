import { create } from 'zustand';

// Types
export interface Section {
  id: string;
  title: string;
  order: number;
  subsections: Subsection[];
}

export interface Subsection {
  id: string;
  title: string;
  content: string;
  contentType: 'text' | 'video' | 'file' | 'quiz';
  order: number;
  fileUrl?: string;
  videoUrl?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  courseId: string;
  subsectionId: string;
}

export interface Question {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  type: 'single' | 'multiple';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  accessCode: string;
  createdBy: {
    id: string;
    name: string;
  };
  enrolledStudents: number;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
  coverImageUrl?: string;
}

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  
  fetchCourses: () => Promise<void>;
  fetchCourseById: (id: string) => Promise<void>;
  createCourse: (courseData: Partial<Course>) => Promise<Course>;
  updateCourse: (id: string, courseData: Partial<Course>) => Promise<void>;
  joinCourse: (accessCode: string) => Promise<void>;
  
  // Section management
  addSection: (courseId: string, section: Partial<Section>) => Promise<void>;
  updateSection: (courseId: string, sectionId: string, data: Partial<Section>) => Promise<void>;
  deleteSection: (courseId: string, sectionId: string) => Promise<void>;
  
  // Subsection management
  addSubsection: (courseId: string, sectionId: string, subsection: Partial<Subsection>) => Promise<void>;
  updateSubsection: (courseId: string, sectionId: string, subsectionId: string, data: Partial<Subsection>) => Promise<void>;
  deleteSubsection: (courseId: string, sectionId: string, subsectionId: string) => Promise<void>;
}

// Mock data
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Computer Science',
    description: 'Learn the fundamentals of computer science and programming.',
    accessCode: 'CS101',
    createdBy: {
      id: 'faculty-123',
      name: 'Prof. Johnson'
    },
    enrolledStudents: 45,
    sections: [
      {
        id: 's1',
        title: 'Getting Started with Programming',
        order: 1,
        subsections: [
          {
            id: 'ss1',
            title: 'What is Programming?',
            content: '<p>Programming is the process of creating a set of instructions that tell a computer how to perform a task.</p>',
            contentType: 'text',
            order: 1
          },
          {
            id: 'ss2',
            title: 'Introduction to Algorithms',
            content: '<p>An algorithm is a step-by-step procedure for solving a problem or accomplishing a task.</p>',
            contentType: 'text',
            order: 2
          }
        ]
      },
      {
        id: 's2',
        title: 'Basic Programming Concepts',
        order: 2,
        subsections: [
          {
            id: 'ss3',
            title: 'Variables and Data Types',
            content: '<p>Variables are used to store information to be referenced and manipulated in a computer program.</p>',
            contentType: 'text',
            order: 1
          }
        ]
      }
    ],
    createdAt: '2023-01-15T12:00:00Z',
    updatedAt: '2023-01-15T12:00:00Z',
    coverImageUrl: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: '2',
    title: 'Advanced Web Development',
    description: 'Master modern web development techniques and frameworks.',
    accessCode: 'WEB102',
    createdBy: {
      id: 'faculty-456',
      name: 'Dr. Smith'
    },
    enrolledStudents: 32,
    sections: [],
    createdAt: '2023-02-10T09:30:00Z',
    updatedAt: '2023-02-10T09:30:00Z',
    coverImageUrl: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: '3',
    title: 'Data Science Fundamentals',
    description: 'Introduction to data analysis, visualization, and machine learning concepts.',
    accessCode: 'DATA101',
    createdBy: {
      id: 'faculty-789',
      name: 'Prof. Williams'
    },
    enrolledStudents: 58,
    sections: [],
    createdAt: '2023-03-05T14:15:00Z',
    updatedAt: '2023-03-05T14:15:00Z',
    coverImageUrl: 'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  }
];

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  currentCourse: null,
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ courses: mockCourses, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch courses', isLoading: false });
    }
  },

  fetchCourseById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const course = mockCourses.find(c => c.id === id) || null;
      set({ currentCourse: course, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch course', isLoading: false });
    }
  },

  createCourse: async (courseData: Partial<Course>) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a new course with mock data
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        title: courseData.title || 'Untitled Course',
        description: courseData.description || '',
        accessCode: courseData.accessCode || `CODE-${Math.floor(1000 + Math.random() * 9000)}`,
        createdBy: {
          id: 'faculty-123',
          name: 'Faculty User'
        },
        enrolledStudents: 0,
        sections: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        coverImageUrl: courseData.coverImageUrl
      };
      
      // Update store
      set(state => ({ 
        courses: [...state.courses, newCourse],
        currentCourse: newCourse,
        isLoading: false 
      }));
      
      return newCourse;
    } catch (error) {
      set({ error: 'Failed to create course', isLoading: false });
      throw error;
    }
  },

  updateCourse: async (id: string, courseData: Partial<Course>) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(state => {
        const updatedCourses = state.courses.map(course => 
          course.id === id ? { ...course, ...courseData, updatedAt: new Date().toISOString() } : course
        );
        
        const updatedCurrentCourse = state.currentCourse && state.currentCourse.id === id
          ? { ...state.currentCourse, ...courseData, updatedAt: new Date().toISOString() }
          : state.currentCourse;
        
        return { 
          courses: updatedCourses, 
          currentCourse: updatedCurrentCourse,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: 'Failed to update course', isLoading: false });
    }
  },

  joinCourse: async (accessCode: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const course = mockCourses.find(c => c.accessCode === accessCode);
      if (!course) {
        throw new Error('Invalid access code');
      }
      
      set({ isLoading: false });
      return;
    } catch (error) {
      set({ error: 'Failed to join course. Invalid access code.', isLoading: false });
      throw error;
    }
  },

  // Section management
  addSection: async (courseId: string, sectionData: Partial<Section>) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSection: Section = {
        id: `section-${Date.now()}`,
        title: sectionData.title || 'New Section',
        order: sectionData.order || 1,
        subsections: [],
      };
      
      set(state => {
        const updatedCourses = state.courses.map(course => {
          if (course.id === courseId) {
            return {
              ...course,
              sections: [...course.sections, newSection],
              updatedAt: new Date().toISOString()
            };
          }
          return course;
        });
        
        const updatedCurrentCourse = state.currentCourse && state.currentCourse.id === courseId
          ? {
              ...state.currentCourse,
              sections: [...state.currentCourse.sections, newSection],
              updatedAt: new Date().toISOString()
            }
          : state.currentCourse;
        
        return { 
          courses: updatedCourses, 
          currentCourse: updatedCurrentCourse,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: 'Failed to add section', isLoading: false });
    }
  },

  updateSection: async (courseId: string, sectionId: string, data: Partial<Section>) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(state => {
        const updatedCourses = state.courses.map(course => {
          if (course.id === courseId) {
            return {
              ...course,
              sections: course.sections.map(section => 
                section.id === sectionId ? { ...section, ...data } : section
              ),
              updatedAt: new Date().toISOString()
            };
          }
          return course;
        });
        
        const updatedCurrentCourse = state.currentCourse && state.currentCourse.id === courseId
          ? {
              ...state.currentCourse,
              sections: state.currentCourse.sections.map(section => 
                section.id === sectionId ? { ...section, ...data } : section
              ),
              updatedAt: new Date().toISOString()
            }
          : state.currentCourse;
        
        return { 
          courses: updatedCourses, 
          currentCourse: updatedCurrentCourse,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: 'Failed to update section', isLoading: false });
    }
  },

  deleteSection: async (courseId: string, sectionId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(state => {
        const updatedCourses = state.courses.map(course => {
          if (course.id === courseId) {
            return {
              ...course,
              sections: course.sections.filter(section => section.id !== sectionId),
              updatedAt: new Date().toISOString()
            };
          }
          return course;
        });
        
        const updatedCurrentCourse = state.currentCourse && state.currentCourse.id === courseId
          ? {
              ...state.currentCourse,
              sections: state.currentCourse.sections.filter(section => section.id !== sectionId),
              updatedAt: new Date().toISOString()
            }
          : state.currentCourse;
        
        return { 
          courses: updatedCourses, 
          currentCourse: updatedCurrentCourse,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: 'Failed to delete section', isLoading: false });
    }
  },

  // Subsection management
  addSubsection: async (courseId: string, sectionId: string, subsectionData: Partial<Subsection>) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSubsection: Subsection = {
        id: `subsection-${Date.now()}`,
        title: subsectionData.title || 'New Subsection',
        content: subsectionData.content || '',
        contentType: subsectionData.contentType || 'text',
        order: subsectionData.order || 1,
        fileUrl: subsectionData.fileUrl,
        videoUrl: subsectionData.videoUrl,
      };
      
      set(state => {
        const updatedCourses = state.courses.map(course => {
          if (course.id === courseId) {
            return {
              ...course,
              sections: course.sections.map(section => {
                if (section.id === sectionId) {
                  return {
                    ...section,
                    subsections: [...section.subsections, newSubsection]
                  };
                }
                return section;
              }),
              updatedAt: new Date().toISOString()
            };
          }
          return course;
        });
        
        const updatedCurrentCourse = state.currentCourse && state.currentCourse.id === courseId
          ? {
              ...state.currentCourse,
              sections: state.currentCourse.sections.map(section => {
                if (section.id === sectionId) {
                  return {
                    ...section,
                    subsections: [...section.subsections, newSubsection]
                  };
                }
                return section;
              }),
              updatedAt: new Date().toISOString()
            }
          : state.currentCourse;
        
        return { 
          courses: updatedCourses, 
          currentCourse: updatedCurrentCourse,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: 'Failed to add subsection', isLoading: false });
    }
  },

  updateSubsection: async (courseId: string, sectionId: string, subsectionId: string, data: Partial<Subsection>) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(state => {
        const updatedCourses = state.courses.map(course => {
          if (course.id === courseId) {
            return {
              ...course,
              sections: course.sections.map(section => {
                if (section.id === sectionId) {
                  return {
                    ...section,
                    subsections: section.subsections.map(subsection => 
                      subsection.id === subsectionId ? { ...subsection, ...data } : subsection
                    )
                  };
                }
                return section;
              }),
              updatedAt: new Date().toISOString()
            };
          }
          return course;
        });
        
        const updatedCurrentCourse = state.currentCourse && state.currentCourse.id === courseId
          ? {
              ...state.currentCourse,
              sections: state.currentCourse.sections.map(section => {
                if (section.id === sectionId) {
                  return {
                    ...section,
                    subsections: section.subsections.map(subsection => 
                      subsection.id === subsectionId ? { ...subsection, ...data } : subsection
                    )
                  };
                }
                return section;
              }),
              updatedAt: new Date().toISOString()
            }
          : state.currentCourse;
        
        return { 
          courses: updatedCourses, 
          currentCourse: updatedCurrentCourse,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: 'Failed to update subsection', isLoading: false });
    }
  },

  deleteSubsection: async (courseId: string, sectionId: string, subsectionId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(state => {
        const updatedCourses = state.courses.map(course => {
          if (course.id === courseId) {
            return {
              ...course,
              sections: course.sections.map(section => {
                if (section.id === sectionId) {
                  return {
                    ...section,
                    subsections: section.subsections.filter(subsection => subsection.id !== subsectionId)
                  };
                }
                return section;
              }),
              updatedAt: new Date().toISOString()
            };
          }
          return course;
        });
        
        const updatedCurrentCourse = state.currentCourse && state.currentCourse.id === courseId
          ? {
              ...state.currentCourse,
              sections: state.currentCourse.sections.map(section => {
                if (section.id === sectionId) {
                  return {
                    ...section,
                    subsections: section.subsections.filter(subsection => subsection.id !== subsectionId)
                  };
                }
                return section;
              }),
              updatedAt: new Date().toISOString()
            }
          : state.currentCourse;
        
        return { 
          courses: updatedCourses, 
          currentCourse: updatedCurrentCourse,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: 'Failed to delete subsection', isLoading: false });
    }
  },
}));