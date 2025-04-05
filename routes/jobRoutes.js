const express = require('express');
const router = express.Router();
const { createJob, getJobs, getJobById, getMyJobs } = require('../controllers/jobController');
const { protect, employerOnly } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: API for job management (Job posting limited to 20 requests per hour)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - budget
 *         - duration
 *         - skillsRequired
 *       properties:
 *         title:
 *           type: string
 *           description: Job title
 *         description:
 *           type: string
 *           description: Job description
 *         budget:
 *           type: number
 *           description: Job budget
 *         duration:
 *           type: number
 *           description: Job duration in days
 *         skillsRequired:
 *           type: array
 *           items:
 *             type: string
 *           description: Skills required for the job
 *       example:
 *         title: Full Stack Developer
 *         description: Need a developer to build a React and Node.js application
 *         budget: 1000
 *         duration: 30
 *         skillsRequired: [React, Node.js, MongoDB]
 */

/**
 * @swagger
 * /jobs/create:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Job'
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         description: Server error
 */
router.post('/create', protect, employerOnly, createJob);

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Filter jobs by skills (comma-separated)
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Job'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         description: Server error
 */
router.get('/', getJobs);

/**
 * @swagger
 * /jobs/{jobId}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the job
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         description: Server error
 */
router.get('/:jobId', getJobById);

/**
 * @swagger
 * /jobs/my-jobs:
 *   get:
 *     summary: Get jobs posted by the logged in employer
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of jobs posted by the employer
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Job'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         description: Server error
 */
router.get('/my-jobs', protect, employerOnly, getMyJobs);

module.exports = router; 