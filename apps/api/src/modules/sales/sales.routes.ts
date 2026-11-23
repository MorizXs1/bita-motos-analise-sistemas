import { Elysia, t } from "elysia";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { itemVenda, produtos, vendas } from "../../db/schema.js";

class SaleError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409) {
    super(message);
  }
}

export const salesRoutes = new Elysia({ prefix: "/vendas" }).post(
  "/",
  async ({ body, set }) => {
    try {
      // Junta linhas repetidas para que a validação considere toda a quantidade pedida.
      const quantidades = new Map<string, number>();
      for (const linha of body.itens) {
        quantidades.set(linha.produtoId, (quantidades.get(linha.produtoId) ?? 0) + linha.quantidade);
      }
      const ids = [...quantidades.keys()].sort();

      const venda = await db.transaction(async (tx) => {
        // Bloqueia os produtos até o commit. A ordenação reduz deadlocks em vendas concorrentes.
        const produtosBloqueados = await tx
          .select()
          .from(produtos)
          .where(inArray(produtos.id, ids))
          .orderBy(asc(produtos.id))
          .for("update");
        const porId = new Map(produtosBloqueados.map((produto) => [produto.id, produto]));

        for (const [produtoId, quantidade] of quantidades) {
          const produto = porId.get(produtoId);
          if (!produto) throw new SaleError(`Produto ${produtoId} não encontrado.`, 404);
          if (quantidade > produto.quantidadeEstoque) {
            throw new SaleError(
              `Estoque insuficiente para "${produto.nome}": solicitado ${quantidade}, disponível ${produto.quantidadeEstoque}.`,
              409,
            );
          }
        }

        const linhas = [...quantidades].map(([produtoId, quantidade]) => {
          const produto = porId.get(produtoId)!;
          const preco = Number(produto.preco);
          const subtotalCentavos = Math.round(preco * 100) * quantidade;
          return { produto, quantidade, subtotalCentavos };
        });
        const totalCentavos = linhas.reduce((total, linha) => total + linha.subtotalCentavos, 0);
        const [novaVenda] = await tx
          .insert(vendas)
          .values({ usuarioId: body.usuarioId, valorTotal: (totalCentavos / 100).toFixed(2) })
          .returning();

        await tx.insert(itemVenda).values(
          linhas.map(({ produto, quantidade, subtotalCentavos }) => ({
            vendaId: novaVenda.id,
            produtoId: produto.id,
            quantidade,
            precoUnitario: produto.preco,
            subtotal: (subtotalCentavos / 100).toFixed(2),
          })),
        );

        for (const { produto, quantidade } of linhas) {
          await tx
            .update(produtos)
            .set({
              quantidadeEstoque: produto.quantidadeEstoque - quantidade,
              atualizadoEm: new Date(),
            })
            .where(and(eq(produtos.id, produto.id), eq(produtos.quantidadeEstoque, produto.quantidadeEstoque)));
        }

        return { ...novaVenda, itens: linhas.map(({ produto, quantidade, subtotalCentavos }) => ({
          produtoId: produto.id,
          nome: produto.nome,
          quantidade,
          precoUnitario: produto.preco,
          subtotal: (subtotalCentavos / 100).toFixed(2),
        })) };
      });

      set.status = 201;
      return venda;
    } catch (error) {
      if (error instanceof SaleError) {
        set.status = error.status;
        return { erro: error.message };
      }
      if (error instanceof Error && error.message.includes("violates foreign key")) {
        set.status = 404;
        return { erro: "Usuário informado não encontrado." };
      }
      throw error;
    }
  },
  {
    body: t.Object({
      usuarioId: t.String({ format: "uuid" }),
      itens: t.Array(
        t.Object({
          produtoId: t.String({ format: "uuid" }),
          quantidade: t.Integer({ minimum: 1 }),
        }),
        { minItems: 1 },
      ),
    }),
    detail: { summary: "Registrar venda com validação e baixa atômica do estoque" },
  },
);
