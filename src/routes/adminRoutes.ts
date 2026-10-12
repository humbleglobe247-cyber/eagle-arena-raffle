import { Router } from "express";
import { changePassword, login, me } from "../contollers/authController";
import { requireAdmin } from "../middleware/requireAdmin";
import { forgotPassword, resetPassword, changeEmail } from "../contollers/accountContoller";
import { forgotPasswordLimiter, loginLimiter, resetPasswordLimiter } from "../middleware/rateLimiter";

const router = Router();

/**
 * @openapi
 * /api/admin/login:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Log in as the admin
 *     description: >
 *       Returns a token that is valid for one day. Send it on every admin
 *       request as `Authorization: Bearer <token>`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: owner@example.com
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login succeeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Wrong email or password (the response never says which one)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Invalid email or password
 */
router.post("/login", loginLimiter, login);

/**
 * @openapi
 * /api/admin/me:
 *   get:
 *     tags: [Admin Auth]
 *     summary: Get the logged-in admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The current admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: owner@example.com
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/me", requireAdmin, me);

/**
 * @openapi
 * /api/admin/password:
 *   put:
 *     tags: [Admin Auth]
 *     summary: Change the admin password
 *     description: >
 *       The current password must be correct. Existing login tokens stay
 *       valid until they expire.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least 8 characters, and different from the current password
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: No valid token, or the current password is wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Current password is incorrect
 */
router.put("/password", requireAdmin, changePassword);

/**
 * @openapi
 * /api/admin/forgot-password:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Email a password reset link
 *     description: >
 *       For the login page's "Forgot password?" link. The answer is always the
 *       same, whether or not the address is the admin's, so it can't be used to
 *       find out which email is registered. The link in the email opens the
 *       frontend's reset page, works once, and expires after 30 minutes. Asking
 *       again within a minute does nothing, and a new link cancels the old one.
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
 *                 example: owner@example.com
 *     responses:
 *       200:
 *         description: Always returned for a valid-looking email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: If that email belongs to the admin, a reset link has been sent.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         description: Too many requests from this network
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);

/**
 * @openapi
 * /api/admin/reset-password:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Set a new password using the emailed link
 *     description: >
 *       The frontend's reset page reads the `token` from the link and sends it
 *       here with the new password. Afterwards the admin logs in again.
 *       Login tokens issued before the reset stay valid until they expire (1 hour).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 description: The 64-character token from the reset link
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 72
 *     responses:
 *       200:
 *         description: The password was changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated. You can now log in.
 *       400:
 *         description: The new password is too short or long, or the link is invalid, expired or already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               badLink:
 *                 value:
 *                   message: This reset link is invalid or has expired. Please request a new one.
 *               shortPassword:
 *                 value:
 *                   message: New password must be at least 8 characters
 *       429:
 *         description: Too many requests from this network
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/reset-password", resetPasswordLimiter, resetPassword);

/**
 * @openapi
 * /api/admin/email:
 *   put:
 *     tags: [Admin Auth]
 *     summary: Change the admin email
 *     description: >
 *       Needs the current password. The login email changes straight away, and
 *       a notice is sent to the old address in case someone else made the
 *       change. Password reset links go to the new address, so make sure it
 *       is typed correctly (the form should ask for it twice).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newEmail]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 example: owner@newdomain.com
 *     responses:
 *       200:
 *         description: The email was changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email updated
 *                 email:
 *                   type: string
 *                   example: owner@newdomain.com
 *       400:
 *         description: Invalid email, or it is the same as the current one
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No valid token, or the current password is wrong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Current password is incorrect
 *       409:
 *         description: That address is already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/email", requireAdmin, changeEmail);

export default router;