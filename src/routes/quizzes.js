// src/routes/quizzes.js - FIXED VERSION
import express from 'express';
import {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuizAttempt,
  getQuizAttempts,
  getMyQuizAttempt,
  getQuizStats
} from '../controllers/quizzes.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

// Course-specific quiz routes (these have courseId in params)
router
  .route('/')
  .get(getQuizzes) // Get all quizzes for a course - FIXED: Allow all authenticated users
  .post(authorize('faculty', 'admin'), createQuiz); // Create quiz for a course

// Individual quiz routes (these use the quiz ID directly)
// Note: These routes will be mounted at /api/v1/quizzes/:id from server.js
export const individualQuizRoutes = express.Router();
individualQuizRoutes.use(protect);

individualQuizRoutes
  .route('/:id')
  .get(getQuiz) // Get single quiz - FIXED: Allow all authenticated users with access check in controller
  .put(authorize('faculty', 'admin'), updateQuiz) // Update quiz
  .delete(authorize('faculty', 'admin'), deleteQuiz); // Delete quiz

// Quiz attempt routes - FIXED: Allow students to access their own attempts
individualQuizRoutes.post('/:id/attempt', submitQuizAttempt); // Submit quiz attempt
individualQuizRoutes.get('/:id/attempts', authorize('faculty', 'admin'), getQuizAttempts); // Get all attempts (faculty/admin)
individualQuizRoutes.get('/:id/my-attempt', getMyQuizAttempt); // Get user's own attempt - FIXED: Allow all authenticated users
individualQuizRoutes.get('/:id/stats', authorize('faculty', 'admin'), getQuizStats); // Get quiz statistics

export default router;