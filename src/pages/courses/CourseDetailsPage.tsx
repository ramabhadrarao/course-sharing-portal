import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash, Plus, Settings, Users, Calendar, 
  Play, FileText, Video, Upload, ExternalLink, ChevronDown, 
  ChevronRight, Clock, BookOpen, AlertCircle, Save, X, 
  Image as ImageIcon, Link2, Code, Type, Eye, EyeOff, MessageCircle
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import RichTextEditor from '../../components/ui/RichTextEditor';
import FileUpload from '../../components/ui/FileUpload';
import CourseQuizzesSection from '../../components/CourseQuizzesSection';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore, Section, Subsection } from '../../stores/courseStore';
import { formatDate } from '../../lib/utils';
import PDFViewer from '../../components/ui/PDFViewer';

// Add this utility function if it doesn't exist
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const CourseDetailsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentCourse, 
    fetchCourseById, 
    addSection, 
    updateSection,
    deleteSection,
    addSubsection,
    updateSubsection,
    deleteSubsection,
    updateCourse,
    deleteCourse,
    isLoading, 
    error,
    clearError
  } = useCourseStore();

  // UI State
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedSubsection, setSelectedSubsection] = useState<Subsection | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'quizzes'>('content');
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddSubsection, setShowAddSubsection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSubsection, setEditingSubsection] = useState<string | null>(null);
  const [showCourseSettings, setShowCourseSettings] = useState(false);

  // Form state
  const [sectionForm, setSectionForm] = useState({ title: '', description: '', order: 1 });
  const [subsectionForm, setSubsectionForm] = useState({
    title: '',
    content: '',
    contentType: 'text' as 'text' | 'video' | 'file' | 'quiz' | 'embed' | 'link',
    order: 1,
    fileUrl: '',
    videoUrl: '',
    embedUrl: '',
    linkUrl: ''
  });
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    accessCode: '',
    coverImage: '',
    category: '',
    difficulty: ''
  });

  // Fixed user permission check - handle both id and _id fields
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
  const userId = user?.id || user?._id;
  const courseCreatedById = currentCourse?.createdBy?._id || currentCourse?.createdBy?.id;
  const isOwner = isFaculty && userId === courseCreatedById;

  console.log('Debug permissions:', {
    fullUser: user,
    userId: userId,
    userRole: user?.role,
    isFaculty,
    courseCreatedBy: courseCreatedById,
    isOwner,
    comparison: `${userId} === ${courseCreatedById} = ${userId === courseCreatedById}`,
    currentCourse: currentCourse?.title
  });

  useEffect(() => {
    if (courseId) {
      clearError();
      fetchCourseById(courseId);
    }
  }, [courseId, fetchCourseById, clearError]);

  useEffect(() => {
    if (currentCourse) {
      setCourseForm({
        title: currentCourse.title,
        description: currentCourse.description,
        shortDescription: currentCourse.shortDescription || '',
        accessCode: currentCourse.accessCode,
        coverImage: currentCourse.coverImage || '',
        category: currentCourse.category,
        difficulty: currentCourse.difficulty
      });
      
      // Auto-expand first section if available and we're on content tab
      if (currentCourse.sections.length > 0 && activeTab === 'content') {
        setExpandedSections(new Set([currentCourse.sections[0].id]));
        
        // Auto-select first subsection if available
        if (currentCourse.sections[0].subsections.length > 0) {
          setSelectedSubsection(currentCourse.sections[0].subsections[0]);
        }
      }
    }
  }, [currentCourse, activeTab]);

  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    
    try {
      await addSection(courseId, sectionForm);
      setShowAddSection(false);
      setSectionForm({ title: '', description: '', order: 1 });
    } catch (error) {
      console.error('Failed to add section:', error);
    }
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !editingSection) return;
    
    try {
      await updateSection(courseId, editingSection, sectionForm);
      setEditingSection(null);
      setSectionForm({ title: '', description: '', order: 1 });
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!courseId || !window.confirm('Are you sure you want to delete this section? This will also delete all subsections.')) return;
    
    try {
      await deleteSection(courseId, sectionId);
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const handleAddSubsection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !showAddSubsection) return;
    
    try {
      await addSubsection(courseId, showAddSubsection, subsectionForm);
      setShowAddSubsection(null);
      resetSubsectionForm();
    } catch (error) {
      console.error('Failed to add subsection:', error);
    }
  };

  const handleUpdateSubsection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !editingSubsection || !selectedSubsection) return;
    
    const section = currentCourse?.sections.find(s => 
      s.subsections.some(sub => sub.id === editingSubsection)
    );
    if (!section) return;
    
    try {
      await updateSubsection(courseId, section.id, editingSubsection, subsectionForm);
      setEditingSubsection(null);
      resetSubsectionForm();
    } catch (error) {
      console.error('Failed to update subsection:', error);
    }
  };

  const handleDeleteSubsection = async (sectionId: string, subsectionId: string) => {
    if (!courseId || !window.confirm('Are you sure you want to delete this content?')) return;
    
    try {
      await deleteSubsection(courseId, sectionId, subsectionId);
      if (selectedSubsection?.id === subsectionId) {
        setSelectedSubsection(null);
      }
    } catch (error) {
      console.error('Failed to delete subsection:', error);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    
    try {
      await updateCourse(courseId, courseForm);
      setShowCourseSettings(false);
    } catch (error) {
      console.error('Failed to update course:', error);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseId || !window.confirm('Are you sure you want to delete this entire course? This action cannot be undone.')) return;
    
    try {
      await deleteCourse(courseId);
      navigate('/courses');
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const resetSubsectionForm = () => {
    setSubsectionForm({
      title: '',
      content: '',
      contentType: 'text',
      order: 1,
      fileUrl: '',
      videoUrl: '',
      embedUrl: '',
      linkUrl: ''
    });
  };

  const startEditingSection = (section: Section) => {
    setSectionForm({ 
      title: section.title, 
      description: section.description || '',
      order: section.order 
    });
    setEditingSection(section.id);
  };

  const startEditingSubsection = (subsection: Subsection) => {
    setSubsectionForm({
      title: subsection.title,
      content: subsection.content,
      contentType: subsection.contentType,
      order: subsection.order,
      fileUrl: subsection.fileUrl || '',
      videoUrl: subsection.videoUrl || '',
      embedUrl: subsection.embedUrl || '',
      linkUrl: subsection.linkUrl || ''
    });
    setEditingSubsection(subsection.id);
  };

  const handleFileUpload = (fileUrl: string, metadata?: any) => {
    setSubsectionForm(prev => ({ ...prev, fileUrl }));
  };

  if (isLoading && !currentCourse) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !currentCourse) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button as={Link} to="/courses" icon={<ArrowLeft className="h-5 w-5" />}>
          Back to Courses
        </Button>
      </div>
    );
  }

  if (!currentCourse) {
    return null;
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            as={Link}
            to="/courses"
            variant="ghost"
            icon={<ArrowLeft className="h-5 w-5" />}
          >
            Back to Courses
          </Button>
        </div>
        
        {/* Always show buttons for faculty/admin, but enable/disable based on ownership */}
        {isFaculty && (
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCourseSettings(true)}
              icon={<Settings className="h-5 w-5" />}
              disabled={!isOwner}
              title={!isOwner ? "Only course owner can edit settings" : "Course Settings"}
            >
              Course Settings
            </Button>
            <Button
              as={Link}
              to={`/courses/${courseId}/quizzes`}
              variant="outline"
              icon={<MessageCircle className="h-5 w-5" />}
              disabled={!isOwner}
              title={!isOwner ? "Only course owner can manage quizzes" : "Manage Quizzes"}
            >
              Manage Quizzes
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-error-50 text-error-700 p-3 rounded-md mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Course Info Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start space-x-6">
          {currentCourse.coverImage && (
            <img 
              src={currentCourse.coverImage} 
              alt={currentCourse.title}
              className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentCourse.title}</h1>
            <p className="text-gray-600 mb-4">{currentCourse.description}</p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{currentCourse.enrolledStudentsCount} students</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Updated {formatDate(currentCourse.updatedAt)}</span>
              </div>
              <div className="flex items-center">
                <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium">
                  {currentCourse.accessCode}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {currentCourse.category}
                </span>
                <span className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded text-xs">
                  {currentCourse.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Course Content
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {currentCourse.totalContent}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'quizzes'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Quizzes
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'content' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Course Content Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold">Course Content</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {currentCourse.sections.length} sections • {currentCourse.totalContent} lessons
                      </p>
                    </div>
                    {/* Always show add section button for faculty, but disable if not owner */}
                    {isFaculty && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAddSection(true)}
                        icon={<Plus className="h-4 w-4" />}
                        disabled={!isOwner}
                        title={!isOwner ? "Only course owner can add sections" : "Add Section"}
                      >
                        Add Section
                      </Button>
                    )}
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {currentCourse.sections.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-3">No sections yet</p>
                          {isOwner && (
                            <Button
                              size="sm"
                              onClick={() => setShowAddSection(true)}
                              icon={<Plus className="h-4 w-4" />}
                            >
                              Add First Section
                            </Button>
                          )}
                        </div>
                      ) : (
                        currentCourse.sections.map((section, sectionIndex) => (
                          <div key={section.id} className="border-b border-gray-200 last:border-b-0">
                            <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <button
                                onClick={() => toggleSectionExpansion(section.id)}
                                className="flex items-center flex-1 text-left"
                              >
                                {expandedSections.has(section.id) ? (
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 mr-2" />
                                )}
                                <span className="font-medium">{section.title}</span>
                                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                  {section.subsections.length}
                                </span>
                              </button>
                              
                              {isFaculty && (
                                <div className="flex space-x-1 ml-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditingSection(section)}
                                    icon={<Edit className="h-3 w-3" />}
                                    disabled={!isOwner}
                                    title={!isOwner ? "Only course owner can edit" : "Edit Section"}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteSection(section.id)}
                                    icon={<Trash className="h-3 w-3" />}
                                    className="text-error-600 hover:text-error-700"
                                    disabled={!isOwner}
                                    title={!isOwner ? "Only course owner can delete" : "Delete Section"}
                                  />
                                </div>
                              )}
                            </div>
                            
                            {expandedSections.has(section.id) && (
                              <div className="pl-6 pb-2">
                                {section.subsections.map((subsection, subsectionIndex) => (
                                  <button
                                    key={subsection.id}
                                    onClick={() => setSelectedSubsection(subsection)}
                                    className={`w-full text-left p-3 rounded-md mb-1 flex items-center justify-between group ${
                                      selectedSubsection?.id === subsection.id
                                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                                        : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      {subsection.contentType === 'video' && <Play className="h-4 w-4 mr-2" />}
                                      {subsection.contentType === 'file' && <FileText className="h-4 w-4 mr-2" />}
                                      {subsection.contentType === 'text' && <Type className="h-4 w-4 mr-2" />}
                                      {subsection.contentType === 'quiz' && <BookOpen className="h-4 w-4 mr-2" />}
                                      {subsection.contentType === 'embed' && <ExternalLink className="h-4 w-4 mr-2" />}
                                      {subsection.contentType === 'link' && <Link2 className="h-4 w-4 mr-2" />}
                                      <span className="text-sm">{subsection.title}</span>
                                    </div>
                                    
                                    {isFaculty && (
                                      <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditingSubsection(subsection);
                                          }}
                                          icon={<Edit className="h-3 w-3" />}
                                          disabled={!isOwner}
                                          title={!isOwner ? "Only course owner can edit" : "Edit Content"}
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSubsection(section.id, subsection.id);
                                          }}
                                          icon={<Trash className="h-3 w-3" />}
                                          className="text-error-600 hover:text-error-700"
                                          disabled={!isOwner}
                                          title={!isOwner ? "Only course owner can delete" : "Delete Content"}
                                        />
                                      </div>
                                    )}
                                  </button>
                                ))}
                                
                                {isFaculty && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowAddSubsection(section.id)}
                                    icon={<Plus className="h-4 w-4" />}
                                    className="w-full mt-2"
                                    disabled={!isOwner}
                                    title={!isOwner ? "Only course owner can add content" : "Add Content"}
                                  >
                                    Add Content
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-2">
                {selectedSubsection ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">{selectedSubsection.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedSubsection.contentType === 'video' ? 'bg-purple-100 text-purple-800' :
                            selectedSubsection.contentType === 'file' ? 'bg-blue-100 text-blue-800' :
                            selectedSubsection.contentType === 'quiz' ? 'bg-yellow-100 text-yellow-800' :
                            selectedSubsection.contentType === 'embed' ? 'bg-green-100 text-green-800' :
                            selectedSubsection.contentType === 'link' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedSubsection.contentType}
                          </span>
                          {selectedSubsection.fileUrl && (
                            <Button
                              as="a"
                              href={selectedSubsection.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="ghost"
                              size="sm"
                              icon={<ExternalLink className="h-4 w-4" />}
                              title="Open in new tab"
                            />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Video Content */}
                      {selectedSubsection.contentType === 'video' && selectedSubsection.videoUrl && (
                        <div className="mb-6">
                          <div className="relative rounded-lg overflow-hidden bg-black">
                            <iframe
                              src={selectedSubsection.videoUrl}
                              className="w-full h-64 md:h-96"
                              allowFullScreen
                              title={selectedSubsection.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced File Content with PDF Viewer */}
                      {selectedSubsection.contentType === 'file' && selectedSubsection.fileUrl && (
                        <div className="mb-6">
                          <PDFViewer 
                            fileUrl={selectedSubsection.fileUrl}
                            fileName={selectedSubsection.metadata?.fileName || selectedSubsection.title}
                            height="600px"
                            showControls={true}
                            allowDownload={true}
                            className="shadow-sm"
                          />
                        </div>
                      )}

                      {/* Embed Content */}
                      {selectedSubsection.contentType === 'embed' && selectedSubsection.embedUrl && (
                        <div className="mb-6">
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <iframe
                              src={selectedSubsection.embedUrl}
                              className="w-full h-96"
                              title={selectedSubsection.title}
                              allow="fullscreen"
                            />
                          </div>
                        </div>
                      )}

                      {/* Link Content */}
                      {selectedSubsection.contentType === 'link' && selectedSubsection.linkUrl && (
                        <div className="mb-6">
                          <div className="border border-gray-200 rounded-lg p-6 text-center">
                            <ExternalLink className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">External Resource</h4>
                            <p className="text-gray-600 mb-4">Click the button below to access this resource</p>
                            <Button
                              as="a"
                              href={selectedSubsection.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="primary"
                              icon={<ExternalLink className="h-4 w-4" />}
                            >
                              Open Resource
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Text Content */}
                      {selectedSubsection.content && (
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: selectedSubsection.content }}
                        />
                      )}

                      {/* File Metadata */}
                      {selectedSubsection.metadata && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">File Information</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {selectedSubsection.metadata.fileName && (
                              <div>
                                <span className="text-gray-500">File Name:</span>
                                <p className="font-medium truncate">{selectedSubsection.metadata.fileName}</p>
                              </div>
                            )}
                            {selectedSubsection.metadata.fileSize && (
                              <div>
                                <span className="text-gray-500">Size:</span>
                                <p className="font-medium">{formatFileSize(selectedSubsection.metadata.fileSize)}</p>
                              </div>
                            )}
                            {selectedSubsection.metadata.mimeType && (
                              <div>
                                <span className="text-gray-500">Type:</span>
                                <p className="font-medium">{selectedSubsection.metadata.mimeType}</p>
                              </div>
                            )}
                            {selectedSubsection.metadata.duration && (
                              <div>
                                <span className="text-gray-500">Duration:</span>
                                <p className="font-medium">{selectedSubsection.metadata.duration} min</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {currentCourse.sections.length === 0 
                          ? 'No content yet' 
                          : 'Select content to view'}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {currentCourse.sections.length === 0 
                          ? 'Start by adding your first section and content'
                          : 'Choose a lesson from the sidebar to start learning'}
                      </p>
                      {isOwner && currentCourse.sections.length === 0 && (
                        <Button
                          onClick={() => setShowAddSection(true)}
                          icon={<Plus className="h-4 w-4" />}
                        >
                          Add First Section
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            /* Quizzes Tab Content */
            <CourseQuizzesSection 
              courseId={courseId!}
              isOwner={isOwner}
              isFaculty={isFaculty}
            />
          )}
        </div>
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add New Section</h3>
            <form onSubmit={handleAddSection} className="space-y-4">
              <Input
                label="Section Title"
                value={sectionForm.title}
                onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                required
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Brief description of this section..."
                />
              </div>
              <div className="flex space-x-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddSection(false)}>
                  Cancel
                </Button>
                <Button type="submit" icon={<Save className="h-4 w-4" />}>
                  Add Section
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Section</h3>
            <form onSubmit={handleUpdateSection} className="space-y-4">
              <Input
                label="Section Title"
                value={sectionForm.title}
                onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                required
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Brief description of this section..."
                />
              </div>
              <div className="flex space-x-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingSection(null)}>
                  Cancel
                </Button>
                <Button type="submit" icon={<Save className="h-4 w-4" />}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Subsection Modal */}
      {(showAddSubsection || editingSubsection) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingSubsection ? 'Edit Content' : 'Add New Content'}
            </h3>
            
            <form onSubmit={editingSubsection ? handleUpdateSubsection : handleAddSubsection} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Content Title"
                  value={subsectionForm.title}
                  onChange={(e) => setSubsectionForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  fullWidth
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type
                  </label>
                  <select
                    value={subsectionForm.contentType}
                    onChange={(e) => setSubsectionForm(prev => ({ 
                      ...prev, 
                      contentType: e.target.value as 'text' | 'video' | 'file' | 'quiz' | 'embed' | 'link'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="text">Text/Article</option>
                    <option value="video">Video</option>
                    <option value="file">File/Document</option>
                    <option value="embed">External Embed</option>
                    <option value="link">External Link</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
              </div>
              
              {/* Video URL Input */}
              {subsectionForm.contentType === 'video' && (
                <Input
                  label="Video URL"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={subsectionForm.videoUrl}
                  onChange={(e) => setSubsectionForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  helperText="YouTube, Vimeo, or direct video file URLs"
                  fullWidth
                />
              )}
              
              {/* File Upload */}
              {subsectionForm.contentType === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File or Enter URL
                  </label>
                  <FileUpload onFileUpload={handleFileUpload} />
                  <div className="mt-4">
                    <Input
                      label="Or enter file URL"
                      placeholder="https://drive.google.com/file/d/..."
                      value={subsectionForm.fileUrl}
                      onChange={(e) => setSubsectionForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                      helperText="Google Drive, Dropbox, or direct file URLs"
                      fullWidth
                    />
                  </div>
                </div>
              )}

              {/* Embed URL Input */}
              {subsectionForm.contentType === 'embed' && (
                <Input
                  label="Embed URL"
                  placeholder="https://example.com/embed/..."
                  value={subsectionForm.embedUrl}
                  onChange={(e) => setSubsectionForm(prev => ({ ...prev, embedUrl: e.target.value }))}
                  helperText="URL for embedded content (iframes, widgets, etc.)"
                  fullWidth
                />
              )}

              {/* Link URL Input */}
              {subsectionForm.contentType === 'link' && (
                <Input
                  label="Link URL"
                  placeholder="https://example.com"
                  value={subsectionForm.linkUrl}
                  onChange={(e) => setSubsectionForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                  helperText="External website or resource URL"
                  fullWidth
                />
              )}
              
              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <RichTextEditor
                  value={subsectionForm.content}
                  onChange={(content) => setSubsectionForm(prev => ({ ...prev, content }))}
                  placeholder="Write your content here..."
                />
              </div>
              
              <div className="flex space-x-3 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddSubsection(null);
                    setEditingSubsection(null);
                    resetSubsectionForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" icon={<Save className="h-4 w-4" />}>
                  {editingSubsection ? 'Save Changes' : 'Add Content'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Settings Modal */}
      {showCourseSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-4">Course Settings</h3>
            
            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <Input
                label="Course Title"
                value={courseForm.title}
                onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                required
                fullWidth
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <Input
                label="Short Description"
                value={courseForm.shortDescription}
                onChange={(e) => setCourseForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                fullWidth
              />
              
              <Input
                label="Access Code"
                value={courseForm.accessCode}
                onChange={(e) => setCourseForm(prev => ({ ...prev, accessCode: e.target.value }))}
                required
                fullWidth
              />
              
              <Input
                label="Cover Image URL"
                value={courseForm.coverImage}
                onChange={(e) => setCourseForm(prev => ({ ...prev, coverImage: e.target.value }))}
                fullWidth
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Arts">Arts</option>
                    <option value="Language">Language</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={courseForm.difficulty}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 justify-between">
                <Button 
                  type="button" 
                  variant="danger"
                  onClick={handleDeleteCourse}
                  icon={<Trash className="h-4 w-4" />}
                >
                  Delete Course
                </Button>
                
                <div className="flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => setShowCourseSettings(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" icon={<Save className="h-4 w-4" />}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailsPage;