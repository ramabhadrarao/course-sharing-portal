// src/models/Quiz.js
import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a quiz title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  questions: [{
    text: {
      type: String,
      required: [true, 'Please add a question']
    },
    options: [{
      text: {
        type: String,
        required: [true, 'Please add an option']
      },
      isCorrect: {
        type: Boolean,
        required: true
      }
    }],
    type: {
      type: String,
      enum: ['single', 'multiple'],
      default: 'single'
    }
  }],
  timeLimit: {
    type: Number,
    default: 30 // minutes
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Quiz', quizSchema);