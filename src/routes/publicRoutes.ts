
import { Router } from "express";
import { site } from "../contollers/publicController";
import { request, verify } from "../contollers/verificationController";
import { create as createOrder } from "../contollers/orderController";
import { requirePurchaseToken } from "../middleware/requirePurchaseToken";
import { myTickets, orderStatus } from "../contollers/ticketController";
import { orderLimiter, orderStatusLimiter, verificationCheckLimiter, verificationRequestLimiter } from "../middleware/rateLimiter";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicPrize:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Toyota Camry 2025
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           example: https://res.cloudinary.com/demo/image/upload/v1/raffle/prizes/camry.jpg
 *     SiteData:
 *       type: object
 *       properties:
 *         currency:
 *           type: string
 *           example: NGN
 *         ticketPrice:
 *           type: integer
 *           description: Price of one ticket in kobo (100000 = ₦1,000). 0 means the owner has not set a price yet.
 *           example: 100000
 *         closesAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When ticket sales close. Null until the owner sets it.
 *           example: 2026-12-31T23:00:00.000Z
 *         salesOpen:
 *           type: boolean
 *           description: True only when a price is set and the closing date is still in the future.
 *           example: true
 *         serverTime:
 *           type: string
 *           format: date-time
 *           description: The server's current time, so a countdown can ignore a wrong clock on the visitor's device.
 *           example: 2026-10-10T11:00:00.000Z
 *         prizes:
 *           type: array
 *           description: Items that could be won, in the order they were added.
 *           items:
 *             $ref: '#/components/schemas/PublicPrize'
 *         winners:
 *           type: array
 *           description: Winning ticket numbers, in the order they were announced. Empty until the first announcement.
 *           items:
 *             type: integer
 *           example: [1523, 1788]
 */

/**
 * @openapi
 * /api/public/site:
 *   get:
 *     tags: [Public]
 *     summary: Everything the website needs to show on load
 *     description: >
 *       No login needed. Returns the prizes, the ticket price, the closing date,
 *       whether sales are open, and any announced winning ticket numbers.
 *       Buyer emails and other private data are never included. The response
 *       is never cached, because sales status and winners can change at any moment.
 *     security: []
 *     responses:
 *       200:
 *         description: The current site data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SiteData'
 *       500:
 *         description: Something went wrong on the server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Something went wrong
 */

// Everything on this router is public. Never mount admin routes here.
router.get("/site", site);

/**
 * @openapi
 * /api/public/verification/request:
 *   post:
 *     tags: [Public]
 *     summary: Email a 6-digit verification code
 *     description: >
 *       Starts a purchase. The code is valid for 10 minutes. A new code can be
 *       requested once a minute, and asking for a new one cancels the old one.
 *       Only works while ticket sales are open.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@example.com
 *     responses:
 *       200:
 *         description: The code was emailed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code sent
 *       400:
 *         description: Invalid email, or ticket sales are not open
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               badEmail:
 *                 value:
 *                   message: Enter a valid email address
 *               salesClosed:
 *                 value:
 *                   message: Ticket sales are not open right now
 *       429:
 *         description: A code was requested too recently
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Please wait 42 seconds before asking for a new code
 *       502:
 *         description: The email could not be sent. The request can be retried straight away.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: We could not send the email. Please try again.
 */
router.post("/verification/request", verificationRequestLimiter, request);

/**
 * @openapi
 * /api/public/verification/verify:
 *   post:
 *     tags: [Public]
 *     summary: Check the code and get a purchase token
 *     description: >
 *       A correct code returns a purchase token, valid for 15 minutes, which
 *       the order step requires. Each code works once and allows 5 wrong tries.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@example.com
 *               code:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *                 example: '482913'
 *     responses:
 *       200:
 *         description: The email is verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 purchaseToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Wrong, expired or already-used code, or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               wrongCode:
 *                 value:
 *                   message: That code is incorrect.
 *               expired:
 *                 value:
 *                   message: That code is invalid or has expired. Please request a new one.
 *       429:
 *         description: Too many wrong attempts on this code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Too many wrong attempts. Please request a new code.
 */
router.post("/verification/verify", verificationCheckLimiter, verify);

/**
 * @openapi
 * /api/public/orders:
 *   post:
 *     tags: [Public]
 *     summary: Start a ticket purchase
 *     description: >
 *       Needs the purchase token from the email verification step. The total
 *       is worked out by the server from the current ticket price. Returns a
 *       payment link: send the customer there to pay. Tickets are only issued
 *       after the payment is confirmed.
 *     security:
 *       - purchaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 5
 *     responses:
 *       201:
 *         description: The order was created and payment can start
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                   description: Identifies this order. Keep it to check the payment result later.
 *                   example: RAF-3f1c2a9e-8b7d-4c11-9a52-6d0e1b7f4a10
 *                 quantity:
 *                   type: integer
 *                   example: 5
 *                 amount:
 *                   type: integer
 *                   description: Total in kobo
 *                   example: 500000
 *                 authorizationUrl:
 *                   type: string
 *                   description: Send the customer to this page to pay
 *                   example: http://localhost:5173/payment/callback?reference=RAF-3f1c2a9e&mock=1
 *       400:
 *         description: Invalid quantity, ticket sales are not open, or the quantity is too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               badQuantity:
 *                 value:
 *                   message: You must buy at least 1 ticket
 *               salesClosed:
 *                 value:
 *                   message: Ticket sales are not open right now
 *       401:
 *         description: Missing, invalid or expired purchase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Your verification has expired. Please verify your email again.
 */
router.post("/orders", orderLimiter, requirePurchaseToken, createOrder);


/**
 * @openapi
 * /api/public/orders/{reference}:
 *   get:
 *     tags: [Public]
 *     summary: Check an order and get its tickets
 *     description: >
 *       Call this when the customer returns from the payment page. If the order
 *       is still unpaid it asks the payment provider what happened and, when the
 *       payment succeeded, issues the ticket numbers and emails them. Safe to
 *       call repeatedly: tickets are only ever issued once. While status is
 *       PENDING, poll every few seconds.
 *     security: []
 *     parameters:
 *       - name: reference
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: RAF-3f1c2a9e-8b7d-4c11-9a52-6d0e1b7f4a10
 *     responses:
 *       200:
 *         description: The order state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [PENDING, PAID, FAILED]
 *                 quantity:
 *                   type: integer
 *                   example: 3
 *                 amount:
 *                   type: integer
 *                   description: Total in kobo
 *                   example: 300000
 *                 email:
 *                   type: string
 *                   description: The buyer's email, partly hidden
 *                   example: j***@gmail.com
 *                 tickets:
 *                   type: array
 *                   description: Empty until the order is PAID
 *                   items:
 *                     type: integer
 *                   example: [1501, 1502, 1503]
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: The payment did not match the order. No tickets were issued.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: We could not confirm this payment. Please contact support.
 */
router.get("/orders/:reference", orderStatusLimiter, orderStatus);

/**
 * @openapi
 * /api/public/my-tickets:
 *   get:
 *     tags: [Public]
 *     summary: List every ticket bought with the verified email
 *     description: >
 *       Needs the purchase token from the email verification step, so a
 *       customer can look up their tickets later by verifying their email again.
 *     security:
 *       - purchaseAuth: []
 *     responses:
 *       200:
 *         description: All ticket numbers for this email, in order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   example: customer@example.com
 *                 tickets:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [1501, 1502, 1503, 1520]
 *       401:
 *         description: Missing, invalid or expired purchase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/my-tickets", requirePurchaseToken, myTickets);

export default router;