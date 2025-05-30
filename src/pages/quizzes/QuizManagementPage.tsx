import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  PlusCircle, Edit, Trash, MessageCircle, Clock, Users, 
  CheckCircle, XCircle, AlertCircle, Save, X, Plus
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
    isLoading, 
    error,
    clearError 
  } = useQuizStore();
  const { currentCourse, fetchCourseById } = useCourseStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  
  const [quizForm, setQuizForm] = useState<QuizFormData>({
    title: '',
    timeLimit: 30,
    questions: []
  });

  useEffect(() => {
    if (courseId) {
      clearError();
      fetchCourseById(courseId);
      fetchQuizzes(courseId);
    }
  }, [courseId, fetchCourseById, fetchQuizzes, clearError]);

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
  const isOwner = isFaculty && currentCourse?.createdBy.id === user?.id;

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    
    try {
      await createQuiz(courseId, {
        ...quizForm,
        course: courseId
      });
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create quiz:', error);
    }
  };

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;
    
    try {
      await updateQuiz(editingQuiz, quizForm);
      setEditingQuiz(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update quiz:', error);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await deleteQuiz(quizId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    }
  };

  const startEditingQuiz = (quiz: any) => {
    setQuizForm({
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions.map((q: any) => ({
        text: q.text,
        type: q.type,
        options: q.options.map((o: any) => ({
          text: o.text,
          isCorrect: o.isCorrect
        }))
      }))
    });
    setEditingQuiz(quiz.id);
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
        
        {isOwner && (
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button
              as={Link}
              to={`/courses/${courseId}`}
              variant="outline"
            >
              Back to Course
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<PlusCircle className="h-5 w-5" />}
            >
              Create Quiz
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

      {/* Quizzes List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{quiz.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {quiz.questions.length} questions
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {quiz.timeLimit} minutes
                    </div>
                  </div>
                </div>
                
                {isOwner && (
                  <div className="flex space-x-2">
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
                      onClick={() => setShowDeleteConfirm({ id: quiz.id, title: quiz.title })}
                      icon={<Trash className="h-4 w-4" />}
                      className="text-error-600 hover:text-error-700"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {quiz.questions.slice(0, 2).map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Q{index + 1}: {question.text}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {question.options.map((option, optionIndex) => (
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
                  
                  {quiz.questions.length > 2 && (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      ... and {quiz.questions.length - 2} more questions
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
              Create your first quiz to test your students' knowledge
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
                />
                <Input
                  label="Time Limit (minutes)"
                  type="number"
                  value={quizForm.timeLimit}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                  required
                  fullWidth
                />
              </div>
              
              {/* Questions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Questions</h3>
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
                
                <div className="space-y-6">
                  {quizForm.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Question {questionIndex + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-error-600 hover:text-error-700"
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
                        />
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question Type
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(questionIndex, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="single">Single Choice</option>
                            <option value="multiple">Multiple Choice</option>
                          </select>
                        </div>
                        
                        {/* Options */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              Answer Options
                            </label>
                            <button
                              type="button"
                              onClick={() => addOption(questionIndex)}
                              className="text-primary-600 hover:text-primary-700 text-sm"
                            >
                              Add Option
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
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
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 justify-end pt-4">
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
                  disabled={quizForm.questions.length === 0}
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
              This action cannot be undone and will remove all quiz attempts.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleDeleteQuiz(showDeleteConfirm.id)}
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