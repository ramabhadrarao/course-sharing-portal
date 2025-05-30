const mongoose = require('mongoose');
const slugify = require('slugify');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  accessCode: {
    type: String,
    required: true,
    unique: true
  },
  coverImage: {
    type: String,
    default: 'default-course.jpg'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledStudents: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  sections: [{
    title: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    subsections: [{
      title: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      },
      contentType: {
        type: String,
        enum: ['text', 'video', 'file', 'quiz'],
        required: true
      },
      fileUrl: String,
      videoUrl: String,
      order: {
        type: Number,
        required: true
      }
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create course slug from the title
courseSchema.pre('save', function(next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

module.exports = mongoose.model('Course', courseSchema);