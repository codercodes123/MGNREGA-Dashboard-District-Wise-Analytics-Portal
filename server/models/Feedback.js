import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'mr'],
    default: 'en'
  },
  userAgent: String,
  ipAddress: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  }
});

// Create index for faster queries
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ district: 1 });
feedbackSchema.index({ status: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
