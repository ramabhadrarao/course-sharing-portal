import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, BookmarkPlus, Edit, Trash, Eye, Users, Calendar, Filter, Grid, List } from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore, Course } from '../../stores/courseStore';
import { formatDate } from '../../lib/utils';

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { courses, fetchCourses, isLoading, joinCourse, deleteCourse, error } = useCourseStore();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
  
  // Available categories and difficulties
  const categories = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'Engineering', 'Business', 'Arts', 'Language', 'Other'
  ];
  
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  
  useEffect(() => {
    fetchCourses({
      search: searchTerm || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined
    });
  }, [fetchCourses, searchTerm, selectedCategory, selectedDifficulty]);
  
  // Filter courses locally for immediate feedback
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });
  
  const handleJoinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    
    setIsJoining(true);
    setJoinError(null);
    
    try {
      await joinCourse(accessCode.trim());
      setAccessCode('');
    } catch (error) {
      setJoinError('Invalid access code. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const handleCreateCourse = () => {
    navigate('/courses/create');
  };

  const handleManageCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSearchTerm('');
  };
  
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
          <p className="text-gray-600 mt-1">
            {isFaculty 
              ? 'Manage and create your courses'
              : 'Browse and join available courses'}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          {isFaculty && (
            <Button
              onClick={handleCreateCourse}
              icon={<PlusCircle className="h-5 w-5" />}
            >
              Create Course
            </Button>
          )}
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search courses, instructors, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-5 w-5 text-gray-400" />}
              fullWidth
            />
          </div>
          
          {/* Join Course (for students) */}
          {!isFaculty && (
            <div className="md:w-80">
              <form onSubmit={handleJoinCourse} className="flex">
                <Input
                  placeholder="Enter course access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
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
          
          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="h-5 w-5" />}
          >
            Filters
          </Button>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Levels</option>
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-error-50 text-error-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {/* Courses Grid/List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              isFaculty={isFaculty}
              currentUserId={user?.id}
              onDelete={(courseId) => setShowDeleteConfirm({ id: courseId, title: course.title })}
              onManage={handleManageCourse}
              onView={handleViewCourse}
              viewMode={viewMode}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all'
                ? "No courses match your search criteria. Try adjusting your filters."
                : isFaculty 
                  ? "You haven't created any courses yet"
                  : "No courses are available"}
            </p>
            {isFaculty && !searchTerm && selectedCategory === 'all' && selectedDifficulty === 'all' && (
              <Button
                onClick={handleCreateCourse}
                icon={<PlusCircle className="h-5 w-5" />}
              >
                Create Your First Course
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Delete Course</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{showDeleteConfirm.title}"? This action cannot be undone and will remove all course content, sections, and student progress.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleDeleteConfirm(showDeleteConfirm.id)}
              >
                Delete Course
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CourseCardProps {
  course: Course;
  isFaculty: boolean;
  currentUserId?: string;
  onDelete: (courseId: string) => void;
  onManage: (courseId: string) => void;
  onView: (courseId: string) => void;
  viewMode: 'grid' | 'list';
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  isFaculty, 
  currentUserId, 
  onDelete, 
  onManage, 
  onView,
  viewMode 
}) => {
  const isOwner = isFaculty && course.createdBy.id === currentUserId;

  const handleMainAction = () => {
    if (isFaculty) {
      onManage(course.id);
    } else {
      onView(course.id);
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="transition-all duration-200 animate-fade-in hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {/* Course Image */}
            <div className="flex-shrink-0">
              {course.coverImage ? (
                <img 
                  src={course.coverImage} 
                  alt={course.title} 
                  className="w-24 h-16 object-cover rounded-md"
                />
              ) : (
                <div className="w-24 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
            </div>
            
            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h3>
                  <p className="text-gray-500 text-sm mb-2 line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {course.enrolledStudentsCount} students
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(course.updatedAt)}
                    </div>
                    <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                      {course.accessCode}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{course.createdBy.name}</span>
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {course.category}
                      </span>
                      <span className="bg-secondary-100 text-secondary-700 text-xs px-2 py-1 rounded">
                        {course.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 ml-4">
                  <Button
                    onClick={handleMainAction}
                    variant="primary"
                    size="sm"
                    icon={<Eye className="h-4 w-4" />}
                  >
                    {isFaculty ? 'Manage' : 'View'}
                  </Button>
                  
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(course.id)}
                      icon={<Trash className="h-4 w-4" />}
                      className="text-error-600 hover:text-error-700"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view (original card design)
  return (
    <Card className="transition-all duration-200 h-full flex flex-col animate-fade-in hover:shadow-lg cursor-pointer"
          onClick={handleMainAction}>
      {course.coverImage && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={course.coverImage} 
            alt={course.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="flex-grow flex flex-col p-6">
        <div className="flex-grow">
          <h3 className="font-semibold text-lg mb-2 text-gray-900">{course.title}</h3>
          <p className="text-gray-500 text-sm mb-4 line-clamp-3">{course.description}</p>
        </div>
        
        <div className="space-y-3">
          {/* Course Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{course.enrolledStudentsCount} students</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(course.updatedAt)}</span>
            </div>
          </div>

          {/* Course Meta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                {course.category}
              </span>
              <span className="bg-secondary-100 text-secondary-700 text-xs px-2 py-1 rounded">
                {course.difficulty}
              </span>
            </div>
            <div className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full font-medium">
              {course.accessCode}
            </div>
          </div>

          {/* Creator Info */}
          <div className="flex items-center">
            <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center text-xs font-medium text-gray-600">
              {course.createdBy.name.charAt(0)}
            </div>
            <span className="ml-2 text-xs text-gray-500">{course.createdBy.name}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              onClick={handleMainAction}
              variant="primary"
              size="sm"
              className="flex-1"
              icon={<Eye className="h-4 w-4" />}
            >
              {isFaculty ? 'Manage' : 'View'}
            </Button>
            
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(course.id)}
                icon={<Trash className="h-4 w-4" />}
                className="text-error-600 hover:text-error-700"
                title="Delete Course"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoursesPage;