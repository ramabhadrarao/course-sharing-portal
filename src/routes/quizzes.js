/ ===== src/routes/quizzes.js =====
import express from 'express';
import {
  getQuizzes,
  getQuiz,
  createQuiz,
  submitQuizAttempt
} from '../controllers/quizzes.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(protect, getQuizzes)
  .post(protect, authorize('faculty', 'admin'), createQuiz);

router.get('/:id', protect, getQuiz);
router.post('/:id/attempt', protect, authorize('student'), submitQuizAttempt);

export default router;