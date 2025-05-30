import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, BookOpen, Users, Award, Calendar, Clock, TrendingUp, Shield, Eye } from 'lucide-react';

import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore } from '../../stores/courseStore';
import { formatDate } from '../../lib/utils';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { courses, fetchCourses, isLoading } = useCourseStore();
  
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);
  
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  
  // Helper function to check if user is owner of a course
  const isOwner = (course: any) => {
    return course.createdBy.id === user?.id || course.createdBy._id === user?.id;
  };
  
  // Helper function to check if student is enrolled in a course - FIXED ENROLLMENT DETECTION
  const isEnrolled = (course: any) => {
    if (!course.enrolledStudents) return false;
    
    const currentUserId = user?.id || user?._id;
    if (!currentUserId) return false;
    
    // Handle both string and ObjectId formats
    return course.enrolledStudents.some((studentId: any) => {
      const normalizedStudentId = typeof studentId === 'object' && studentId.toString 
        ? studentId.toString() 
        : studentId;
      
      return normalizedStudentId === currentUserId || 
             normalizedStudentId === currentUserId.toString();
    });
  };
  
  // Get courses based on user role - FIXED LOGIC
  const getDashboardCourses = () => {
    if (isAdmin) {
      // Admin sees ALL courses
      return {
        displayCourses: courses, // All courses for dashboard display
        ownedCourses: courses.filter(course => isOwner(course)),
        enrolledCourses: courses.filter(course => isEnrolled(course) && !isOwner(course)),
        accessibleCourses: courses // Admin can access all content
      };
    } else if (isFaculty) {
      // Faculty sees all courses but with different access levels
      return {
        displayCourses: courses, // All courses for dashboard display
        ownedCourses: courses.filter(course => isOwner(course)),
        enrolledCourses: courses.filter(course => isEnrolled(course) && !isOwner(course)),
        accessibleCourses: courses // Faculty can access all content
      };
    } else {
      // Students see all courses but can only access enrolled ones
      return {
        displayCourses: courses, // All courses for discovery
        ownedCourses: [], // Students don't own courses
        enrolledCourses: courses.filter(course => isEnrolled(course)),
        accessibleCourses: courses.filter(course => isEnrolled(course)) // Only enrolled for content access
      };
    }
  };
  
  const courseData = getDashboardCourses();
  
  // Get recent courses for dashboard display based on user interaction
  const getRecentCourses = () => {
    if (isFaculty) {
      // For faculty/admin, prioritize owned courses, then enrolled, then recently updated
      const ownedCourses = courseData.ownedCourses || [];
      const enrolledCourses = courseData.enrolledCourses || [];
      const otherCourses = (courseData.displayCourses || []).filter(course => 
        !isOwner(course) && !isEnrolled(course)
      );
      
      // Combine and get most recent
      const prioritizedCourses = [
        ...ownedCourses.map(course => ({ ...course, priority: 1 })),
        ...enrolledCourses.map(course => ({ ...course, priority: 2 })),
        ...otherCourses.map(course => ({ ...course, priority: 3 }))
      ];
      
      return prioritizedCourses
        .sort((a, b) => {
          // First sort by priority, then by update date
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
        .slice(0, 3);
    } else {
      // For students, prioritize enrolled courses, then show other available courses
      const enrolledCourses = courseData.enrolledCourses || [];
      const availableCourses = (courseData.displayCourses || []).filter(course => 
        !isEnrolled(course)
      );
      
      const prioritizedCourses = [
        ...enrolledCourses.map(course => ({ ...course, priority: 1 })),
        ...availableCourses.map(course => ({ ...course, priority: 2 }))
      ];
      
      return prioritizedCourses
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
        .slice(0, 3);
    }
  };
  
  const recentCourses = getRecentCourses();

  // Calculate stats based on user role - FIXED CALCULATIONS
  const getStatsForRole = () => {
    if (isAdmin) {
      // Admin sees system-wide statistics
      const totalStudents = (courseData.displayCourses || []).reduce((total, course) => 
        total + (course.enrolledStudentsCount || 0), 0
      );
      const activeCourses = (courseData.displayCourses || []).filter(c => c.isActive).length;
      
      return {
        primaryStat: {
          label: 'Total Courses',
          value: courseData.displayCourses?.length || 0,
          icon: BookOpen,
          color: 'from-primary-500 to-primary-700'
        },
        secondaryStat: {
          label: 'Total Students',
          value: totalStudents,
          icon: Users,
          color: 'from-secondary-500 to-secondary-700'
        },
        tertiaryStat: {
          label: 'Active Courses',
          value: activeCourses,
          icon: TrendingUp,
          color: 'from-accent-500 to-accent-700'
        }
      };
    } else if (isFaculty) {
      // Faculty sees their own + accessible courses
      const ownedCount = courseData.ownedCourses?.length || 0;
      const totalStudents = (courseData.ownedCourses || []).reduce((total, course) => 
        total + (course.enrolledStudentsCount || 0), 0
      );
      const accessibleCount = courseData.accessibleCourses?.length || 0;
      
      return {
        primaryStat: {
          label: 'Courses Created',
          value: ownedCount,
          icon: BookOpen,
          color: 'from-primary-500 to-primary-700'
        },
        secondaryStat: {
          label: 'Your Students',
          value: totalStudents,
          icon: Users,
          color: 'from-secondary-500 to-secondary-700'
        },
        tertiaryStat: {
          label: 'Accessible Courses',
          value: accessibleCount,
          icon: Eye,
          color: 'from-accent-500 to-accent-700'
        }
      };
    } else {
      // Student statistics
      const enrolledCount = courseData.enrolledCourses?.length || 0;
      const totalAvailable = courseData.displayCourses?.length || 0;
      const learningHours = (courseData.enrolledCourses || []).reduce((total, course) => 
        total + (course.estimatedDuration || 0), 0
      );
      
      return {
        primaryStat: {
          label: 'Enrolled Courses',
          value: enrolledCount,
          icon: BookOpen,
          color: 'from-primary-500 to-primary-700'
        },
        secondaryStat: {
          label: 'Available Courses',
          value: totalAvailable,
          icon: Eye,
          color: 'from-secondary-500 to-secondary-700'
        },
        tertiaryStat: {
          label: 'Learning Hours',
          value: learningHours + 'h',
          icon: Clock,
          color: 'from-accent-500 to-accent-700'
        }
      };
    }
  };

  const stats = getStatsForRole();
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <div className="mt-2 flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
              {user?.role}
            </span>
            {isAdmin && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <Shield className="h-3 w-3 mr-1" />
                System Administrator
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          {isFaculty ? (
            <Button
              as={Link}
              to="/courses/create"
              icon={<PlusCircle className="h-5 w-5" />}
            >
              Create New Course
            </Button>
          ) : (
            <Button
              as={Link}
              to="/courses"
              icon={<BookOpen className="h-5 w-5" />}
            >
              Browse Courses
            </Button>
          )}
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className={`bg-gradient-to-br ${stats.primaryStat.color} text-white`}>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <stats.primaryStat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">{stats.primaryStat.label}</p>
              <h3 className="text-2xl font-bold">{stats.primaryStat.value}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br ${stats.secondaryStat.color} text-white`}>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <stats.secondaryStat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">{stats.secondaryStat.label}</p>
              <h3 className="text-2xl font-bold">{stats.secondaryStat.value}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`bg-gradient-to-br ${stats.tertiaryStat.color} text-white`}>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <stats.tertiaryStat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">{stats.tertiaryStat.label}</p>
              <h3 className="text-2xl font-bold">{stats.tertiaryStat.value}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent/Priority Courses */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isFaculty ? 'Your Priority Courses' : 'Your Learning Dashboard'}
          </h2>
          <Link to="/courses" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all courses
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : recentCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentCourses.map((course) => {
              const userIsOwner = isOwner(course);
              const userIsEnrolled = isEnrolled(course);
              const canAccessContent = isFaculty || userIsEnrolled;
              
              return (
                <Card 
                  key={course.id || course._id} 
                  as={Link} 
                  to={`/courses/${course.id || course._id}`}
                  hover
                  className="transition-all duration-200 animate-fade-in"
                >
                  {course.coverImage && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={course.coverImage} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 flex-1">
                        {course.title}
                      </h3>
                      <div className="flex flex-col space-y-1 ml-2">
                        {userIsOwner && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700 font-medium">
                            Owner
                          </span>
                        )}
                        {!userIsOwner && canAccessContent && (
                          <span className="text-xs px-2 py-1 rounded-full bg-success-100 text-success-700 font-medium">
                            {isFaculty ? 'Access' : 'Enrolled'}
                          </span>
                        )}
                        {!canAccessContent && (
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                            Join Required
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {course.shortDescription || course.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {course.category}
                        </span>
                        <span className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded">
                          {course.difficulty}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {course.enrolledStudentsCount || 0} students
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(course.updatedAt)}
                      </div>
                    </div>
                    
                    {/* Show access code only to course owners */}
                    {userIsOwner && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">Access Code:</span>
                          <span className="text-xs font-mono bg-primary-100 text-primary-800 px-2 py-1 rounded">
                            {course.accessCode}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isFaculty ? 'No courses created yet' : 'No courses enrolled yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {isFaculty 
                  ? "Start by creating your first course to share knowledge with students." 
                  : "Join courses using access codes provided by your instructors."}
              </p>
              {isFaculty ? (
                <Button
                  as={Link}
                  to="/courses/create"
                  icon={<PlusCircle className="h-5 w-5" />}
                >
                  Create Your First Course
                </Button>
              ) : (
                <Button
                  as={Link}
                  to="/courses"
                  icon={<BookOpen className="h-5 w-5" />}
                >
                  Browse Available Courses
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Activity Feed */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="divide-y divide-gray-200">
            {(courseData.displayCourses?.length || 0) > 0 ? (
              <>
                <div className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-primary-100 rounded-full p-2">
                      <BookOpen className="h-5 w-5 text-primary-700" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {isFaculty ? "Course management activity" : "Learning progress"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {isFaculty 
                          ? isAdmin 
                            ? `System has ${courseData.displayCourses?.length || 0} total courses`
                            : `Created ${courseData.ownedCourses?.length || 0} courses, accessing ${courseData.accessibleCourses?.length || 0} total`
                          : `Enrolled in ${courseData.enrolledCourses?.length || 0} of ${courseData.displayCourses?.length || 0} available courses`
                        }
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Today</p>
                    </div>
                  </div>
                </div>
                
                {recentCourses.length > 0 && (
                  <div className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-secondary-100 rounded-full p-2">
                        <Award className="h-5 w-5 text-secondary-700" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {isFaculty ? "Recent course activity" : "Continue learning"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {recentCourses[0].title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(recentCourses[0].updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="text-gray-400 mb-2">
                  <TrendingUp className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-sm text-gray-500">
                  {isFaculty 
                    ? "Your course activity will appear here once you create courses."
                    : "Your learning activity will appear here once you join courses."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;