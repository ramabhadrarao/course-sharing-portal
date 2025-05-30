import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, 
  FileText, Award, RefreshCw, Eye, Calendar
} from 'lucide-react';

import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { useQuizStore } from '../../stores/quizStore';
import { useCourseStore } from '../../stores/courseStore';

interface QuizAnswer {
  question: string;
  selectedOptions: string[];
}

const QuizTakingPage: React.FC = () => {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentQuiz, 
    currentAttempt,
    fetchQuizById, 
    fetchMyQuizAttempt,
    submitQuizAttempt,
    isLoading, 
    error,
    clearError,
    clearCurrentQuiz,
    clearCurrentAttempt
  } = useQuizStore();
  const { currentCourse, fetchCourseById } = useCourseStore();
  
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (courseId && quizId) {
      clearError();
      clearCurrentQuiz();
      clearCurrentAttempt();
      fetchCourseById(courseId);
      fetchQuizById(quizId);
      fetchMyQuizAttempt(quizId);
    }
  }, [courseId, quizId, fetchCourseById, fetchQuizById, fetchMyQuizAttempt, clearError, clearCurrentQuiz, clearCurrentAttempt]);

  // Initialize answers when quiz is loaded
  useEffect(() => {
    if (currentQuiz && !currentAttempt) {
      const initialAnswers = currentQuiz.questions.map(question => ({
        question: question._id!,
        selectedOptions: []
      }));
      setAnswers(initialAnswers);
      setTimeLeft(currentQuiz.timeLimit * 60); // Convert minutes to seconds
    }
  }, [currentQuiz, currentAttempt]);

  // Show results if user has already attempted
  useEffect(() => {
    if (currentAttempt) {
      setShowResults(true);
    }
  }, [currentAttempt]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (quizStarted && timeLeft > 0 && !showResults) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [quizStarted, timeLeft, showResults]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerChange = (questionIndex: number, optionId: string, isChecked: boolean) => {
    if (!currentQuiz) return;
    
    const question = currentQuiz.questions[questionIndex];
    
    setAnswers(prev => prev.map((answer, index) => {
      if (index === questionIndex) {
        if (question.type === 'single') {
          // For single choice, replace all options with the selected one
          return {
            ...answer,
            selectedOptions: isChecked ? [optionId] : []
          };
        } else {
          // For multiple choice, add or remove the option
          if (isChecked) {
            return {
              ...answer,
              selectedOptions: [...answer.selectedOptions, optionId]
            };
          } else {
            return {
              ...answer,
              selectedOptions: answer.selectedOptions.filter(id => id !== optionId)
            };
          }
        }
      }
      return answer;
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!currentQuiz || !quizId) return;
    
    // Check if all questions are answered
    const unansweredQuestions = answers.filter(answer => answer.selectedOptions.length === 0);
    if (unansweredQuestions.length > 0) {
      const confirm = window.confirm(
        `You have ${unansweredQuestions.length} unanswered question(s). Do you want to submit anyway?`
      );
      if (!confirm) return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitQuizAttempt(quizId, { answers });
      setShowResults(true);
      setQuizStarted(false);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuestionResult = (questionIndex: number) => {
    if (!currentAttempt || !currentQuiz) return null;
    
    const userAnswer = currentAttempt.answers.find(a => a.question === currentQuiz.questions[questionIndex]._id);
    const question = currentQuiz.questions[questionIndex];
    
    if (!userAnswer) return { isCorrect: false, userSelected: [], correctOptions: [] };
    
    const correctOptionIds = question.options
      .filter(opt => opt.isCorrect)
      .map(opt => opt._id!);
    
    const userSelectedIds = userAnswer.selectedOptions;
    
    let isCorrect = false;
    
    if (question.type === 'single') {
      isCorrect = userSelectedIds.length === 1 && correctOptionIds.includes(userSelectedIds[0]);
    } else {
      isCorrect = correctOptionIds.length === userSelectedIds.length &&
                  correctOptionIds.every(id => userSelectedIds.includes(id)) &&
                  userSelectedIds.every(id => correctOptionIds.includes(id));
    }
    
    return {
      isCorrect,
      userSelected: userSelectedIds,
      correctOptions: correctOptionIds
    };
  };

  // Check access permissions
  const isEnrolled = currentCourse?.enrolledStudents.includes(user?.id || user?._id || '');
  const isOwner = currentCourse?.createdBy?.id === user?.id || currentCourse?.createdBy?._id === user?._id;
  const isAdmin = user?.role === 'admin';
  
  if (!isEnrolled && !isOwner && !isAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-6">You must be enrolled in this course to take quizzes.</p>
        <Button as={Link} to={`/courses/${courseId}`} icon={<ArrowLeft className="h-5 w-5" />}>
          Back to Course
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !currentQuiz) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-error-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h2>
        <p className="text-gray-600 mb-6">{error || 'The quiz you are looking for does not exist.'}</p>
        <Button as={Link} to={`/courses/${courseId}`} icon={<ArrowLeft className="h-5 w-5" />}>
          Back to Course
        </Button>
      </div>
    );
  }

  // Show results if user has already attempted
  if (showResults && currentAttempt) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="mb-6">
          <Button as={Link} to={`/courses/${courseId}`} variant="ghost" icon={<ArrowLeft className="h-5 w-5" />}>
            Back to Course
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`rounded-full p-4 ${
                currentAttempt.score >= 80 ? 'bg-success-100' :
                currentAttempt.score >= 60 ? 'bg-accent-100' : 'bg-error-100'
              }`}>
                <Award className={`h-12 w-12 ${
                  currentAttempt.score >= 80 ? 'text-success-600' :
                  currentAttempt.score >= 60 ? 'text-accent-600' : 'text-error-600'
                }`} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{currentQuiz.title}</h1>
            <p className="text-gray-600 mt-2">Quiz Results</p>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  currentAttempt.score >= 80 ? 'text-success-600' :
                  currentAttempt.score >= 60 ? 'text-accent-600' : 'text-error-600'
                }`}>
                  {currentAttempt.score}%
                </div>
                <div className="text-sm text-gray-500">Your Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-700">
                  {Math.round((currentAttempt.score / 100) * currentQuiz.questions.length)}/{currentQuiz.questions.length}
                </div>
                <div className="text-sm text-gray-500">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-700">
                  {currentQuiz.timeLimit}
                </div>
                <div className="text-sm text-gray-500">Minutes Allowed</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                Completed on {new Date(currentAttempt.completedAt!).toLocaleString()}
              </div>
              
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                currentAttempt.score >= 80 ? 'bg-success-100 text-success-800' :
                currentAttempt.score >= 60 ? 'bg-accent-100 text-accent-800' : 'bg-error-100 text-error-800'
              }`}>
                {currentAttempt.score >= 80 ? 'Excellent!' :
                 currentAttempt.score >= 60 ? 'Good Job!' : 'Needs Improvement'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Question Review</h2>
          
          {currentQuiz.questions.map((question, index) => {
            const result = getQuestionResult(index);
            
            return (
              <Card key={index} className={`border-l-4 ${
                result?.isCorrect ? 'border-success-500' : 'border-error-500'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium text-gray-900">
                      Question {index + 1}: {question.text}
                    </h3>
                    <div className={`flex items-center ${
                      result?.isCorrect ? 'text-success-600' : 'text-error-600'
                    }`}>
                      {result?.isCorrect ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isUserSelected = result?.userSelected.includes(option._id!);
                      const isCorrect = result?.correctOptions.includes(option._id!);
                      
                      return (
                        <div
                          key={optionIndex}
                          className={`flex items-center p-3 rounded-md border ${
                            isCorrect 
                              ? 'bg-success-50 border-success-200' 
                              : isUserSelected 
                              ? 'bg-error-50 border-error-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center mr-3">
                            {question.type === 'single' ? (
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                isUserSelected 
                                  ? (isCorrect ? 'border-success-500 bg-success-500' : 'border-error-500 bg-error-500')
                                  : 'border-gray-300'
                              }`}>
                                {isUserSelected && (
                                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                                )}
                              </div>
                            ) : (
                              <div className={`w-4 h-4 rounded border-2 ${
                                isUserSelected 
                                  ? (isCorrect ? 'border-success-500 bg-success-500' : 'border-error-500 bg-error-500')
                                  : 'border-gray-300'
                              }`}>
                                {isUserSelected && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          <span className={`flex-1 ${
                            isCorrect ? 'text-success-800 font-medium' : 
                            isUserSelected ? 'text-error-800' : 'text-gray-700'
                          }`}>
                            {option.text}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            {isCorrect && (
                              <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded">
                                Correct
                              </span>
                            )}
                            {isUserSelected && !isCorrect && (
                              <span className="text-xs bg-error-100 text-error-700 px-2 py-1 rounded">
                                Your Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Quiz not started yet
  if (!quizStarted) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="mb-6">
          <Button as={Link} to={`/courses/${courseId}`} variant="ghost" icon={<ArrowLeft className="h-5 w-5" />}>
            Back to Course
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary-100 p-4">
                <FileText className="h-12 w-12 text-primary-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{currentQuiz.title}</h1>
            <p className="text-gray-600 mt-2">Quiz Instructions</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{currentQuiz.questions.length}</div>
                <div className="text-sm text-gray-500">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{currentQuiz.timeLimit}</div>
                <div className="text-sm text-gray-500">Minutes</div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-amber-800 mb-2">Important Instructions:</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• You have {currentQuiz.timeLimit} minutes to complete this quiz</li>
                <li>• You can only attempt this quiz once</li>
                <li>• Make sure you have a stable internet connection</li>
                <li>• Answer all questions before submitting</li>
                <li>• The quiz will auto-submit when time runs out</li>
              </ul>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={handleStartQuiz}
                size="lg"
                icon={<Clock className="h-5 w-5" />}
              >
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Timer Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 mb-6 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{currentQuiz.title}</h1>
          <div className={`flex items-center space-x-4 ${
            timeLeft < 300 ? 'text-error-600' : 'text-gray-700'
          }`}>
            <Clock className="h-5 w-5" />
            <span className="text-lg font-mono font-semibold">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{answers.filter(a => a.selectedOptions.length > 0).length} of {currentQuiz.questions.length} answered</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(answers.filter(a => a.selectedOptions.length > 0).length / currentQuiz.questions.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-8">
        {currentQuiz.questions.map((question, questionIndex) => (
          <Card key={questionIndex}>
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Question {questionIndex + 1} of {currentQuiz.questions.length}
                </h2>
                <p className="text-gray-700">{question.text}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {question.type === 'single' ? 'Select one answer' : 'Select all correct answers'}
                </div>
              </div>
              
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => {
                  const isSelected = answers[questionIndex]?.selectedOptions.includes(option._id!);
                  
                  return (
                    <label 
                      key={optionIndex}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type={question.type === 'single' ? 'radio' : 'checkbox'}
                        name={`question-${questionIndex}`}
                        checked={isSelected}
                        onChange={(e) => handleAnswerChange(questionIndex, option._id!, e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-3 text-gray-900">{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {answers.filter(a => a.selectedOptions.length > 0).length} of {currentQuiz.questions.length} questions answered
          </div>
          <Button
            onClick={handleSubmitQuiz}
            isLoading={isSubmitting}
            size="lg"
            disabled={isSubmitting}
            icon={<CheckCircle className="h-5 w-5" />}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizTakingPage;