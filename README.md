# Bita Motos

Base inicial de um monólito modular em camadas para o Trabalho 4 de Análise de Sistemas.

## Estrutura

- `apps/web`: aplicação Vue 3 + TypeScript (tela de balcão).
- `apps/api`: API Elysia + TypeScript, módulos de produtos e vendas, persistência Drizzle.
- `apps/api/src/db/schema.ts`: tabelas PostgreSQL `usuarios`, `produtos`, `vendas` e `item_venda`.

## Executar

Requisitos: Node.js, Bun e PostgreSQL. Copie `.env.example` para `apps/api/.env` ou exporte `DATABASE_URL` e `API_PORT` no ambiente da API. Crie o banco `bita_motos`, instale as dependências com `npm install` e gere/aplique as migrações:

```sh
npm run db:generate
npm run db:migrate
npm run dev:api
npm run dev:web
```

API em `http://localhost:3000`; interface em `http://localhost:5173`.

## Venda

`POST /vendas` recebe `usuarioId` e uma lista de `{ produtoId, quantidade }`. O backend agrega itens repetidos, bloqueia as linhas dos produtos com `SELECT ... FOR UPDATE`, confere o saldo e grava venda, itens e baixa de estoque dentro da mesma transação. Falha de saldo retorna HTTP 409 e a transação inteira é revertida. `GET /produtos?busca=` pesquisa nome ou código.

O catálogo exibido no Vue é de demonstração. Para fechar uma venda com sucesso, o frontend precisa consumir produtos reais da API e enviar o UUID de um usuário existente. A autenticação e o cadastro de usuários/produtos são extensões seguintes do projeto.

## 🎨 Protótipo da Solução (Figma)

O protótipo conceitual e interativo foi estruturado para demonstrar o fluxo de ponta a ponta do MVP (Cadastro, Consulta, Venda e Tratamento de Erro/Estoque Insuficiente).

 [Acesse o Protótipo da Bita Motos no Figma]
 (https://www.figma.com/design/OSVb0OHRpr0GZGNW3HyGNs/Sem-t%C3%ADtulo?node-id=0-1&t=JzfSUVmSRAZYWGMf-1)