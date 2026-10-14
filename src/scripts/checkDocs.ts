import { readdirSync } from "node:fs";
import swaggerJsdoc from "swagger-jsdoc";

for (const file of readdirSync("./src/routes").filter((name) => name.endsWith(".ts"))) {
  try {
    swaggerJsdoc({
      failOnErrors: true,
      apis: [`./src/routes/${file}`],
      definition: { openapi: "3.0.3", info: { title: "check", version: "1" } },
    });
    console.log("ok   ", file);
  } catch (error) {
    console.log("FAIL ", file, "-", (error as Error).message.split("\n")[0]);
  }
}