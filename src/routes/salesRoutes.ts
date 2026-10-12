import { Router } from "express";
import { buyers, orders, summary } from "../contollers/salesController";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SalesSummary:
 *       type: object
 *       properties:
 *         ticketsSold:
 *           type: integer
 *           example: 120
 *         revenue:
 *           type: integer
 *           description: Total from paid orders, in kobo
 *           example: 12000000
 *         paidOrders:
 *           type: integer
 *           example: 40
 *         pendingOrders:
 *           type: integer
 *           description: Checkouts that were started but not paid (some will be abandoned)
 *           example: 3
 *         failedOrders:
 *           type: integer
 *           example: 1
 *         uniqueBuyers:
 *           type: integer
 *           description: Different email addresses with at least one paid order
 *           example: 35
 *         ticketPrice:
 *           type: integer
 *           description: Current price of one ticket, in kobo
 *           example: 100000
 *         nextTicketNumber:
 *           type: integer
 *           description: The number the next sold ticket will get
 *           example: 1621
 *         closesAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         salesOpen:
 *           type: boolean
 *     SalesOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         reference:
 *           type: string
 *           example: RAF-3f1c2a9e-8b7d-4c11-9a52-6d0e1b7f4a10
 *         email:
 *           type: string
 *           example: customer@example.com
 *         quantity:
 *           type: integer
 *           example: 3
 *         amount:
 *           type: integer
 *           description: In kobo
 *           example: 300000
 *         status:
 *           type: string
 *           enum: [PENDING, PAID, FAILED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         paidAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         ticketFrom:
 *           type: integer
 *           nullable: true
 *           description: First ticket number in the order. Null until the order is paid.
 *           example: 1501
 *         ticketTo:
 *           type: integer
 *           nullable: true
 *           description: Last ticket number in the order. The order holds every number from ticketFrom to ticketTo.
 *           example: 1503
 *     Buyer:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           example: customer@example.com
 *         tickets:
 *           type: integer
 *           description: Total tickets bought
 *           example: 8
 *         totalSpent:
 *           type: integer
 *           description: In kobo
 *           example: 800000
 *         orders:
 *           type: integer
 *           example: 2
 *         lastPurchaseAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *   parameters:
 *     Page:
 *       name: page
 *       in: query
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *     Limit:
 *       name: limit
 *       in: query
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 20
 *     Search:
 *       name: search
 *       in: query
 *       description: Part of an email address, not case sensitive
 *       schema:
 *         type: string
 */

router.use(requireAdmin);

/**
 * @openapi
 * /api/admin/sales/summary:
 *   get:
 *     tags: [Sales]
 *     summary: Totals for the dashboard
 *     description: Tickets sold, revenue from paid orders, order counts and the current price and closing date.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The sales summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SalesSummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/summary", summary);

/**
 * @openapi
 * /api/admin/sales/orders:
 *   get:
 *     tags: [Sales]
 *     summary: List orders, newest first
 *     description: Filter by status or search by email. Results are paged.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Search'
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, FAILED]
 *     responses:
 *       200:
 *         description: One page of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SalesOrder'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                   description: Orders matching the filter, across all pages
 *                 totalPages:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/orders", orders);

/**
 * @openapi
 * /api/admin/sales/buyers:
 *   get:
 *     tags: [Sales]
 *     summary: List buyers, most recent first
 *     description: >
 *       One row per email address, adding up all of its paid orders. Pending and
 *       failed orders are not counted. Results are paged.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Search'
 *     responses:
 *       200:
 *         description: One page of buyers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Buyer'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 *                   description: True if another page follows
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/buyers", buyers);

export default router;