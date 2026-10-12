// import { Router } from "express";
// import {create, getOne, list, remove, update } from "../contollers/prizeController"
// import { requireAdmin } from "../middleware/requireAdmin";
// import { uploadImage } from "../middleware/uploadImage";

// const router = Router();

// router.use(requireAdmin);

// router.get("/", list);
// router.get("/:id", getOne);
// router.post("/", uploadImage, create);
// router.put("/", uploadImage, update)
// router.delete("/:id", remove);


// export default router;


import { Router } from "express";
import {
  create,
  getOne,
  list,
  remove,
  update,
} from "../contollers/prizeController";
import { requireAdmin } from "../middleware/requireAdmin";
import { uploadImage } from "../middleware/uploadImage";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Prize:
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
 *         imagePublicId:
 *           type: string
 *           nullable: true
 *           description: Cloudinary's name for the file. Used internally to delete old images.
 *           example: raffle/prizes/camry
 *   parameters:
 *     PrizeId:
 *       name: id
 *       in: path
 *       required: true
 *       description: The prize id
 *       schema:
 *         type: integer
 *         minimum: 1
 *       example: 1
 */

router.use(requireAdmin);

/**
 * @openapi
 * /api/admin/prizes:
 *   get:
 *     tags: [Prizes]
 *     summary: List all prizes
 *     description: Prizes come back in the order they were added.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All prizes (an empty list if there are none)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Prize'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", list);

/**
 * @openapi
 * /api/admin/prizes/{id}:
 *   get:
 *     tags: [Prizes]
 *     summary: Get one prize
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PrizeId'
 *     responses:
 *       200:
 *         description: The prize
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prize'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", getOne);

/**
 * @openapi
 * /api/admin/prizes:
 *   post:
 *     tags: [Prizes]
 *     summary: Add a prize
 *     description: >
 *       Sent as a form (multipart/form-data) because it includes a picture.
 *       The picture is uploaded to Cloudinary and the link is saved on the prize.
 *       Prizes have no price. They are only shown on the website.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, image]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 120
 *                 example: Toyota Camry 2025
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: A JPG, PNG or WebP picture, 5MB at most
 *     responses:
 *       201:
 *         description: The prize was created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prize'
 *       400:
 *         description: The name is missing or too long, the image is missing, too large, or not a JPG, PNG or WebP file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingName:
 *                 value:
 *                   message: Prize name is required
 *               missingImage:
 *                 value:
 *                   message: Prize image is required
 *               wrongType:
 *                 value:
 *                   message: Image must be a JPG, PNG or WebP file
 *               tooLarge:
 *                 value:
 *                   message: Image must be 5MB or smaller
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       502:
 *         description: Cloudinary could not store the image. Nothing was saved, so the request can be retried.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Image upload failed. Please try again.
 */
router.post("/", uploadImage, create);

/**
 * @openapi
 * /api/admin/prizes/{id}:
 *   put:
 *     tags: [Prizes]
 *     summary: Edit a prize
 *     description: >
 *       Send the name, a new image, or both. Fields you leave out stay as they are.
 *       Sent as a form (multipart/form-data). When a new image is sent, the old
 *       one is removed from Cloudinary.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PrizeId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 120
 *                 example: Toyota Camry 2025
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: A JPG, PNG or WebP picture, 5MB at most
 *     responses:
 *       200:
 *         description: The updated prize
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prize'
 *       400:
 *         description: Invalid id, nothing to update, an invalid name, or an invalid image
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               nothingToUpdate:
 *                 value:
 *                   message: Nothing to update
 *               invalidId:
 *                 value:
 *                   message: Invalid id
 *               wrongType:
 *                 value:
 *                   message: Image must be a JPG, PNG or WebP file
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       502:
 *         description: Cloudinary could not store the image. Nothing was changed, so the request can be retried.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Image upload failed. Please try again.
 */
router.put("/:id", uploadImage, update);

/**
 * @openapi
 * /api/admin/prizes/{id}:
 *   delete:
 *     tags: [Prizes]
 *     summary: Delete a prize
 *     description: Permanent. The picture is removed from Cloudinary too.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PrizeId'
 *     responses:
 *       204:
 *         description: The prize was deleted (no response body)
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:id", remove);

export default router;