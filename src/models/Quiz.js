// src/models/Quiz.js - FIXED VERSION
import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [500, 'Option text cannot be more than 500 characters']
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  _id: true // Ensure options have _id
});

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [2000, 'Question text cannot be more than 2000 characters']
  },
  options: {
    type: [optionSchema],
    required: true,
    validate: {
      validator: function(options) {
        return options && options.length >= 2;
      },
      message: 'Each question must have at least 2 options'
    }
  },
  type: {
    type: String,
    enum: ['single', 'multiple'],
    default: 'single',
    required: true
  }
}, {
  _id: true // Ensure questions have _id
});

// Add validation for correct answers
questionSchema.pre('validate', function(next) {
  if (this.options && this.options.length > 0) {
    const correctOptions = this.options.filter(option => option.isCorrect);
    
    if (correctOptions.length === 0) {
      return next(new Error('Each question must have at least one correct answer'));
    }
    
    if (this.type === 'single' && correctOptions.length > 1) {
      return next(new Error('Single choice questions can only have one correct answer'));
    }
  }
  next();
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a quiz title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'Quiz must belong to a course']
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: function(questions) {
        return questions && questions.length > 0;
      },
      message: 'Quiz must have at least one question'
    }
  },
  timeLimit: {
    type: Number,
    required: [true, 'Please add a time limit'],
    min: [1, 'Time limit must be at least 1 minute'],
    max: [300, 'Time limit cannot exceed 300 minutes'],
    default: 30
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    allowRetake: {
      type: Boolean,
      default: false
    }
  },
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    highestScore: {
      type: Number,
      default: 0
    },
    lowestScore: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for question count
quizSchema.virtual('questionCount').get(function() {
  return this.questions ? this.questions.length : 0;
});

// Virtual for total possible score
quizSchema.virtual('totalScore').get(function() {
  return this.questions ? this.questions.length * 100 : 0;
});

// Ensure at least one correct answer per question before saving
quizSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    for (let i = 0; i < this.questions.length; i++) {
      const question = this.questions[i];
      
      if (!question.options || question.options.length < 2) {
        return next(new Error(`Question ${i + 1} must have at least 2 options`));
      }
      
      const correctOptions = question.options.filter(option => option.isCorrect);
      
      if (correctOptions.length === 0) {
        return next(new Error(`Question ${i + 1} must have at least one correct answer`));
      }
      
      if (question.type === 'single' && correctOptions.length > 1) {
        return next(new Error(`Single choice question ${i + 1} can only have one correct answer`));
      }
      
      // Validate option texts
      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j].text || !question.options[j].text.trim()) {
          return next(new Error(`Question ${i + 1}, option ${j + 1} text is required`));
        }
      }
    }
  }
  next();
});

// Index for better performance
quizSchema.index({ course: 1, createdAt: -1 });
quizSchema.index({ course: 1, isActive: 1 });
quizSchema.index({ title: 'text' });

export default mongoose.model('Quiz', quizSchema);