const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required']
    },
    description: {
      type: String,
      required: [true, 'Job description is required']
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      comment: 'Duration in days'
    },
    skillsRequired: {
      type: [String],
      required: [true, 'Skills are required']
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Job = mongoose.model('Job', jobSchema);

module.exports = Job; 