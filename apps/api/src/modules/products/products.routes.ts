import { Elysia, t } from "elysia";
import { ilike, or } from "drizzle-orm";
import { db } from "../../db/client.js";
import { produtos } from "../../db/schema.js";

export const productsRoutes = new Elysia({ prefix: "/produtos" }).get(
  "/",
  ({ query }) => db.select().from(produtos).where(
    query.busca
      ? or(ilike(produtos.nome, `%${query.busca}%`), ilike(produtos.codigo, `%${query.busca}%`))
      : undefined,
  ).limit(30),
  { query: t.Object({ busca: t.Optional(t.String()) }) },
);
