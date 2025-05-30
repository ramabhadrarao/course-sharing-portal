// src/pages/quizzes/QuizManagementPage.tsx - FIXED VERSION
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  PlusCircle, Edit, Trash, MessageCircle, Clock, Users, 
  CheckCircle, XCircle, AlertCircle, Save, X, Plus, 
  ArrowLeft, BarChart3, Eye, TrendingUp
} from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { useQuizStore } from '../../stores/quizStore';
import { useCourseStore } from '../../stores/courseStore';

interface QuizFormData {
  title: string;
  timeLimit: number;
  questions: QuestionFormData[];
}

interface QuestionFormData {
  text: string;
  type: 'single' | 'multiple';
  options: OptionFormData[];
}

interface OptionFormData {
  text: string;
  isCorrect: boolean;
}

const QuizManagementPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const { 
    quizzes, 
    fetchQuizzes, 
    createQuiz, 
    updateQuiz, 
    deleteQuiz,
    fetchQuizStats,
    quizStats,
    isLoading, 
    error,
    clearError,
    clearQuizStats
  } = useQuizStore();
  const { currentCourse, fetchCourseById } = useCourseStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [showStatsModal, setShowStatsModal] = useState<string | null>(null);
  
  const [quizForm, setQuizForm] = useState<QuizFormData>({
    title: '',
    timeLimit: 30,
    questions: []
  });

  useEffect(() => {
    if (courseId) {
      clearError();
      clearQuizStats();
      fetchCourseById(courseId);
      fetchQuizzes(courseId);
    }
  }, [courseId, fetchCourseById, fetchQuizzes, clearError, clearQuizStats]);

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
  const userId = user?.id || user?._id;
  const courseCreatedById = currentCourse?.createdBy?._id || currentCourse?.createdBy?.id;
  const isOwner = isFaculty && userId === courseCreatedById;

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    
    try {
      // Validate form
      if (!quizForm.title.trim()) {
        alert('Quiz title is required');
        return;
      }
      
      if (!quizForm.questions || quizForm.questions.length === 0) {
        alert('At least one question is required');
        return;
      }
      
      // Validate all questions
      for (let i = 0; i < quizForm.questions.length; i++) {
        const question = quizForm.questions[i];
        if (!question.text.trim()) {
          alert(`Question ${i + 1} text is required`);
          return;
        }
        
        if (!question.options || question.options.length < 2) {
          alert(`Question ${i + 1} must have at least 2 options`);
          return;
        }
        
        const correctOptions = question.options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
          alert(`Question ${i + 1} must have at least one correct answer`);
          return;
        }
        
        if (question.type === 'single' && correctOptions.length > 1) {
          alert(`Single choice question ${i + 1} can only have one correct answer`);
          return;
        }
        
        // Check if all options have text
        for (let j = 0; j < question.options.length; j++) {
          if (!question.options[j].text.trim()) {
            alert(`Question ${i + 1}, option ${j + 1} text is required`);
            return;
          }
        }
      }

      await createQuiz(courseId, {
        ...quizForm,
        course: courseId
      });
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to create quiz:', error);
      // Error is already set in the store
    }
  };

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;
    
    try {
      // Same validation as create
      if (!quizForm.title.trim()) {
        alert('Quiz title is required');
        return;
      }
      
      if (!quizForm.questions || quizForm.questions.length === 0) {
        alert('At least one question is required');
        return;
      }
      
      await updateQuiz(editingQuiz, quizForm);
      setEditingQuiz(null);
      resetForm();
    } catch (error: any) {
      console.error('Failed to update quiz:', error);
      // Error is already set in the store
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await deleteQuiz(quizId);
      setShowDeleteConfirm(null);
    } catch (error: any) {
      console.error('Failed to delete quiz:', error);
      // Error is already set in the store
    }
  };

  const handleShowStats = async (quizId: string) => {
    setShowStatsModal(quizId);
    await fetchQuizStats(quizId);
  };

  const startEditingQuiz = (quiz: any) => {
    // Safely handle quiz data structure
    const questions = (quiz.questions || []).map((q: any) => ({
      text: q.text || '',
      type: q.type || 'single',
      options: (q.options || []).map((o: any) => ({
        text: o.text || '',
        isCorrect: Boolean(o.isCorrect)
      }))
    }));

    setQuizForm({
      title: quiz.title || '',
      timeLimit: quiz.timeLimit || 30,
      questions: questions
    });
    setEditingQuiz(quiz._id);
  };

  const resetForm = () => {
    setQuizForm({
      title: '',
      timeLimit: 30,
      questions: []
    });
  };

  const addQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, {
        text: '',
        type: 'single',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      }]
    }));
  };

  const updateQuestion = (questionIndex: number, field: keyof QuestionFormData, value: any) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: keyof OptionFormData, value: any) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          options: q.options.map((o, j) => 
            j === optionIndex ? { ...o, [field]: value } : o
          )
        } : q
      )
    }));
  };

  const removeQuestion = (questionIndex: number) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== questionIndex)
    }));
  };

  const addOption = (questionIndex: number) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          options: [...q.options, { text: '', isCorrect: false }]
        } : q
      )
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          options: q.options.filter((_, j) => j !== optionIndex)
        } : q
      )
    }));
  };

  if (!isFaculty) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage quizzes.</p>
        <Button as={Link} to={`/courses/${courseId}`} className="mt-4" icon={<ArrowLeft className="h-5 w-5" />}>
          Back to Course
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
          <p className="text-gray-600 mt-1">
            {currentCourse ? `Manage quizzes for ${currentCourse.title}` : 'Loading course...'}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button
            as={Link}
            to={`/courses/${courseId}`}
            variant="outline"
            icon={<ArrowLeft className="h-5 w-5" />}
          >
            Back to Course
          </Button>
          {isOwner && (
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<PlusCircle className="h-5 w-5" />}
            >
              Create Quiz
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-error-50 text-error-700 p-3 rounded-md mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {!isOwner && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-amber-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">View Only Mode</h3>
              <p className="text-sm text-amber-700 mt-1">
                You can view quizzes but only the course owner can create, edit, or delete them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quizzes List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (quizzes && quizzes.length > 0) ? (
        <div className="grid gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz._id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{quiz.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {quiz.questions?.length || 0} questions
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {quiz.timeLimit} minutes
                    </div>
                    <div className="text-xs text-gray-400">
                      Created {new Date(quiz.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowStats(quiz._id)}
                    icon={<BarChart3 className="h-4 w-4" />}
                    title="View Statistics"
                  >
                    Stats
                  </Button>
                  {isOwner && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingQuiz(quiz)}
                        icon={<Edit className="h-4 w-4" />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm({ id: quiz._id, title: quiz.title })}
                        icon={<Trash className="h-4 w-4" />}
                        className="text-error-600 hover:text-error-700"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {(quiz.questions || []).slice(0, 2).map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Q{index + 1}: {question.text}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(question.options || []).map((option, optionIndex) => (
                          <div 
                            key={optionIndex}
                            className={`flex items-center p-2 rounded text-sm ${
                              option.isCorrect 
                                ? 'bg-success-50 text-success-700 border border-success-200' 
                                : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                            {option.isCorrect ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-success-600" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2 text-gray-400" />
                            )}
                            {option.text}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Type: {question.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                      </div>
                    </div>
                  ))}
                  
                  {(quiz.questions?.length || 0) > 2 && (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      ... and {(quiz.questions?.length || 0) - 2} more questions
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
            <p className="text-gray-500 mb-6">
              {isOwner 
                ? "Create your first quiz to test your students' knowledge"
                : "No quizzes have been created for this course yet"
              }
            </p>
            {isOwner && (
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<PlusCircle className="h-5 w-5" />}
              >
                Create First Quiz
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quiz Statistics Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Quiz Statistics
              </h2>
              <button
                onClick={() => {
                  setShowStatsModal(null);
                  clearQuizStats();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {quizStats ? (
              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-primary-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary-600">{quizStats.totalAttempts}</div>
                    <div className="text-sm text-primary-700">Total Attempts</div>
                  </div>
                  <div className="bg-secondary-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-secondary-600">{quizStats.averageScore}%</div>
                    <div className="text-sm text-secondary-700">Average Score</div>
                  </div>
                  <div className="bg-success-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-success-600">{quizStats.highestScore}%</div>
                    <div className="text-sm text-success-700">Highest Score</div>
                  </div>
                  <div className="bg-accent-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-accent-600">{quizStats.passRate}%</div>
                    <div className="text-sm text-accent-700">Pass Rate</div>
                  </div>
                </div>

                {/* Score Distribution */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Score Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Excellent (90-100%)</span>
                      <span className="text-sm text-gray-600">{quizStats.scoreDistribution.excellent} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${quizStats.totalAttempts > 0 ? (quizStats.scoreDistribution.excellent / quizStats.totalAttempts) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Good (80-89%)</span>
                      <span className="text-sm text-gray-600">{quizStats.scoreDistribution.good} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${quizStats.totalAttempts > 0 ? (quizStats.scoreDistribution.good / quizStats.totalAttempts) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average (70-79%)</span>
                      <span className="text-sm text-gray-600">{quizStats.scoreDistribution.average} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${quizStats.totalAttempts > 0 ? (quizStats.scoreDistribution.average / quizStats.totalAttempts) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Poor (Below 70%)</span>
                      <span className="text-sm text-gray-600">{quizStats.scoreDistribution.poor} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${quizStats.totalAttempts > 0 ? (quizStats.scoreDistribution.poor / quizStats.totalAttempts) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {quizStats.totalAttempts === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p>No attempts yet. Statistics will appear once students start taking this quiz.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Quiz Modal */}
      {(showCreateModal || editingQuiz) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingQuiz(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={editingQuiz ? handleUpdateQuiz : handleCreateQuiz} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Quiz Title"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  fullWidth
                  placeholder="Enter quiz title"
                />
                <Input
                  label="Time Limit (minutes)"
                  type="number"
                  min="1"
                  max="300"
                  value={quizForm.timeLimit}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                  required
                  fullWidth
                  placeholder="30"
                />
              </div>
              
              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Questions ({quizForm.questions.length})</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Add Question
                  </Button>
                </div>
                
                {quizForm.questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p>No questions added yet. Click "Add Question" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quizForm.questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Question {questionIndex + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeQuestion(questionIndex)}
                            className="text-error-600 hover:text-error-700"
                            title="Remove question"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <Input
                            label="Question Text"
                            value={question.text}
                            onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                            required
                            fullWidth
                            placeholder="Enter your question"
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Question Type
                            </label>
                            <select
                              value={question.type}
                              onChange={(e) => {
                                const newType = e.target.value as 'single' | 'multiple';
                                updateQuestion(questionIndex, 'type', newType);
                                
                                // If changing to single choice, ensure only one option is correct
                                if (newType === 'single') {
                                  const correctIndex = question.options.findIndex(opt => opt.isCorrect);
                                  const updatedOptions = question.options.map((opt, i) => ({
                                    ...opt,
                                    isCorrect: i === (correctIndex >= 0 ? correctIndex : 0)
                                  }));
                                  updateQuestion(questionIndex, 'options', updatedOptions);
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="single">Single Choice</option>
                              <option value="multiple">Multiple Choice</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              {question.type === 'single' 
                                ? 'Students can select only one correct answer'
                                : 'Students can select multiple correct answers'
                              }
                            </p>
                          </div>
                          
                          {/* Options */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-medium text-gray-700">
                                Answer Options (minimum 2)
                              </label>
                              <button
                                type="button"
                                onClick={() => addOption(questionIndex)}
                                className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Option
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2 bg-white p-3 rounded border">
                                  <input
                                    type={question.type === 'single' ? 'radio' : 'checkbox'}
                                    name={`question-${questionIndex}`}
                                    checked={option.isCorrect}
                                    onChange={(e) => {
                                      if (question.type === 'single') {
                                        // For single choice, uncheck all others
                                        const updatedOptions = question.options.map((o, i) => ({
                                          ...o,
                                          isCorrect: i === optionIndex
                                        }));
                                        updateQuestion(questionIndex, 'options', updatedOptions);
                                      } else {
                                        updateOption(questionIndex, optionIndex, 'isCorrect', e.target.checked);
                                      }
                                    }}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                  />
                                  <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => updateOption(questionIndex, optionIndex, 'text', e.target.value)}
                                    placeholder={`Option ${optionIndex + 1}`}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    required
                                  />
                                  {question.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(questionIndex, optionIndex)}
                                      className="text-error-600 hover:text-error-700"
                                      title="Remove option"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500">
                              <p>
                                <strong>Tip:</strong> Check the {question.type === 'single' ? 'radio button' : 'checkbox'} next to correct answers.
                                {question.type === 'single' 
                                  ? ' Only one option can be correct for single choice questions.'
                                  : ' Multiple options can be correct for multiple choice questions.'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 justify-end pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingQuiz(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  icon={<Save className="h-4 w-4" />}
                  disabled={quizForm.questions.length === 0 || !quizForm.title.trim()}
                >
                  {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-error-500 mr-2" />
              <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete quiz "{showDeleteConfirm.title}"? 
              This action cannot be undone and will remove all quiz attempts and statistics.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleDeleteQuiz(showDeleteConfirm.id)}
                icon={<Trash className="h-4 w-4" />}
              >
                Delete Quiz
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagementPage;