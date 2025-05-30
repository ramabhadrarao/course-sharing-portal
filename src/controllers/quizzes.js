// src/controllers/quizzes.js
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Course from '../models/Course.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.js';

// @desc    Get all quizzes for a course
// @route   GET /api/v1/courses/:courseId/quizzes
// @access  Private
export const getQuizzes = asyncHandler(async (req, res, next) => {
  // Check if course exists
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.courseId}`, 404));
  }

  // Check access permissions
  const isOwner = course.createdBy.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  const isEnrolled = course.enrolledStudents.includes(req.user.id);
  
  if (!isOwner && !isAdmin && !isEnrolled) {
    return next(new ErrorResponse('Not authorized to access this course', 401));
  }

  const quizzes = await Quiz.find({ course: req.params.courseId })
    .populate('course', 'title')
    .sort({ createdAt: -1 });

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
  const quiz = await Quiz.findById(req.params.id)
    .populate('course', 'title createdBy enrolledStudents');

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  // Check access permissions
  const course = quiz.course;
  const isOwner = course.createdBy.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  const isEnrolled = course.enrolledStudents.includes(req.user.id);
  
  if (!isOwner && !isAdmin && !isEnrolled) {
    return next(new ErrorResponse('Not authorized to access this quiz', 401));
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
  // Check if course exists
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.courseId}`, 404));
  }

  // Check if user is owner or admin
  const isOwner = course.createdBy.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return next(new ErrorResponse('Not authorized to create quiz for this course', 401));
  }

  // Validate quiz data
  const { title, questions, timeLimit } = req.body;
  
  if (!title || !title.trim()) {
    return next(new ErrorResponse('Quiz title is required', 400));
  }
  
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return next(new ErrorResponse('At least one question is required', 400));
  }
  
  if (!timeLimit || timeLimit < 1) {
    return next(new ErrorResponse('Time limit must be at least 1 minute', 400));
  }

  // Validate questions
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    
    if (!question.text || !question.text.trim()) {
      return next(new ErrorResponse(`Question ${i + 1} text is required`, 400));
    }
    
    if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
      return next(new ErrorResponse(`Question ${i + 1} must have at least 2 options`, 400));
    }
    
    const correctOptions = question.options.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      return next(new ErrorResponse(`Question ${i + 1} must have at least one correct answer`, 400));
    }
    
    if (question.type === 'single' && correctOptions.length > 1) {
      return next(new ErrorResponse(`Single choice question ${i + 1} can only have one correct answer`, 400));
    }
    
    // Validate options
    for (let j = 0; j < question.options.length; j++) {
      const option = question.options[j];
      if (!option.text || !option.text.trim()) {
        return next(new ErrorResponse(`Question ${i + 1}, option ${j + 1} text is required`, 400));
      }
    }
  }

  req.body.course = req.params.courseId;

  const quiz = await Quiz.create(req.body);
  await quiz.populate('course', 'title');

  res.status(201).json({
    success: true,
    data: quiz
  });
});

// @desc    Update quiz
// @route   PUT /api/v1/quizzes/:id
// @access  Private (Faculty/Admin - quiz course owner)
export const updateQuiz = asyncHandler(async (req, res, next) => {
  let quiz = await Quiz.findById(req.params.id).populate('course');

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  // Check if user is course owner or admin
  const isOwner = quiz.course.createdBy.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return next(new ErrorResponse('Not authorized to update this quiz', 401));
  }

  // Validate update data if provided
  const { title, questions, timeLimit } = req.body;
  
  if (title !== undefined && (!title || !title.trim())) {
    return next(new ErrorResponse('Quiz title cannot be empty', 400));
  }
  
  if (questions !== undefined) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return next(new ErrorResponse('At least one question is required', 400));
    }
    
    // Validate questions (same validation as create)
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      if (!question.text || !question.text.trim()) {
        return next(new ErrorResponse(`Question ${i + 1} text is required`, 400));
      }
      
      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        return next(new ErrorResponse(`Question ${i + 1} must have at least 2 options`, 400));
      }
      
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      if (correctOptions.length === 0) {
        return next(new ErrorResponse(`Question ${i + 1} must have at least one correct answer`, 400));
      }
      
      if (question.type === 'single' && correctOptions.length > 1) {
        return next(new ErrorResponse(`Single choice question ${i + 1} can only have one correct answer`, 400));
      }
    }
  }
  
  if (timeLimit !== undefined && timeLimit < 1) {
    return next(new ErrorResponse('Time limit must be at least 1 minute', 400));
  }

  quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('course', 'title');

  res.status(200).json({
    success: true,
    data: quiz
  });
});

// @desc    Delete quiz
// @route   DELETE /api/v1/quizzes/:id
// @access  Private (Faculty/Admin - quiz course owner)
export const deleteQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate('course');

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  // Check if user is course owner or admin
  const isOwner = quiz.course.createdBy.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return next(new ErrorResponse('Not authorized to delete this quiz', 401));
  }

  // Delete all quiz attempts first
  await QuizAttempt.deleteMany({ quiz: req.params.id });

  await quiz.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Submit quiz attempt
