import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { productsRoutes } from "./modules/products/products.routes.js";
import { salesRoutes } from "./modules/sales/sales.routes.js";

const app = new Elysia()
  .use(cors())
  .get("/health", () => ({ status: "ok", sistema: "Bita Motos" }))
  .use(productsRoutes)
  .use(salesRoutes)
  .listen(Number(process.env.API_PORT ?? 3000));

console.log(`API Bita Motos disponível em http://localhost:${app.server?.port}`);
