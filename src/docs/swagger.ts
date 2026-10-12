import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../config/env";


export const openApiSpec = swaggerJsdoc({
    failOnErrors: true, // a broken doc comment stops the server at startup instead of failing quietly
    apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
    definition: {
        openapi: "3.0.3",
        info: {
            title: "Raffle Draw API",
            version: "1.0.0",
            description: [
                "Backend API for the raffle draw website.",
                "",
                "- **Money** is always in kobo (₦1,000 = 100000).",
                "- **Admin endpoints** need a token: log in, click **Authorize**, and paste it.",
                '- **Errors** always look like `{ "message": "..." }`.',
            ].join("\n"),
        },
        servers: [
            { url: `http://localhost:${env.port}`, description: "Local development" },
        ],
        tags: [
            { name: "System", description: "Health check" },
            { name: "Admin Auth", description: "Admin login and account" },
            { name: "Prizes", description: "Items shown on the website as what could be won" },
            { name: "Public", description: "Open endpoints for the customer-facing website" },
            { name: "Dev", description: "development-only helpers (mock payments" },
             { name: "sales", description: "Tickets sold, revenue, orders and buyers" },
        ],
        
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "Token from POST /api/admin/login. Paste only the token, without the word Bearer.",
                },

                purchaseAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "The purchaseToken returned by POST /api/public/verification/verify. Valid for 15 minutes.",
                },
            },
            schemas: {
                Error: {
                    type: "object",
                    required: ["message"],
                    properties: {
                        message: { type: "string", example: "Something went wrong" },
                    },
                },
            },
            responses: {
                BadRequest: {
                    description: "The request data failed validation",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                            example: { message: "Email and password are required" },
                        },
                    },
                },
                Unauthorized: {
                    description: "Missing, invalid or expired token",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                            example: { message: "Not authorized" },
                        },
                    },
                },
                NotFound: {
                    description: "The item does not exist",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                            example: { message: "Prize not found" },
                        },
                    },
                },
            },
        },
    },
});