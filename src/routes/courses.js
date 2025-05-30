// src/routes/courses.js
import express from 'express';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  joinCourse,
  leaveCourse,
  addSection,
  updateSection,
  deleteSection,
  addSubsection,
  updateSubsection,
  deleteSubsection,
  uploadFile,
  deleteUploadedFile,
  getCourseAnalytics,
  upload
} from '../controllers/courses.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// File upload routes
router.post('/upload', protect, authorize('faculty', 'admin'), upload.single('file'), uploadFile);
router.post('/upload-multiple', protect, authorize('faculty', 'admin'), upload.array('files', 5), uploadFile);
router.delete('/upload/:filename', protect, authorize('faculty', 'admin'), deleteUploadedFile);

// Main course routes
router
  .route('/')
  .get(getCourses)
  .post(protect, authorize('faculty', 'admin'), createCourse);

router
  .route('/:id')
  .get(getCourse)
  .put(protect, authorize('faculty', 'admin'), updateCourse)
  .delete(protect, authorize('faculty', 'admin'), deleteCourse);

// Course enrollment routes
router.post('/:id/join', protect, authorize('student'), joinCourse);
router.post('/:id/leave', protect, authorize('student'), leaveCourse);

// Course analytics (for faculty/admin)
router.get('/:id/analytics', protect, authorize('faculty', 'admin'), getCourseAnalytics);

// Section management routes
router
  .route('/:id/sections')
  .post(protect, authorize('faculty', 'admin'), addSection);

router
  .route('/:id/sections/:sectionId')
  .put(protect, authorize('faculty', 'admin'), updateSection)
  .delete(protect, authorize('faculty', 'admin'), deleteSection);

// Subsection management routes
router
  .route('/:id/sections/:sectionId/subsections')
  .post(protect, authorize('faculty', 'admin'), addSubsection);

router
  .route('/:id/sections/:sectionId/subsections/:subsectionId')
  .put(protect, authorize('faculty', 'admin'), updateSubsection)
  .delete(protect, authorize('faculty', 'admin'), deleteSubsection);

export default router;