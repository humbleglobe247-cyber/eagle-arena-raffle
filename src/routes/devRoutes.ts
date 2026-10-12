import { Router } from "express";
import { completePayment } from "../contollers/devController";

const router = Router();

/**
 * @openapi
 * /api/dev/payments/{reference}/complete:
 *   post:
 *     tags: [Dev]
 *     summary: Pretend a payment succeeded or failed (development only)
 *     description: >
 *       Exists only while the mock payment provider is on. It is not mounted in
 *       production and disappears when Paystack is switched on. After calling it,
 *       the frontend asks `GET /api/public/orders/{reference}`, which then issues
 *       the tickets (or reports the failure).
 *     security: []
 *     parameters:
 *       - name: reference
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: RAF-3f1c2a9e-8b7d-4c11-9a52-6d0e1b7f4a10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *     responses:
 *       200:
 *         description: The mock payment was updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: success
 *       404:
 *         description: No mock payment was started with that reference
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/payments/:reference/complete", completePayment);

export default router;