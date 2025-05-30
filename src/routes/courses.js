// ===== src/routes/courses.js =====
import express from 'express';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  joinCourse
} from '../controllers/courses.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(getCourses)
  .post(protect, authorize('faculty', 'admin'), createCourse);

router
  .route('/:id')
  .get(getCourse)
  .put(protect, authorize('faculty', 'admin'), updateCourse)
  .delete(protect, authorize('faculty', 'admin'), deleteCourse);

router.post('/:id/join', protect, authorize('student'), joinCourse);

export default router;