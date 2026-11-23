import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const usuarios = pgTable("usuarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
});

export const produtos = pgTable(
  "produtos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nome: text("nome").notNull(),
    codigo: text("codigo").notNull(),
    categoria: text("categoria").notNull(),
    preco: numeric("preco", { precision: 12, scale: 2 }).notNull(),
    quantidadeEstoque: integer("quantidade_estoque").default(0).notNull(),
    limiteMinimo: integer("limite_minimo").default(0).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("produtos_codigo_unique").on(table.codigo)],
);

export const vendas = pgTable("vendas", {
  id: uuid("id").defaultRandom().primaryKey(),
  usuarioId: uuid("usuario_id").notNull().references(() => usuarios.id),
  valorTotal: numeric("valor_total", { precision: 12, scale: 2 }).notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow().notNull(),
});

export const itemVenda = pgTable("item_venda", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendaId: uuid("venda_id").notNull().references(() => vendas.id, { onDelete: "cascade" }),
  produtoId: uuid("produto_id").notNull().references(() => produtos.id),
  quantidade: integer("quantidade").notNull(),
  precoUnitario: numeric("preco_unitario", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});
