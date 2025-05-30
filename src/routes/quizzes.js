const express = require('express');
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  submitQuizAttempt
} = require('../controllers/quizzes');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getQuizzes)
  .post(protect, authorize('faculty', 'admin'), createQuiz);

router.get('/:id', protect, getQuiz);
router.post('/:id/attempt', protect, authorize('student'), submitQuizAttempt);

module.exports = router;