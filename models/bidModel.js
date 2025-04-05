const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bidAmount: {
      type: Number,
      required: [true, 'Bid amount is required']
    },
    timeline: {
      type: Number,
      required: [true, 'Timeline is required'],
      comment: 'Timeline in days'
    },
    message: {
      type: String,
      required: [true, 'Message is required']
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

const Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid; 