// src/controllers/courses.js
import Course from '../models/Course.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, documents, and videos
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|mp4|avi|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, documents, and videos are allowed'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter
});

// @desc    Upload file
// @route   POST /api/v1/courses/upload
// @access  Private (Faculty/Admin)
export const uploadFile = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  
  res.status(200).json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    }
  });
});

// @desc    Get all courses
// @route   GET /api/v1/courses
// @access  Public
export const getCourses = asyncHandler(async (req, res, next) => {
  const courses = await Course.find().populate('createdBy', 'name email');
  
  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses
  });
});

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  Public
export const getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate('createdBy', 'name email');

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Create new course
// @route   POST /api/v1/courses
// @access  Private (Faculty/Admin)
export const createCourse = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  const course = await Course.create(req.body);
  
  // Populate the createdBy field before sending response
  await course.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    data: course
  });
});

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private (Faculty/Admin)
export const updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  // Update course
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private (Faculty/Admin)
export const deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this course`, 401));
  }

  // Delete associated files
  try {
    course.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        if (subsection.fileUrl && subsection.fileUrl.startsWith('/uploads/')) {
          const filePath = path.join(__dirname, '../public', subsection.fileUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    });

    // Delete course cover image if it's locally stored
    if (course.coverImage && course.coverImage.startsWith('/uploads/')) {
      const coverPath = path.join(__dirname, '../public', course.coverImage);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }
  } catch (error) {
    console.log('Error deleting files:', error);
    // Continue with course deletion even if file deletion fails
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Join course
// @route   POST /api/v1/courses/:id/join
// @access  Private (Student)
export const joinCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findOne({ 
    _id: req.params.id,
    accessCode: req.body.accessCode
  });

  if (!course) {
    return next(new ErrorResponse('Invalid course ID or access code', 400));
  }

  if (course.enrolledStudents.includes(req.user.id)) {
    return next(new ErrorResponse('Already enrolled in this course', 400));
  }

  course.enrolledStudents.push(req.user.id);
  await course.save();

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Add section to course
// @route   POST /api/v1/courses/:id/sections
// @access  Private (Faculty/Admin)
export const addSection = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  course.sections.push({
    title: req.body.title,
    order: req.body.order || course.sections.length + 1,
    subsections: []
  });

  await course.save();
  await course.populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Update section
// @route   PUT /api/v1/courses/:id/sections/:sectionId
// @access  Private (Faculty/Admin)
export const updateSection = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  const section = course.sections.id(req.params.sectionId);
  if (!section) {
    return next(new ErrorResponse(`Section not found with id of ${req.params.sectionId}`, 404));
  }

  section.title = req.body.title || section.title;
  section.order = req.body.order || section.order;

  await course.save();
  await course.populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Delete section
// @route   DELETE /api/v1/courses/:id/sections/:sectionId
// @access  Private (Faculty/Admin)
export const deleteSection = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  const section = course.sections.id(req.params.sectionId);
  if (!section) {
    return next(new ErrorResponse(`Section not found with id of ${req.params.sectionId}`, 404));
  }

  // Delete associated files from subsections
  try {
    section.subsections.forEach(subsection => {
      if (subsection.fileUrl && subsection.fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../public', subsection.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });
  } catch (error) {
    console.log('Error deleting section files:', error);
  }

  course.sections.pull(req.params.sectionId);
  await course.save();
  await course.populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Add subsection to section
// @route   POST /api/v1/courses/:id/sections/:sectionId/subsections
// @access  Private (Faculty/Admin)
export const addSubsection = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  const section = course.sections.id(req.params.sectionId);
  if (!section) {
    return next(new ErrorResponse(`Section not found with id of ${req.params.sectionId}`, 404));
  }

  // Process YouTube URL to embed format
  let processedVideoUrl = req.body.videoUrl;
  if (processedVideoUrl && processedVideoUrl.includes('youtube.com/watch')) {
    const videoId = processedVideoUrl.split('v=')[1]?.split('&')[0];
    if (videoId) {
      processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  } else if (processedVideoUrl && processedVideoUrl.includes('youtu.be/')) {
    const videoId = processedVideoUrl.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  }

  // Process Google Drive URL to direct view format
  let processedFileUrl = req.body.fileUrl;
  if (processedFileUrl && processedFileUrl.includes('drive.google.com')) {
    if (processedFileUrl.includes('/file/d/')) {
      const fileId = processedFileUrl.split('/file/d/')[1]?.split('/')[0];
      if (fileId) {
        processedFileUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
  }

  section.subsections.push({
    title: req.body.title,
    content: req.body.content,
    contentType: req.body.contentType,
    order: req.body.order || section.subsections.length + 1,
    fileUrl: processedFileUrl,
    videoUrl: processedVideoUrl,
    embedUrl: req.body.embedUrl,
    metadata: req.body.metadata
  });

  await course.save();
  await course.populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Update subsection
// @route   PUT /api/v1/courses/:id/sections/:sectionId/subsections/:subsectionId
// @access  Private (Faculty/Admin)
export const updateSubsection = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  const section = course.sections.id(req.params.sectionId);
  if (!section) {
    return next(new ErrorResponse(`Section not found with id of ${req.params.sectionId}`, 404));
  }

  const subsection = section.subsections.id(req.params.subsectionId);
  if (!subsection) {
    return next(new ErrorResponse(`Subsection not found with id of ${req.params.subsectionId}`, 404));
  }

  // Process URLs similar to add subsection
  let processedVideoUrl = req.body.videoUrl;
  if (processedVideoUrl && processedVideoUrl.includes('youtube.com/watch')) {
    const videoId = processedVideoUrl.split('v=')[1]?.split('&')[0];
    if (videoId) {
      processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  } else if (processedVideoUrl && processedVideoUrl.includes('youtu.be/')) {
    const videoId = processedVideoUrl.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  }

  let processedFileUrl = req.body.fileUrl;
  if (processedFileUrl && processedFileUrl.includes('drive.google.com')) {
    if (processedFileUrl.includes('/file/d/')) {
      const fileId = processedFileUrl.split('/file/d/')[1]?.split('/')[0];
      if (fileId) {
        processedFileUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
  }

  subsection.title = req.body.title || subsection.title;
  subsection.content = req.body.content || subsection.content;
  subsection.contentType = req.body.contentType || subsection.contentType;
  subsection.order = req.body.order || subsection.order;
  subsection.fileUrl = processedFileUrl !== undefined ? processedFileUrl : subsection.fileUrl;
  subsection.videoUrl = processedVideoUrl !== undefined ? processedVideoUrl : subsection.videoUrl;
  subsection.embedUrl = req.body.embedUrl !== undefined ? req.body.embedUrl : subsection.embedUrl;
  subsection.metadata = req.body.metadata !== undefined ? req.body.metadata : subsection.metadata;

  await course.save();
  await course.populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Delete subsection
// @route   DELETE /api/v1/courses/:id/sections/:sectionId/subsections/:subsectionId
// @access  Private (Faculty/Admin)
export const deleteSubsection = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  const section = course.sections.id(req.params.sectionId);
  if (!section) {
    return next(new ErrorResponse(`Section not found with id of ${req.params.sectionId}`, 404));
  }

  const subsection = section.subsections.id(req.params.subsectionId);
  if (!subsection) {
    return next(new ErrorResponse(`Subsection not found with id of ${req.params.subsectionId}`, 404));
  }

  // Delete associated file if it's locally stored
  try {
    if (subsection.fileUrl && subsection.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../public', subsection.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.log('Error deleting subsection file:', error);
  }

  section.subsections.pull(req.params.subsectionId);
  await course.save();
  await course.populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});