// @route   POST /api/v1/quizzes/:id/attempt
// @access  Private (Student/Faculty/Admin - enrolled or owner)
export const submitQuizAttempt = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate('course');

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  // Check access permissions
  const course = quiz.course;
  const isOwner = course.createdBy.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  const isEnrolled = course.enrolledStudents.includes(req.user.id);
  
  if (!isOwner && !isAdmin && !isEnrolled) {
    return next(new ErrorResponse('Not authorized to take this quiz', 401));
  }

  // Check if student has already attempted this quiz
  const existingAttempt = await QuizAttempt.findOne({
    quiz: req.params.id,
    student: req.user.id
  });

  if (existingAttempt) {
    return next(new ErrorResponse('You have already attempted this quiz', 400));
  }

  // Validate answers
  const { answers } = req.body;
  
  if (!answers || !Array.isArray(answers)) {
    return next(new ErrorResponse('Answers are required', 400));
  }

  if (answers.length !== quiz.questions.length) {
    return next(new ErrorResponse('All questions must be answered', 400));
  }

  // Calculate score
  let correctAnswers = 0;
  
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    const question = quiz.questions.find(q => q._id.toString() === answer.question);
    
    if (!question) {
      return next(new ErrorResponse(`Invalid question ID in answer ${i + 1}`, 400));
    }

    if (!answer.selectedOptions || !Array.isArray(answer.selectedOptions)) {
      return next(new ErrorResponse(`Invalid selected options for answer ${i + 1}`, 400));
    }

    // Get correct option IDs
    const correctOptionIds = question.options
      .filter(opt => opt.isCorrect)
      .map(opt => opt._id.toString());
    
    const selectedOptionIds = answer.selectedOptions.map(opt => opt.toString());
    
    // Check if answer is correct
    let isCorrect = false;
    
    if (question.type === 'single') {
      // For single choice, check if the one selected option is correct
      isCorrect = selectedOptionIds.length === 1 && 
                  correctOptionIds.includes(selectedOptionIds[0]);
    } else {
      // For multiple choice, all correct options must be selected and no incorrect ones
      isCorrect = correctOptionIds.length === selectedOptionIds.length &&
                  correctOptionIds.every(id => selectedOptionIds.includes(id)) &&
                  selectedOptionIds.every(id => correctOptionIds.includes(id));
    }
    
    if (isCorrect) {
      correctAnswers++;
    }
  }

  const score = Math.round((correctAnswers / quiz.questions.length) * 100);

  const attempt = await QuizAttempt.create({
    quiz: req.params.id,
    student: req.user.id,
    answers: answers,
    score: score,
    completedAt: Date.now()
  });

  await attempt.populate([
    { path: 'quiz', select: 'title' },
    { path: 'student', select: 'name email' }
  ]);

  res.status(201).json({
    success: true,
    data: attempt
  });
});

// @desc    Get quiz attempts for a quiz
// @route   GET /api/v1/quizzes/:id/attempts
// @access  Private (Faculty/Admin - quiz course owner)
export const getQuizAttempts = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate('course');

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  // Check if user is course owner or admin
  const isOwner = quiz.course.createdBy.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return next(new ErrorResponse('Not authorized to view quiz attempts', 401));
  }

  const attempts = await QuizAttempt.find({ quiz: req.params.id })
    .populate('student', 'name email')
    .populate('quiz', 'title')
    .sort({ completedAt: -1 });

  res.status(200).json({
    success: true,
    count: attempts.length,
    data: attempts
  });
});

// @desc    Get user's quiz attempt
// @route   GET /api/v1/quizzes/:id/my-attempt
// @access  Private (Student - own attempt)
export const getMyQuizAttempt = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate('course');

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  // Check access permissions
  const course = quiz.course;
  const isOwner = course.createdBy.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  const isEnrolled = course.enrolledStudents.includes(req.user.id);
  
  if (!isOwner && !isAdmin && !isEnrolled) {
    return next(new ErrorResponse('Not authorized to access this quiz', 401));
  }

  const attempt = await QuizAttempt.findOne({
    quiz: req.params.id,
    student: req.user.id
  })
    .populate('quiz', 'title questions')
    .populate('student', 'name email');

  if (!attempt) {
    return next(new ErrorResponse('No attempt found for this quiz', 404));
  }

  res.status(200).json({
    success: true,
    data: attempt
  });
});

// @desc    Get quiz statistics
// @route   GET /api/v1/quizzes/:id/stats
// @access  Private (Faculty/Admin - quiz course owner)
export const getQuizStats = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate('course');

  if (!quiz) {
    return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
  }

  // Check if user is course owner or admin
  const isOwner = quiz.course.createdBy.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return next(new ErrorResponse('Not authorized to view quiz statistics', 401));
  }

  const attempts = await QuizAttempt.find({ quiz: req.params.id });
  
  const totalAttempts = attempts.length;
  const scores = attempts.map(attempt => attempt.score);
  
  let stats = {
    totalAttempts,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    passRate: 0, // Assuming 60% is passing
    scoreDistribution: {
      excellent: 0, // 90-100%
      good: 0,      // 80-89%
      average: 0,   // 70-79%
      poor: 0       // below 70%
    }
  };

  if (totalAttempts > 0) {
    stats.averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / totalAttempts);
    stats.highestScore = Math.max(...scores);
    stats.lowestScore = Math.min(...scores);
    stats.passRate = Math.round((scores.filter(score => score >= 60).length / totalAttempts) * 100);
    
    // Score distribution
    scores.forEach(score => {
      if (score >= 90) stats.scoreDistribution.excellent++;
      else if (score >= 80) stats.scoreDistribution.good++;
      else if (score >= 70) stats.scoreDistribution.average++;
      else stats.scoreDistribution.poor++;
    });
  }

  res.status(200).json({
    success: true,
    data: stats
  });
});