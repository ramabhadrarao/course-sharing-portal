// src/controllers/courses.js
import Course from '../models/Course.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.js';

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

  // Make sure user is course owner
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course`, 401));
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

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

  // Make sure user is course owner
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this course`, 401));
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