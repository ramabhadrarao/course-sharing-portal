// src/controllers/quizzes.js
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.js';

// @desc    Get all quizzes for a course
// @route   GET /api/v1/courses/:courseId/quizzes
// @access  Private
export const getQuizzes = asyncHandler(async (req, res, next) => {
  const quizzes = await Quiz.find({ course: req.params.courseId });

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes
  });
});

// @desc    Get single quiz
// @route   GET /api/v1/quizzes/:id
// @access  Private
export const getQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate('course');

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: quiz
  });
});

// @desc    Create quiz
// @route   POST /api/v1/courses/:courseId/quizzes
// @access  Private (Faculty/Admin)
export const createQuiz = asyncHandler(async (req, res, next) => {
  req.body.course = req.params.courseId;

  const quiz = await Quiz.create(req.body);

  res.status(201).json({
    success: true,
    data: quiz
  });
});

// @desc    Submit quiz attempt
// @route   POST /api/v1/quizzes/:id/attempt
// @access  Private (Student)
export const submitQuizAttempt = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  // Calculate score
  let score = 0;
  req.body.answers.forEach(answer => {
    const question = quiz.questions.id(answer.question);
    if (question) {
      const correctOptions = question.options
        .filter(opt => opt.isCorrect)
        .map(opt => opt._id.toString());
      
      const selectedOptions = answer.selectedOptions.map(opt => opt.toString());
      
      if (question.type === 'single') {
        if (correctOptions[0] === selectedOptions[0]) {
          score++;
        }
      } else {
        // For multiple choice, all correct options must be selected
        const isCorrect = correctOptions.length === selectedOptions.length &&
          correctOptions.every(opt => selectedOptions.includes(opt));
        if (isCorrect) {
          score++;
        }
      }
    }
  });

  const attempt = await QuizAttempt.create({
    quiz: req.params.id,
    student: req.user.id,
    answers: req.body.answers,
    score: (score / quiz.questions.length) * 100,
    completedAt: Date.now()
  });

  res.status(201).json({
    success: true,
    data: attempt
  });
});