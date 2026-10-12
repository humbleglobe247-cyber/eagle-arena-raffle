import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "../docs/swagger";

const router = Router();

// The raw spec, so Postman can import it.
router.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

router.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Raffle API Docs",
    swaggerOptions: { persistAuthorization: true },
  })
);

export default router;