// src/controllers/courses.js - FIXED VERSION
import Course from '../models/Course.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads with better organization
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
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${basename}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, documents, videos, and other educational content
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf', 
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    // Videos
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
    // Audio
    'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
  ];

  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
    '.txt', '.csv', '.mp4', '.avi', '.mov', '.wmv', '.webm',
    '.mp3', '.wav', '.ogg', '.m4a', '.zip', '.rar', '.7z'
  ];

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (allowedTypes.includes(mimetype) || allowedExtensions.includes(extname)) {
    return cb(null, true);
  } else {
    cb(new ErrorResponse(`File type not supported. Allowed types: ${allowedExtensions.join(', ')}`, 400));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 5 // Maximum 5 files at once
  },
  fileFilter: fileFilter
});

// @desc    Upload file(s)
// @route   POST /api/v1/courses/upload
// @access  Private (Faculty/Admin)
export const uploadFile = asyncHandler(async (req, res, next) => {
  if (!req.file && !req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const files = req.files || [req.file];
  const uploadedFiles = [];

  for (const file of files) {
    const fileUrl = `/uploads/${file.filename}`;
    
    // Get file info
    const fileInfo = {
      filename: file.filename,
      originalName: file.originalname,
      fileUrl: fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    };

    uploadedFiles.push(fileInfo);
  }

  res.status(200).json({
    success: true,
    count: uploadedFiles.length,
    data: uploadedFiles.length === 1 ? uploadedFiles[0] : uploadedFiles
  });
});

// @desc    Delete uploaded file
// @route   DELETE /api/v1/courses/upload/:filename
// @access  Private (Faculty/Admin)
export const deleteUploadedFile = asyncHandler(async (req, res, next) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../public/uploads', filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    return next(new ErrorResponse('Failed to delete file', 500));
  }
});

// @desc    Get all courses
// @route   GET /api/v1/courses
// @access  Private (Different access based on role)
export const getCourses = asyncHandler(async (req, res, next) => {
  // Build query based on user role
  let query = {};
  
  // Add search functionality
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.search, 'i')] } }
    ];
  }

  // Add category filter
  if (req.query.category && req.query.category !== 'all') {
    query.category = req.query.category;
  }

  // Add difficulty filter
  if (req.query.difficulty && req.query.difficulty !== 'all') {
    query.difficulty = req.query.difficulty;
  }

  // Role-based filtering
  if (req.user) {
    if (req.user.role === 'admin') {
      // Admin can see all courses
      // No additional filtering needed
    } else if (req.user.role === 'faculty') {
      // Faculty see only courses they created
      query.createdBy = req.user.id;
    } else {
      // Students see all active courses (but content access is controlled separately)
      // This allows them to see available courses for joining
      query.isActive = true;
    }
  } else {
    // Unauthenticated users see only active courses
    query.isActive = true;
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  // Sort
  let sort = {};
  if (req.query.sort) {
    const sortField = req.query.sort.replace('-', '');
    sort[sortField] = req.query.sort.startsWith('-') ? -1 : 1;
  } else {
    sort = { updatedAt: -1 }; // Default: newest first
  }

  const courses = await Course.find(query)
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(startIndex)
    .limit(limit);

  const total = await Course.countDocuments(query);

  // Filter sensitive data based on user role
  const filteredCourses = courses.map(course => {
    const courseObj = course.toObject();
    
    // Only show access code to course owner
    if (req.user && (req.user.role === 'admin' || course.createdBy._id.toString() === req.user.id)) {
      // Keep access code for owner/admin
    } else {
      // Remove access code for others
      delete courseObj.accessCode;
    }
    
    return courseObj;
  });

  res.status(200).json({
    success: true,
    count: filteredCourses.length,
    total,
    pagination: {
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: filteredCourses
  });
});

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  Private (Access control based on enrollment/ownership)
export const getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('enrolledStudents', 'name email');

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Check access permissions
  let hasAccess = false;
  let canEdit = false;

  if (req.user) {
    const userId = req.user.id;
    const isOwner = course.createdBy._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';
    const isEnrolled = course.enrolledStudents.some(student => student._id.toString() === userId);

    hasAccess = isOwner || isAdmin || isEnrolled;
    canEdit = isOwner || isAdmin;

    // For non-owners/non-enrolled students, only show basic info
    if (!hasAccess && req.user.role === 'student') {
      // Return limited course info for joining purposes
      const limitedCourseInfo = {
        _id: course._id,
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription,
        coverImage: course.coverImage,
        category: course.category,
        difficulty: course.difficulty,
        createdBy: course.createdBy,
        enrolledStudentsCount: course.enrolledStudents ? course.enrolledStudents.length : 0,
        isActive: course.isActive,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        // Don't include sections, access code, or other sensitive data
        sections: [],
        totalContent: 0
      };

      return res.status(200).json({
        success: true,
        data: limitedCourseInfo
      });
    }

    // If user has access, increment view count (but not for owner)
    if (hasAccess && !isOwner) {
      course.analytics.totalViews += 1;
      await course.save();
    }
  }

  // Check if course is active (unless user is admin or owner)
  if (!course.isActive && !canEdit) {
    return next(new ErrorResponse('Course is not available', 404));
  }

  // Prepare response data
  const courseData = course.toObject();

  // Only include access code for owners/admins
  if (!canEdit) {
    delete courseData.accessCode;
  }

  res.status(200).json({
    success: true,
    data: courseData
  });
});

