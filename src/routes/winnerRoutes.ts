import { Router } from "express";
import { announce, email, list, remove } from "../contollers/winnerController";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Winner:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         ticketNumber:
 *           type: integer
 *           example: 1523
 *         email:
 *           type: string
 *           nullable: true
 *           description: The buyer's full email. Visible to the admin only, never on the public site.
 *           example: customer@example.com
 *         announcedAt:
 *           type: string
 *           format: date-time
 *         emailedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the winner was emailed. Null if they have not been emailed yet.
 *         note:
 *           type: string
 *           nullable: true
 *           description: The message included in the winner email
 */

router.use(requireAdmin);

/**
 * @openapi
 * /api/admin/winners:
 *   get:
 *     tags: [Winners]
 *     summary: List announced winners
 *     description: In the order they were announced.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All announced winners (an empty list if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Winner'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", list);

/**
 * @openapi
 * /api/admin/winners:
 *   post:
 *     tags: [Winners]
 *     summary: Announce a winning ticket number
 *     description: >
 *       The number then appears on the public website straight away. Several
 *       winners can be announced, one after another. The ticket must exist and
 *       belong to a paid order. This does not email the winner: use the email
 *       endpoint for that.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ticketNumber]
 *             properties:
 *               ticketNumber:
 *                 type: integer
 *                 example: 1523
 *     responses:
 *       201:
 *         description: The winner was announced
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Winner'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No paid ticket has that number
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Ticket 1523 was not found
 *       409:
 *         description: That ticket has already been announced
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Ticket 1523 has already been announced
 */
router.post("/", announce);

/**
 * @openapi
 * /api/admin/winners/{id}:
 *   delete:
 *     tags: [Winners]
 *     summary: Remove an announcement
 *     description: >
 *       For fixing a mistake. The ticket number disappears from the public
 *       website. If the winner was already emailed, that email cannot be taken back.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       204:
 *         description: The announcement was removed (no response body)
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:id", remove);

/**
 * @openapi
 * /api/admin/winners/{id}/email:
 *   post:
 *     tags: [Winners]
 *     summary: Email the winner
 *     description: >
 *       Sends a congratulations email to the address the ticket was bought
 *       with, including the note written by the organisers (for example how to
 *       claim the prize). If the winner was already emailed, this is refused
 *       unless `resend` is true, so nobody gets the same email by accident.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 maxLength: 1000
 *                 description: A short message shown in the email, such as how to claim the prize
 *                 example: Please call 0800 000 0000 within 7 days to claim your prize.
 *               resend:
 *                 type: boolean
 *                 description: Set to true to email a winner who was already emailed
 *                 example: false
 *     responses:
 *       200:
 *         description: The email was sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Winner'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: This winner has already been emailed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *             message: "This winner has already been emailed. Send resend: true to email them again."
 *       502:
 *         description: The email could not be sent. Nothing was marked as emailed, so it can be retried.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:id/email", email);

export default router;