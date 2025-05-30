// src/components/CourseQuizzesSection.tsx - FIXED VERSION
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, Clock, Play, Award, BarChart3, 
  CheckCircle, AlertCircle, Timer, FileText
} from 'lucide-react';

import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { useQuizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';

interface CourseQuizzesSectionProps {
  courseId: string;
  isOwner: boolean;
  isFaculty: boolean;
}

const CourseQuizzesSection: React.FC<CourseQuizzesSectionProps> = ({ 
  courseId, 
  isOwner, 
  isFaculty 
}) => {
  const { user } = useAuthStore();
  const { 
    quizzes, 
    fetchQuizzes, 
    fetchMyQuizAttempt,
    currentAttempt,
    isLoading, 
    error,
    clearError,
    clearCurrentAttempt
  } = useQuizStore();

  useEffect(() => {
    if (courseId) {
      clearError();
      fetchQuizzes(courseId);
    }
  }, [courseId, fetchQuizzes, clearError]);

  const checkAttemptStatus = async (quizId: string) => {
    if (!isFaculty && quizId) {
      await fetchMyQuizAttempt(quizId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-50 text-error-700 p-4 rounded-md flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes available</h3>
          <p className="text-gray-500 mb-4">
            {isOwner 
              ? "You haven't created any quizzes for this course yet."
              : "No quizzes have been added to this course."}
          </p>
          {isOwner && (
            <Button
              as={Link}
              to={`/courses/${courseId}/quizzes`}
              variant="primary"
            >
              Create Quiz
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Course Quizzes ({quizzes.length})
        </h3>
        {isFaculty && (
          <Button
            as={Link}
            to={`/courses/${courseId}/quizzes`}
            variant="outline"
            size="sm"
          >
            Manage Quizzes
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz._id}
            quiz={quiz}
            courseId={courseId}
            isFaculty={isFaculty}
            isOwner={isOwner}
            onCheckAttempt={checkAttemptStatus}
          />
        ))}
      </div>
    </div>
  );
};

interface QuizCardProps {
  quiz: any;
  courseId: string;
  isFaculty: boolean;
  isOwner: boolean;
  onCheckAttempt: (quizId: string) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ 
  quiz, 
  courseId, 
  isFaculty, 
  isOwner,
  onCheckAttempt
}) => {
  const { currentAttempt } = useQuizStore();
  const [hasCheckedAttempt, setHasCheckedAttempt] = React.useState(false);

  React.useEffect(() => {
    if (!isFaculty && !hasCheckedAttempt && quiz?._id) {
      onCheckAttempt(quiz._id);
      setHasCheckedAttempt(true);
    }
  }, [quiz?._id, isFaculty, hasCheckedAttempt, onCheckAttempt]);

  const hasAttempted = currentAttempt && !isFaculty;

  // Safely get quiz properties with defaults
  const quizTitle = quiz?.title || 'Untitled Quiz';
  const quizQuestions = quiz?.questions || [];
  const quizTimeLimit = quiz?.timeLimit || 0;
  const quizCreatedAt = quiz?.createdAt || new Date().toISOString();
  const quizId = quiz?._id || '';

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-medium text-gray-900 mb-2">{quizTitle}</h4>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                {quizQuestions.length} questions
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {quizTimeLimit} minutes
              </div>
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Created {new Date(quizCreatedAt).toLocaleDateString()}
              </div>
            </div>

            {/* Quiz Status for Students */}
            {!isFaculty && (
              <div className="mb-4">
                {hasAttempted && currentAttempt ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-success-600">
                      <CheckCircle className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentAttempt.score >= 80 ? 'bg-success-100 text-success-800' :
                      currentAttempt.score >= 60 ? 'bg-accent-100 text-accent-800' : 
                      'bg-error-100 text-error-800'
                    }`}>
                      Score: {currentAttempt.score}%
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600">
                    <Timer className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Not attempted</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2 ml-4">
            {isFaculty ? (
              // Faculty/Admin Actions
              <div className="flex space-x-2">
                <Button
                  as={Link}
                  to={`/courses/${courseId}/quizzes`}
                  variant="outline"
                  size="sm"
                  icon={<BarChart3 className="h-4 w-4" />}
                >
                  Manage
                </Button>
                <Button
                  as={Link}
                  to={`/courses/${courseId}/quiz/${quizId}`}
                  variant="ghost"
                  size="sm"
                  icon={<Play className="h-4 w-4" />}
                  title="Preview quiz"
                >
                  Preview
                </Button>
              </div>
            ) : (
              // Student Actions
              <div className="flex space-x-2">
                {hasAttempted && currentAttempt ? (
                  <Button
                    as={Link}
                    to={`/courses/${courseId}/quiz/${quizId}`}
                    variant="outline"
                    size="sm"
                    icon={<Award className="h-4 w-4" />}
                  >
                    View Results
                  </Button>
                ) : (
                  <Button
                    as={Link}
                    to={`/courses/${courseId}/quiz/${quizId}`}
                    variant="primary"
                    size="sm"
                    icon={<Play className="h-4 w-4" />}
                  >
                    Take Quiz
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseQuizzesSection;