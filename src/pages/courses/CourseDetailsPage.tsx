import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Book, FileText, Video, MessageCircle, PlusCircle, 
  Copy, Check, Edit, Trash, Save, X, Upload, AlertCircle
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore, Section, Subsection } from '../../stores/courseStore';
import { useQuizStore } from '../../stores/quizStore';
import { formatDate, generateAccessCode } from '../../lib/utils';

const CourseDetailsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentCourse, 
    fetchCourseById, 
    updateCourse, 
    deleteCourse,
    addSection,
    updateSection,
    deleteSection,
    addSubsection,
    updateSubsection,
    deleteSubsection,
    isLoading, 
    error,
    clearError
  } = useCourseStore();
  
  const { fetchQuizzes, quizzes } = useQuizStore();
  
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingCourse, setEditingCourse] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSubsection, setEditingSubsection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddSubsection, setShowAddSubsection] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);
  
  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    coverImage: ''
  });
  
  const [sectionForm, setSectionForm] = useState({
    title: '',
    order: 1
  });
  
  const [subsectionForm, setSubsectionForm] = useState({
    title: '',
    content: '',
    contentType: 'text' as 'text' | 'video' | 'file' | 'quiz',
    order: 1,
    videoUrl: '',
    fileUrl: ''
  });
  
  useEffect(() => {
    if (courseId) {
      clearError();
      fetchCourseById(courseId);
      fetchQuizzes(courseId);
    }
  }, [courseId, fetchCourseById, fetchQuizzes, clearError]);
  
  useEffect(() => {
    if (currentCourse) {
      setCourseForm({
        title: currentCourse.title,
        description: currentCourse.description,
        coverImage: currentCourse.coverImageUrl || ''
      });
      
      if (currentCourse.sections.length && !activeSection) {
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
    if (currentCourse && isOwner) {
      const newCode = generateAccessCode();
      await updateCourse(currentCourse.id, { accessCode: newCode });
    }
  };
  
  // Course management functions
  const handleSaveCourse = async () => {
    if (!currentCourse) return;
    
    try {
      await updateCourse(currentCourse.id, courseForm);
      setEditingCourse(false);
    } catch (error) {
      console.error('Failed to update course:', error);
    }
  };
  
  const handleDeleteCourse = async () => {
    if (!currentCourse) return;
    
    try {
      await deleteCourse(currentCourse.id);
      navigate('/courses');
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };
  
  // Section management functions
  const handleAddSection = async () => {
    if (!currentCourse) return;
    
    try {
      const nextOrder = currentCourse.sections.length + 1;
      await addSection(currentCourse.id, {
        ...sectionForm,
        order: nextOrder
      });
      setSectionForm({ title: '', order: 1 });
      setShowAddSection(false);
    } catch (error) {
      console.error('Failed to add section:', error);
    }
  };
  
  const handleUpdateSection = async (sectionId: string) => {
    if (!currentCourse) return;
    
    try {
      await updateSection(currentCourse.id, sectionId, sectionForm);
      setEditingSection(null);
      setSectionForm({ title: '', order: 1 });
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };
  
  const handleDeleteSection = async (sectionId: string) => {
    if (!currentCourse) return;
    
    try {
      await deleteSection(currentCourse.id, sectionId);
      if (activeSection === sectionId) {
        setActiveSection(null);
        setActiveSubsection(null);
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };
  
  // Subsection management functions
  const handleAddSubsection = async (sectionId: string) => {
    if (!currentCourse) return;
    
    try {
      const section = currentCourse.sections.find(s => s.id === sectionId);
      const nextOrder = section ? section.subsections.length + 1 : 1;
      
      await addSubsection(currentCourse.id, sectionId, {
        ...subsectionForm,
        order: nextOrder
      });
      
      setSubsectionForm({
        title: '',
        content: '',
        contentType: 'text',
        order: 1,
        videoUrl: '',
        fileUrl: ''
      });
      setShowAddSubsection(null);
    } catch (error) {
      console.error('Failed to add subsection:', error);
    }
  };
  
  const handleUpdateSubsection = async (sectionId: string, subsectionId: string) => {
    if (!currentCourse) return;
    
    try {
      await updateSubsection(currentCourse.id, sectionId, subsectionId, subsectionForm);
      setEditingSubsection(null);
      setSubsectionForm({
        title: '',
        content: '',
        contentType: 'text',
        order: 1,
        videoUrl: '',
        fileUrl: ''
      });
    } catch (error) {
      console.error('Failed to update subsection:', error);
    }
  };
  
  const handleDeleteSubsection = async (sectionId: string, subsectionId: string) => {
    if (!currentCourse) return;
    
    try {
      await deleteSubsection(currentCourse.id, sectionId, subsectionId);
      if (activeSubsection === subsectionId) {
        setActiveSubsection(null);
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete subsection:', error);
    }
  };
  
  const startEditingSection = (section: Section) => {
    setSectionForm({
      title: section.title,
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
      videoUrl: subsection.videoUrl || '',
      fileUrl: subsection.fileUrl || ''
    });
    setEditingSubsection(subsection.id);
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
  
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Course</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => fetchCourseById(courseId!)}>Try Again</Button>
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
          {editingCourse ? (
            <div className="space-y-4">
              <Input
                value={courseForm.title}
                onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Course title"
                fullWidth
              />
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Course description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
              <Input
                value={courseForm.coverImage}
                onChange={(e) => setCourseForm(prev => ({ ...prev, coverImage: e.target.value }))}
                placeholder="Cover image URL"
                fullWidth
              />
              <div className="flex space-x-2">
                <Button onClick={handleSaveCourse} icon={<Save className="h-4 w-4" />}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingCourse(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentCourse.title}</h1>
                <p className="text-gray-600">{currentCourse.description}</p>
                
                <div className="flex items-center mt-4 text-sm text-gray-500">
                  <span className="mr-4">Created by: {currentCourse.createdBy.name}</span>
                  <span>Last updated: {formatDate(currentCourse.updatedAt)}</span>
                </div>
              </div>
              
              {isOwner && (
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
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCourse(true)}
                      icon={<Edit className="h-4 w-4" />}
                    >
                      Edit Course
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={regenerateAccessCode}
                    >
                      Regenerate Code
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowDeleteConfirm({ type: 'course', id: currentCourse.id, name: currentCourse.title })}
                      icon={<Trash className="h-4 w-4" />}
                    >
                      Delete Course
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Course Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Course Content</h3>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<PlusCircle className="h-4 w-4" />}
                  onClick={() => setShowAddSection(true)}
                >
                  Add Section
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {/* Add Section Form */}
              {showAddSection && (
                <div className="p-4 border-b border-gray-200">
                  <Input
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Section title"
                    fullWidth
                    className="mb-2"
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleAddSection}>Add</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAddSection(false)}>Cancel</Button>
                  </div>
                </div>
              )}
              
              {currentCourse.sections.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {currentCourse.sections.map((section) => (
                    <div key={section.id} className="py-2">
                      {editingSection === section.id ? (
                        <div className="px-6 py-2">
                          <Input
                            value={sectionForm.title}
                            onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                            fullWidth
                            className="mb-2"
                          />
                          <div className="flex space-x-1">
                            <Button size="sm" onClick={() => handleUpdateSection(section.id)}>Save</Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <button
                            className="flex-1 text-left px-6 py-2 flex justify-between items-center hover:bg-gray-50"
                            onClick={() => setActiveSection(section.id)}
                          >
                            <span className="font-medium">{section.title}</span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`} />
                          </button>
                          {isOwner && (
                            <div className="flex space-x-1 pr-2">
                              <button
                                onClick={() => startEditingSection(section)}
                                className="p-1 text-gray-400 hover:text-primary-600"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm({ type: 'section', id: section.id, name: section.title })}
                                className="p-1 text-gray-400 hover:text-error-600"
                              >
                                <Trash className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeSection === section.id && (
                        <div className="pl-6 pr-2">
                          {section.subsections.map((subsection) => (
                            <div key={subsection.id} className="flex items-center justify-between">
                              <button
                                className={`flex-1 text-left px-4 py-2 text-sm rounded-md flex items-center ${activeSubsection === subsection.id ? 'bg-primary-50 text-primary-800' : 'hover:bg-gray-50'}`}
                                onClick={() => setActiveSubsection(subsection.id)}
                              >
                                {subsection.contentType === 'text' && <FileText className="h-4 w-4 mr-2" />}
                                {subsection.contentType === 'video' && <Video className="h-4 w-4 mr-2" />}
                                {subsection.contentType === 'quiz' && <MessageCircle className="h-4 w-4 mr-2" />}
                                {subsection.contentType === 'file' && <FileText className="h-4 w-4 mr-2" />}
                                <span>{subsection.title}</span>
                              </button>
                              {isOwner && (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => startEditingSubsection(subsection)}
                                    className="p-1 text-gray-400 hover:text-primary-600"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm({ type: 'subsection', id: subsection.id, name: subsection.title })}
                                    className="p-1 text-gray-400 hover:text-error-600"
                                  >
                                    <Trash className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {/* Add Subsection */}
                          {showAddSubsection === section.id ? (
                            <div className="px-4 py-2 border border-gray-200 rounded-md m-2">
                              <Input
                                value={subsectionForm.title}
                                onChange={(e) => setSubsectionForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Subsection title"
                                fullWidth
                                className="mb-2"
                              />
                              <select
                                value={subsectionForm.contentType}
                                onChange={(e) => setSubsectionForm(prev => ({ ...prev, contentType: e.target.value as any }))}
                                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="text">Text Content</option>
                                <option value="video">Video</option>
                                <option value="file">File</option>
                                <option value="quiz">Quiz</option>
                              </select>
                              {subsectionForm.contentType === 'text' && (
                                <textarea
                                  value={subsectionForm.content}
                                  onChange={(e) => setSubsectionForm(prev => ({ ...prev, content: e.target.value }))}
                                  placeholder="Content"
                                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                  rows={3}
                                />
                              )}
                              {subsectionForm.contentType === 'video' && (
                                <Input
                                  value={subsectionForm.videoUrl}
                                  onChange={(e) => setSubsectionForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                                  placeholder="Video URL"
                                  fullWidth
                                  className="mb-2"
                                />
                              )}
                              {subsectionForm.contentType === 'file' && (
                                <Input
                                  value={subsectionForm.fileUrl}
                                  onChange={(e) => setSubsectionForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                                  placeholder="File URL"
                                  fullWidth
                                  className="mb-2"
                                />
                              )}
                              <div className="flex space-x-2">
                                <Button size="sm" onClick={() => handleAddSubsection(section.id)}>Add</Button>
                                <Button variant="outline" size="sm" onClick={() => setShowAddSubsection(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : isOwner && (
                            <button 
                              className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-primary-600 flex items-center"
                              onClick={() => setShowAddSubsection(section.id)}
                            >
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
          {editingSubsection && activeSubsectionContent ? (
            <Card className="animate-fade-in">
              <CardHeader>
                <h2 className="text-xl font-semibold">Edit Subsection</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={subsectionForm.title}
                  onChange={(e) => setSubsectionForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Subsection title"
                  fullWidth
                />
                <select
                  value={subsectionForm.contentType}
                  onChange={(e) => setSubsectionForm(prev => ({ ...prev, contentType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="text">Text Content</option>
                  <option value="video">Video</option>
                  <option value="file">File</option>
                  <option value="quiz">Quiz</option>
                </select>
                {subsectionForm.contentType === 'text' && (
                  <textarea
                    value={subsectionForm.content}
                    onChange={(e) => setSubsectionForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Content"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    rows={10}
                  />
                )}
                {subsectionForm.contentType === 'video' && (
                  <Input
                    value={subsectionForm.videoUrl}
                    onChange={(e) => setSubsectionForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="Video URL"
                    fullWidth
                  />
                )}
                {subsectionForm.contentType === 'file' && (
                  <Input
                    value={subsectionForm.fileUrl}
                    onChange={(e) => setSubsectionForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                    placeholder="File URL"
                    fullWidth
                  />
                )}
              </CardContent>
              <CardFooter className="flex space-x-2">
                <Button 
                  onClick={() => {
                    const section = currentCourse.sections.find(s => s.subsections.some(sub => sub.id === editingSubsection));
                    if (section) {
                      handleUpdateSubsection(section.id, editingSubsection);
                    }
                  }}
                  icon={<Save className="h-4 w-4" />}
                >
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingSubsection(null)}>
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          ) : activeSubsectionContent ? (
            <Card className="animate-fade-in">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{activeSubsectionContent.title}</h2>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit className="h-4 w-4" />}
                    onClick={() => startEditingSubsection(activeSubsectionContent)}
                  >
                    Edit
                  </Button>
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
                {activeSubsectionContent.contentType === 'quiz' && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz Content</h3>
                    <p className="text-gray-500 mb-4">Quiz functionality will be available soon</p>
                    <Button variant="outline" as={Link} to={`/courses/${courseId}/quizzes`}>
                      View Quizzes
                    </Button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-error-500 mr-2" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {showDeleteConfirm.type} "{showDeleteConfirm.name}"? 
              This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  if (showDeleteConfirm.type === 'course') {
                    handleDeleteCourse();
                  } else if (showDeleteConfirm.type === 'section') {
                    handleDeleteSection(showDeleteConfirm.id);
                  } else if (showDeleteConfirm.type === 'subsection') {
                    const section = currentCourse?.sections.find(s => 
                      s.subsections.some(sub => sub.id === showDeleteConfirm.id)
                    );
                    if (section) {
                      handleDeleteSubsection(section.id, showDeleteConfirm.id);
                    }
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailsPage;