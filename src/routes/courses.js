// src/routes/courses.js - FIXED VERSION
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

// Course enrollment routes (moved before main course routes to avoid conflicts)
router.post('/join', protect, authorize('student'), joinCourse); // Students join with access code
router.post('/:id/leave', protect, authorize('student'), leaveCourse); // Students leave course

// Main course routes
router
  .route('/')
  .get(protect, getCourses) // Now requires authentication
  .post(protect, authorize('faculty', 'admin'), createCourse);

router
  .route('/:id')
  .get(protect, getCourse) // Now requires authentication for access control
  .put(protect, authorize('faculty', 'admin'), updateCourse)
  .delete(protect, authorize('faculty', 'admin'), deleteCourse);

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