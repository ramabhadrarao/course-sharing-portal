import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, BookOpen, Users, Award } from 'lucide-react';

import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
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
  
  // Get recent courses (last 3)
  const recentCourses = [...courses].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 3);
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {isFaculty && (
          <div className="mt-4 md:mt-0">
            <Button
              as={Link}
              to="/courses/create"
              icon={<PlusCircle className="h-5 w-5" />}
            >
              Create New Course
            </Button>
          </div>
        )}
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Total Courses</p>
              <h3 className="text-2xl font-bold">{courses.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-secondary-500 to-secondary-700 text-white">
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">
                {isFaculty ? 'Total Students' : 'Enrolled Courses'}
              </p>
              <h3 className="text-2xl font-bold">
                {isFaculty 
                  ? courses.reduce((total, course) => total + course.enrolledStudents, 0)
                  : courses.length}
              </h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent-500 to-accent-700 text-white">
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-white/20 p-3 mr-4">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Learning Hours</p>
              <h3 className="text-2xl font-bold">24h</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent courses */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Courses</h2>
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
            {recentCourses.map((course) => (
              <Card 
                key={course.id} 
                as={Link} 
                to={`/courses/${course.id}`}
                hover
                className="transition-all duration-200 animate-fade-in"
              >
                {course.coverImageUrl && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={course.coverImageUrl} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">{course.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">{course.description}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{course.createdBy.name}</span>
                    <span>{formatDate(course.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-6">
                {isFaculty 
                  ? "You haven't created any courses yet." 
                  : "You haven't joined any courses yet."}
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
                  Browse Courses
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
            <div className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary-100 rounded-full p-2">
                  <BookOpen className="h-5 w-5 text-primary-700" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {isFaculty ? "You created a new course" : "You joined a new course"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isFaculty ? "Introduction to Computer Science" : "Introduction to Computer Science"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                </div>
              </div>
            </div>
            <div className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-secondary-100 rounded-full p-2">
                  <Award className="h-5 w-5 text-secondary-700" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {isFaculty ? "A student completed a quiz" : "You completed a quiz"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Programming Fundamentals Quiz: 95%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">5 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;