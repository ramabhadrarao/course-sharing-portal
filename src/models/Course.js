// src/models/Course.js - FIXED VERSION
import mongoose from 'mongoose';
import slugify from 'slugify';

const subsectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a subsection title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
    maxlength: [50000, 'Content cannot be more than 50000 characters']
  },
  contentType: {
    type: String,
    enum: ['text', 'video', 'file', 'quiz', 'embed', 'link'],
    required: true,
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  videoUrl: {
    type: String,
    default: null
  },
  embedUrl: {
    type: String,
    default: null
  },
  linkUrl: {
    type: String,
    default: null
  },
  order: {
    type: Number,
    required: true,
    default: 1
  },
  metadata: {
    fileName: String,
    fileSize: Number,
    mimeType: String,
    duration: Number, // for videos
    description: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a section title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  order: {
    type: Number,
    required: true,
    default: 1
  },
  subsections: [subsectionSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot be more than 500 characters']
  },
  accessCode: {
    type: String,
    required: [true, 'Please add an access code'],
    unique: true,
    uppercase: true,
    minlength: [4, 'Access code must be at least 4 characters'],
    maxlength: [15, 'Access code cannot be more than 15 characters']
  },
  coverImage: {
    type: String,
    default: null
  },
  category: {
    type: String,
    enum: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering', 'Business', 'Arts', 'Language', 'Other'],
    default: 'Other'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: Number, // in hours
    default: 0
  },
  prerequisites: [String],
  learningOutcomes: [String],
  tags: [String],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledStudents: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  sections: [sectionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowDownloads: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalCompletions: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create course slug from the title
courseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true });
  }
  next();
});

// Set published date when course is published
courseSchema.pre('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  next();
});

// Virtual for enrolled students count
courseSchema.virtual('enrolledStudentsCount').get(function() {
  return Array.isArray(this.enrolledStudents) ? this.enrolledStudents.length : 0;
});

// FIXED: Virtual for total content count with proper null checks
courseSchema.virtual('totalContent').get(function() {
  if (!this.sections || !Array.isArray(this.sections)) {
    return 0;
  }
  
  return this.sections.reduce((total, section) => {
    if (!section || !section.subsections || !Array.isArray(section.subsections)) {
      return total;
    }
    return total + section.subsections.length;
  }, 0);
});

// FIXED: Virtual for estimated duration with proper null checks
courseSchema.virtual('estimatedDuration').get(function() {
  if (!this.sections || !Array.isArray(this.sections)) {
    return 0;
  }
  
  return this.sections.reduce((total, section) => {
    if (!section || !section.subsections || !Array.isArray(section.subsections)) {
      return total;
    }
    
    return total + section.subsections.reduce((sectionTotal, subsection) => {
      if (!subsection) {
        return sectionTotal;
      }
      
      // Estimate based on content type
      switch (subsection.contentType) {
        case 'video':
          return sectionTotal + (subsection.metadata?.duration || 10); // minutes
        case 'text':
          const contentLength = subsection.content ? subsection.content.length : 0;
          return sectionTotal + Math.max(5, Math.ceil(contentLength / 1000)); // 1 min per 1000 chars
        case 'file':
        case 'embed':
          return sectionTotal + 15; // 15 minutes default
        default:
          return sectionTotal + 5;
      }
    }, 0);
  }, 0);
});

// Ensure unique access code
courseSchema.pre('save', async function(next) {
  if (this.isModified('accessCode')) {
    // Check if access code already exists
    const existingCourse = await this.constructor.findOne({ 
      accessCode: this.accessCode,
      _id: { $ne: this._id }
    });
    
    if (existingCourse) {
      const error = new Error('Access code already exists');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// Index for better performance
courseSchema.index({ accessCode: 1 });
courseSchema.index({ createdBy: 1 });
courseSchema.index({ 'enrolledStudents': 1 });
courseSchema.index({ slug: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ isActive: 1, isPublished: 1 });
courseSchema.index({ tags: 1 });

// Text search index
courseSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

export default mongoose.model('Course', courseSchema);