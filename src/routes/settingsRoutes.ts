// import { Router } from "express";
// import { get, update } from "../contollers/settingsController";
// import { requireAdmin } from "../middleware/requireAdmin";

// const router = Router();

// router.use(requireAdmin);

// router.get("/", get);
// router.put("/", update);

// export default router;

import { Router } from "express";
import { get, update } from "../contollers/settingsController";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Settings:
 *       type: object
 *       properties:
 *         ticketPrice:
 *           type: integer
 *           description: Price of one ticket in kobo (100000 = ₦1,000). 0 means no price has been set yet.
 *           example: 100000
 *         closesAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When ticket sales close. Null until the owner sets it.
 *           example: 2026-12-31T23:00:00.000Z
 *         nextTicketNumber:
 *           type: integer
 *           description: The number the next sold ticket will get. It starts at 1501 and is managed by the system.
 *           example: 1501
 *         salesOpen:
 *           type: boolean
 *           description: Calculated, not stored. True only when a price is set and the closing date is still in the future.
 *           example: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-10-10T11:00:00.000Z
 */

router.use(requireAdmin);

/**
 * @openapi
 * /api/admin/settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get the ticket price and closing date
 *     description: >
 *       There is only one set of settings. On a fresh install it comes back
 *       with no price and no closing date, which means sales are closed.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The current settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", get);

/**
 * @openapi
 * /api/admin/settings:
 *   put:
 *     tags: [Settings]
 *     summary: Change the ticket price and closing date
 *     description: >
 *       Send the price, the closing date, or both. Anything you leave out
 *       stays as it is. Send `closesAt` as a full timestamp (the admin form
 *       converts the owner's local time). A date in the past closes sales
 *       immediately, and `null` clears the date, which also closes sales.
 *       Changing the price later never changes past orders, because each
 *       order keeps the total it was bought for.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketPrice:
 *                 type: integer
 *                 minimum: 1
 *                 description: In kobo. ₦1,000 is 100000.
 *                 example: 100000
 *               closesAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: 2026-12-31T23:00:00.000Z
 *     responses:
 *       200:
 *         description: The updated settings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       400:
 *         description: Nothing was sent, the price is not a whole number above 0, or the date is not valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               nothingToUpdate:
 *                 value:
 *                   message: Nothing to update
 *               badPrice:
 *                 value:
 *                   message: Ticket price must be more than 0
 *               badDate:
 *                 value:
 *                   message: Closing date is not a valid date
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/", update);

export default router;