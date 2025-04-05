const Bid = require('../models/bidModel');
const Job = require('../models/jobModel');

// @desc    Create a new bid
// @route   POST /api/bids/:jobId
// @access  Private/Freelancer
const createBid = async (req, res) => {
  try {
    const { bidAmount, timeline, message } = req.body;
    const jobId = req.params.jobId;

    if (!bidAmount || !timeline || !message) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if freelancer already placed a bid on this job
    const existingBid = await Bid.findOne({
      job: jobId,
      freelancer: req.user._id,
    });

    if (existingBid) {
      return res.status(400).json({ message: 'You have already placed a bid on this job' });
    }

    // Create bid
    const bid = await Bid.create({
      job: jobId,
      freelancer: req.user._id,
      bidAmount,
      timeline,
      message,
    });

    const populatedBid = await Bid.findById(bid._id)
      .populate('freelancer', 'name email')
      .populate('job', 'title');

    res.status(201).json(populatedBid);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all bids for a job
// @route   GET /api/bids/:jobId
// @access  Public
const getBidsByJobId = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const bids = await Bid.find({ job: jobId })
      .populate('freelancer', 'name email')
      .populate('job', 'title postedBy');

    res.json(bids);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Accept a bid
// @route   PATCH /api/bids/:bidId/accept
// @access  Private/Employer
const acceptBid = async (req, res) => {
  try {
    const bidId = req.params.bidId;

    // Find the bid
    const bid = await Bid.findById(bidId).populate('job');
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Check if the job belongs to the employer
    if (bid.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this bid' });
    }

    // Update the bid status to Accepted
    bid.status = 'Accepted';
    await bid.save();

    // Reject all other bids for this job
    await Bid.updateMany(
      { job: bid.job._id, _id: { $ne: bidId } },
      { status: 'Rejected' }
    );

    res.json(bid);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bid not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Reject a bid
// @route   PATCH /api/bids/:bidId/reject
// @access  Private/Employer
const rejectBid = async (req, res) => {
  try {
    const bidId = req.params.bidId;

    // Find the bid
    const bid = await Bid.findById(bidId).populate('job');
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Check if the job belongs to the employer
    if (bid.job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this bid' });
    }

    // Update the bid status to Rejected
    bid.status = 'Rejected';
    await bid.save();

    res.json(bid);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bid not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all bids by freelancer
// @route   GET /api/bids/my-bids
// @access  Private/Freelancer
const getMyBids = async (req, res) => {
  try {
    const bids = await Bid.find({ freelancer: req.user._id })
      .populate('job', 'title budget duration skillsRequired')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createBid, getBidsByJobId, acceptBid, rejectBid, getMyBids };