// @desc    Create new course
// @route   POST /api/v1/courses
// @access  Private (Faculty/Admin)
export const createCourse = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;

  // Validate required fields
  const { title, description, accessCode, category, difficulty } = req.body;
  
  if (!title || !title.trim()) {
    return next(new ErrorResponse('Course title is required', 400));
  }
  
  if (!description || !description.trim()) {
    return next(new ErrorResponse('Course description is required', 400));
  }
  
  if (!accessCode || !accessCode.trim()) {
    return next(new ErrorResponse('Access code is required', 400));
  }
  
  if (!category) {
    return next(new ErrorResponse('Course category is required', 400));
  }
  
  if (!difficulty) {
    return next(new ErrorResponse('Course difficulty is required', 400));
  }

  // Check if access code already exists
  const existingCourse = await Course.findOne({ 
    accessCode: accessCode.toUpperCase().trim()
  });
  
  if (existingCourse) {
    return next(new ErrorResponse('Access code already exists. Please choose a different one.', 400));
  }

  // Generate slug if not provided
  if (!req.body.slug && req.body.title) {
    req.body.slug = req.body.title.toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-');
  }

  // Ensure access code is uppercase
  req.body.accessCode = accessCode.toUpperCase().trim();

  // Initialize empty sections array
  req.body.sections = [];

  console.log('Creating course with data:', req.body);

  try {
    const course = await Course.create(req.body);
    
    // Populate the createdBy field before sending response
    await course.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Course creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ');
      return next(new ErrorResponse(message, 400));
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const message = `${field} already exists`;
      return next(new ErrorResponse(message, 400));
    }
    
    return next(new ErrorResponse('Failed to create course', 500));
  }
});

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private (Faculty/Admin - Owner only)
export const updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  // Check if access code is being changed and already exists
  if (req.body.accessCode && req.body.accessCode !== course.accessCode) {
    const existingCourse = await Course.findOne({ 
      accessCode: req.body.accessCode.toUpperCase().trim(),
      _id: { $ne: req.params.id }
    });
    
    if (existingCourse) {
      return next(new ErrorResponse('Access code already exists. Please choose a different one.', 400));
    }
    
    req.body.accessCode = req.body.accessCode.toUpperCase().trim();
  }

  // Update slug if title changed
  if (req.body.title && req.body.title !== course.title) {
    req.body.slug = req.body.title.toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-');
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
// @access  Private (Faculty/Admin - Owner only)
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
    const filesToDelete = [];
    
    // Collect all file URLs from subsections
    course.sections.forEach(section => {
      section.subsections.forEach(subsection => {
        if (subsection.fileUrl && subsection.fileUrl.startsWith('/uploads/')) {
          filesToDelete.push(subsection.fileUrl);
        }
      });
    });

    // Add course cover image
    if (course.coverImage && course.coverImage.startsWith('/uploads/')) {
      filesToDelete.push(course.coverImage);
    }

    // Delete files
    filesToDelete.forEach(fileUrl => {
      const filename = path.basename(fileUrl);
      const filePath = path.join(__dirname, '../public/uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
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

// @desc    Join course with access code
// @route   POST /api/v1/courses/join
// @access  Private (Student)
export const joinCourse = asyncHandler(async (req, res, next) => {
  const { accessCode } = req.body;

  if (!accessCode) {
    return next(new ErrorResponse('Access code is required', 400));
  }

  // Find course by access code
  const course = await Course.findOne({ 
    accessCode: accessCode.toUpperCase().trim(),
    isActive: true 
  });

  if (!course) {
    return next(new ErrorResponse('Invalid access code or course is not available', 400));
  }

  // Check if already enrolled
  if (course.enrolledStudents.includes(req.user.id)) {
    return next(new ErrorResponse('Already enrolled in this course', 400));
  }

  // Check if trying to join own course
  if (course.createdBy.toString() === req.user.id) {
    return next(new ErrorResponse('Cannot join your own course', 400));
  }

  // Add student to course
  course.enrolledStudents.push(req.user.id);
  await course.save();

  // Return course data without sensitive information
  await course.populate('createdBy', 'name email');
  const courseData = course.toObject();
  delete courseData.accessCode; // Don't send access code back

  res.status(200).json({
    success: true,
    message: 'Successfully joined the course',
    data: courseData
  });
});

// @desc    Leave course
// @route   POST /api/v1/courses/:id/leave
// @access  Private (Student)
export const leaveCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  if (!course.enrolledStudents.includes(req.user.id)) {
    return next(new ErrorResponse('You are not enrolled in this course', 400));
  }

  course.enrolledStudents.pull(req.user.id);
  await course.save();

  res.status(200).json({
    success: true,
    message: 'Successfully left the course',
    data: {}
  });
});

// @desc    Add section to course
// @route   POST /api/v1/courses/:id/sections
// @access  Private (Faculty/Admin - Owner only)
export const addSection = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  const newSection = {
    title: req.body.title,
    description: req.body.description || '',
    order: req.body.order || course.sections.length + 1,
    subsections: [],
    isActive: req.body.isActive !== undefined ? req.body.isActive : true
  };

  course.sections.push(newSection);
  await course.save();
  await course.populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Update section
// @route   PUT /api/v1/courses/:id/sections/:sectionId
// @access  Private (Faculty/Admin - Owner only)
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

  // Update section fields
  if (req.body.title !== undefined) section.title = req.body.title;
  if (req.body.description !== undefined) section.description = req.body.description;
  if (req.body.order !== undefined) section.order = req.body.order;
  if (req.body.isActive !== undefined) section.isActive = req.body.isActive;

  await course.save();
  await course.populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Delete section
// @route   DELETE /api/v1/courses/:id/sections/:sectionId
// @access  Private (Faculty/Admin - Owner only)
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
        const filename = path.basename(subsection.fileUrl);
        const filePath = path.join(__dirname, '../public/uploads', filename);
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
// @access  Private (Faculty/Admin - Owner only)
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

  // Process different URL types
  let processedVideoUrl = req.body.videoUrl;
  let processedFileUrl = req.body.fileUrl;

  // Process YouTube URL to embed format
  if (processedVideoUrl) {
    if (processedVideoUrl.includes('youtube.com/watch')) {
      const videoId = processedVideoUrl.split('v=')[1]?.split('&')[0];
      if (videoId) {
        processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (processedVideoUrl.includes('youtu.be/')) {
      const videoId = processedVideoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }
  }

  // Process Google Drive URL to direct view format
  if (processedFileUrl && processedFileUrl.includes('drive.google.com')) {
    if (processedFileUrl.includes('/file/d/')) {
      const fileId = processedFileUrl.split('/file/d/')[1]?.split('/')[0];
      if (fileId) {
        processedFileUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
  }

  const newSubsection = {
    title: req.body.title,
    content: req.body.content || '',
    contentType: req.body.contentType || 'text',
    order: req.body.order || section.subsections.length + 1,
    fileUrl: processedFileUrl,
    videoUrl: processedVideoUrl,
    embedUrl: req.body.embedUrl,
    linkUrl: req.body.linkUrl,
    metadata: req.body.metadata || {},
    isActive: req.body.isActive !== undefined ? req.body.isActive : true
  };

  section.subsections.push(newSubsection);
  await course.save();
  await course.populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Update subsection
// @route   PUT /api/v1/courses/:id/sections/:sectionId/subsections/:subsectionId
// @access  Private (Faculty/Admin - Owner only)
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
  let processedFileUrl = req.body.fileUrl;

  if (processedVideoUrl) {
    if (processedVideoUrl.includes('youtube.com/watch')) {
      const videoId = processedVideoUrl.split('v=')[1]?.split('&')[0];
      if (videoId) {
        processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (processedVideoUrl.includes('youtu.be/')) {
      const videoId = processedVideoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }
  }

  if (processedFileUrl && processedFileUrl.includes('drive.google.com')) {
    if (processedFileUrl.includes('/file/d/')) {
      const fileId = processedFileUrl.split('/file/d/')[1]?.split('/')[0];
      if (fileId) {
        processedFileUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
  }

  // Update subsection fields
  if (req.body.title !== undefined) subsection.title = req.body.title;
  if (req.body.content !== undefined) subsection.content = req.body.content;
  if (req.body.contentType !== undefined) subsection.contentType = req.body.contentType;
  if (req.body.order !== undefined) subsection.order = req.body.order;
  if (processedFileUrl !== undefined) subsection.fileUrl = processedFileUrl;
  if (processedVideoUrl !== undefined) subsection.videoUrl = processedVideoUrl;
  if (req.body.embedUrl !== undefined) subsection.embedUrl = req.body.embedUrl;
  if (req.body.linkUrl !== undefined) subsection.linkUrl = req.body.linkUrl;
  if (req.body.metadata !== undefined) subsection.metadata = { ...subsection.metadata, ...req.body.metadata };
  if (req.body.isActive !== undefined) subsection.isActive = req.body.isActive;

  await course.save();
  await course.populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Delete subsection
// @route   DELETE /api/v1/courses/:id/sections/:sectionId/subsections/:subsectionId
// @access  Private (Faculty/Admin - Owner only)
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
      const filename = path.basename(subsection.fileUrl);
      const filePath = path.join(__dirname, '../public/uploads', filename);
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

// @desc    Get course analytics
// @route   GET /api/v1/courses/:id/analytics
// @access  Private (Faculty/Admin - course owner)
export const getCourseAnalytics = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id)
    .populate('enrolledStudents', 'name email createdAt')
    .populate('createdBy', 'name email');

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is course owner or admin
  if (course.createdBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to view course analytics`, 401));
  }

  // Calculate additional analytics
  const analytics = {
    ...course.analytics.toObject(),
    enrollmentTrend: {
      thisMonth: course.enrolledStudents.filter(student => {
        const enrollmentDate = new Date(student.createdAt);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        return enrollmentDate >= thisMonth;
      }).length,
      lastMonth: course.enrolledStudents.filter(student => {
        const enrollmentDate = new Date(student.createdAt);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(1);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        return enrollmentDate >= lastMonth && enrollmentDate < thisMonth;
      }).length
    },
    contentStats: {
      totalSections: course.sections.length,
      totalSubsections: course.sections.reduce((total, section) => total + section.subsections.length, 0),
      contentTypes: course.sections.reduce((acc, section) => {
        section.subsections.forEach(sub => {
          acc[sub.contentType] = (acc[sub.contentType] || 0) + 1;
        });
        return acc;
      }, {})
    }
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
});