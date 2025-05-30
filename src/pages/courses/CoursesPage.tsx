import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, BookmarkPlus } from 'lucide-react';

import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore, Course } from '../../stores/courseStore';
import { formatDate } from '../../lib/utils';

const CoursesPage: React.FC = () => {
  const { user } = useAuthStore();
  const { courses, fetchCourses, isLoading, joinCourse, error } = useCourseStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);
  
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
  
  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleJoinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode) return;
    
    setIsJoining(true);
    setJoinError(null);
    
    try {
      await joinCourse(accessCode);
      setAccessCode('');
    } catch (error) {
      setJoinError('Invalid access code. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
          <p className="text-gray-600 mt-1">
            {isFaculty 
              ? 'Manage and create your courses'
              : 'Browse and join available courses'}
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
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="md:flex-1">
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-5 w-5 text-gray-400" />}
            fullWidth
          />
        </div>
        
        {!isFaculty && (
          <div className="md:w-1/3">
            <form onSubmit={handleJoinCourse} className="flex">
              <Input
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                error={joinError || undefined}
                className="rounded-r-none"
              />
              <Button
                type="submit"
                className="rounded-l-none"
                isLoading={isJoining}
                icon={<BookmarkPlus className="h-5 w-5" />}
              >
                Join
              </Button>
            </form>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? "No courses match your search criteria"
                : isFaculty 
                  ? "You haven't created any courses yet"
                  : "No courses are available"}
            </p>
            {isFaculty && !searchTerm && (
              <Button
                as={Link}
                to="/courses/create"
                icon={<PlusCircle className="h-5 w-5" />}
              >
                Create Your First Course
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Card 
      as={Link} 
      to={`/courses/${course.id}`}
      hover
      className="transition-all duration-200 h-full flex flex-col animate-fade-in"
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
      <CardContent className="flex-grow flex flex-col">
        <h3 className="font-semibold text-lg mb-2 text-gray-900">{course.title}</h3>
        <p className="text-gray-500 text-sm mb-4 flex-grow">{course.description}</p>
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center">
            <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center text-xs font-medium text-gray-600">
              {course.createdBy.name.charAt(0)}
            </div>
            <span className="ml-2 text-xs text-gray-500">{course.createdBy.name}</span>
          </div>
          <div className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
            {course.enrolledStudents} students
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
          Last updated: {formatDate(course.updatedAt)}
        </div>
      </CardContent>
    </Card>
  );
};

export default CoursesPage;