import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Book, FileText, Video, MessageCircle, PlusCircle, Copy, Check, Edit, Trash } from 'lucide-react';

import Button from '../../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore, Section, Subsection } from '../../stores/courseStore';
import { formatDate } from '../../lib/utils';

const CourseDetailsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const { currentCourse, fetchCourseById, isLoading, updateCourse } = useCourseStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (courseId) {
      fetchCourseById(courseId);
    }
  }, [courseId, fetchCourseById]);
  
  useEffect(() => {
    if (currentCourse?.sections.length) {
      if (!activeSection) {
        setActiveSection(currentCourse.sections[0].id);
        if (currentCourse.sections[0].subsections.length) {
          setActiveSubsection(currentCourse.sections[0].subsections[0].id);
        }
      }
    }
  }, [currentCourse, activeSection]);
  
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
  const isOwner = isFaculty && currentCourse?.createdBy.id === user?.id;
  
  // Copy access code to clipboard
  const copyAccessCode = () => {
    if (currentCourse?.accessCode) {
      navigator.clipboard.writeText(currentCourse.accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Regenerate access code
  const regenerateAccessCode = async () => {
    if (currentCourse && isFaculty) {
      const newCode = `CODE-${Math.floor(1000 + Math.random() * 9000)}`;
      await updateCourse(currentCourse.id, { accessCode: newCode });
    }
  };
  
  const activeSubsectionContent = currentCourse?.sections
    .find(section => section.id === activeSection)
    ?.subsections.find(subsection => subsection.id === activeSubsection);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!currentCourse) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Course not found</h2>
        <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have access to it.</p>
        <Button as={Link} to="/courses">Back to Courses</Button>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      {/* Course Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
        {currentCourse.coverImageUrl && (
          <div className="aspect-[3/1] w-full overflow-hidden">
            <img 
              src={currentCourse.coverImageUrl} 
              alt={currentCourse.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentCourse.title}</h1>
              <p className="text-gray-600">{currentCourse.description}</p>
              
              <div className="flex items-center mt-4 text-sm text-gray-500">
                <span className="mr-4">Created by: {currentCourse.createdBy.name}</span>
                <span>Last updated: {formatDate(currentCourse.updatedAt)}</span>
              </div>
            </div>
            
            {isFaculty && (
              <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                <div className="flex items-center mb-2">
                  <span className="text-sm text-gray-600 mr-2">Access Code:</span>
                  <div className="bg-gray-100 rounded-md px-3 py-1 font-mono text-sm flex items-center">
                    {currentCourse.accessCode}
                    <button
                      onClick={copyAccessCode}
                      className="ml-2 text-gray-500 hover:text-primary-600 focus:outline-none"
                      title="Copy access code"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regenerateAccessCode}
                >
                  Regenerate Code
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Course Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Course Content</h3>
              {isFaculty && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<PlusCircle className="h-4 w-4" />}
                >
                  Add Section
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {currentCourse.sections.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {currentCourse.sections.map((section) => (
                    <div key={section.id} className="py-2">
                      <button
                        className="w-full text-left px-6 py-2 flex justify-between items-center hover:bg-gray-50"
                        onClick={() => setActiveSection(section.id)}
                      >
                        <span className="font-medium">{section.title}</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`} />
                      </button>
                      
                      {activeSection === section.id && (
                        <div className="pl-6 pr-2">
                          {section.subsections.map((subsection) => (
                            <button
                              key={subsection.id}
                              className={`w-full text-left px-4 py-2 text-sm rounded-md flex items-center ${activeSubsection === subsection.id ? 'bg-primary-50 text-primary-800' : 'hover:bg-gray-50'}`}
                              onClick={() => setActiveSubsection(subsection.id)}
                            >
                              {subsection.contentType === 'text' && <FileText className="h-4 w-4 mr-2" />}
                              {subsection.contentType === 'video' && <Video className="h-4 w-4 mr-2" />}
                              {subsection.contentType === 'quiz' && <MessageCircle className="h-4 w-4 mr-2" />}
                              {subsection.contentType === 'file' && <FileText className="h-4 w-4 mr-2" />}
                              <span>{subsection.title}</span>
                            </button>
                          ))}
                          
                          {isFaculty && (
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-primary-600 flex items-center">
                              <PlusCircle className="h-4 w-4 mr-2" />
                              <span>Add Subsection</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 px-4">
                  <Book className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No content available yet</p>
                  {isFaculty && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      icon={<PlusCircle className="h-4 w-4" />}
                    >
                      Add First Section
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Enrolled Students Card */}
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-medium">Enrolled Students</h3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="bg-primary-100 rounded-full h-10 w-10 flex items-center justify-center text-primary-800 font-medium">
                  {currentCourse.enrolledStudents}
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">Students enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeSubsectionContent ? (
            <Card className="animate-fade-in">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{activeSubsectionContent.title}</h2>
                {isFaculty && (
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="h-4 w-4" />}
                      className="text-gray-600"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash className="h-4 w-4" />}
                      className="text-error-600"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {activeSubsectionContent.contentType === 'text' && (
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: activeSubsectionContent.content }}
                  />
                )}
                {activeSubsectionContent.contentType === 'video' && activeSubsectionContent.videoUrl && (
                  <div className="aspect-video">
                    <iframe
                      className="w-full h-full rounded-md"
                      src={activeSubsectionContent.videoUrl}
                      title={activeSubsectionContent.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
                {activeSubsectionContent.contentType === 'file' && activeSubsectionContent.fileUrl && (
                  <div className="border border-gray-200 rounded-md p-4 flex items-center">
                    <FileText className="h-10 w-10 text-gray-400" />
                    <div className="ml-4">
                      <p className="font-medium">{activeSubsectionContent.title}</p>
                      <a
                        href={activeSubsectionContent.fileUrl}
                        download
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Download file
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentCourse.sections.length === 0 
                    ? "This course doesn't have any content yet" 
                    : "Select a topic from the sidebar"}
                </h3>
                <p className="text-gray-500">
                  {currentCourse.sections.length === 0 
                    ? "The instructor hasn't added any materials to this course yet."
                    : "Choose a section and topic to start learning"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsPage;