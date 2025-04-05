const Job = require('../models/jobModel');

// @desc    Create a new job
// @route   POST /api/jobs/create
// @access  Private/Employer
const createJob = async (req, res) => {
  try {
    const { title, description, budget, duration, skillsRequired } = req.body;

    if (!title || !description || !budget || !duration || !skillsRequired) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create job
    const job = await Job.create({
      title,
      description,
      budget,
      duration,
      skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : skillsRequired.split(',').map(skill => skill.trim()),
      postedBy: req.user._id,
    });

    res.status(201).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  try {
    const { skills } = req.query;
    let query = {};

    // Filter by skills if provided
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query = { skillsRequired: { $in: skillsArray } };
    }

    const jobs = await Job.find(query).populate('postedBy', 'name email');
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:jobId
// @access  Public
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).populate('postedBy', 'name email');

    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get jobs posted by employer
// @route   GET /api/jobs/my-jobs
// @access  Private/Employer
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id });
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createJob, getJobs, getJobById, getMyJobs }; 