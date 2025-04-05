const express = require('express');
const router = express.Router();
const { createBid, getBidsByJobId, acceptBid, rejectBid, getMyBids } = require('../controllers/bidController');
const { protect, employerOnly, freelancerOnly } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Bids
 *   description: API for bid management (Bidding limited to 30 requests per hour)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Bid:
 *       type: object
 *       required:
 *         - bidAmount
 *         - timeline
 *         - message
 *       properties:
 *         bidAmount:
 *           type: number
 *           description: Bid amount
 *         timeline:
 *           type: number
 *           description: Proposed timeline in days
 *         message:
 *           type: string
 *           description: Message to employer
 *       example:
 *         bidAmount: 900
 *         timeline: 25
 *         message: I can complete this project within the timeline and budget
 */

/**
 * @swagger
 * /bids/{jobId}:
 *   post:
 *     summary: Create a new bid for a job
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the job
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bid'
 *     responses:
 *       201:
 *         description: Bid created successfully
 *       400:
 *         description: Invalid input or already bid on this job
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Job not found
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         description: Server error
 */
router.post('/:jobId', protect, freelancerOnly, createBid);

/**
 * @swagger
 * /bids/{jobId}:
 *   get:
 *     summary: Get all bids for a job
 *     tags: [Bids]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the job
 *     responses:
 *       200:
 *         description: List of bids for the job
 *       404:
 *         description: Job not found
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         description: Server error
 */
router.get('/:jobId', getBidsByJobId);

/**
 * @swagger
 * /bids/my-bids:
 *   get:
 *     summary: Get all bids by the logged in freelancer
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bids by the freelancer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         description: Server error
 */
router.get('/my-bids', protect, freelancerOnly, getMyBids);

/**
 * @swagger
 * /bids/{bidId}/accept:
 *   patch:
 *     summary: Accept a bid (employer only)
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bidId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the bid
 *     responses:
 *       200:
 *         description: Bid accepted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Bid not found
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         description: Server error
 */
router.patch('/:bidId/accept', protect, employerOnly, acceptBid);

/**
 * @swagger
 * /bids/{bidId}/reject:
 *   patch:
 *     summary: Reject a bid (employer only)
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bidId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the bid
 *     responses:
 *       200:
 *         description: Bid rejected successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Bid not found
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         description: Server error
 */
router.patch('/:bidId/reject', protect, employerOnly, rejectBid);

module.exports = router; 