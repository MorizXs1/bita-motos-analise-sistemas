<script setup lang="ts">
import { computed, ref } from "vue";

interface Produto { id: string; nome: string; codigo: string; categoria: string; preco: number; quantidadeEstoque: number }
interface ItemCarrinho { produto: Produto; quantidade: number }

const busca = ref("");
const itens = ref<ItemCarrinho[]>([]);
const mensagem = ref("");
const catalogo = ref<Produto[]>([
  { id: "p1", nome: "Óleo 10W-40", codigo: "OL-1040", categoria: "Lubrificantes", preco: 38.9, quantidadeEstoque: 14 },
  { id: "p2", nome: "Pastilha de freio dianteira", codigo: "FR-220", categoria: "Freios", preco: 52, quantidadeEstoque: 8 },
  { id: "p3", nome: "Vela de ignição", codigo: "IG-015", categoria: "Motor", preco: 24.5, quantidadeEstoque: 5 },
]);

const produtosVisiveis = computed(() => catalogo.value.filter((p) =>
  `${p.nome} ${p.codigo}`.toLocaleLowerCase("pt-BR").includes(busca.value.toLocaleLowerCase("pt-BR")),
));
const total = computed(() => itens.value.reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0));
const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

function adicionar(produto: Produto) {
  mensagem.value = "";
  const item = itens.value.find((linha) => linha.produto.id === produto.id);
  if ((item?.quantidade ?? 0) >= produto.quantidadeEstoque) {
    mensagem.value = `Estoque disponível: ${produto.quantidadeEstoque} unidade(s).`;
    return;
  }
  if (item) item.quantidade += 1;
  else itens.value.push({ produto, quantidade: 1 });
}
function alterarQuantidade(item: ItemCarrinho, quantidade: number) {
  if (quantidade < 1) itens.value = itens.value.filter((linha) => linha !== item);
  else if (quantidade <= item.produto.quantidadeEstoque) item.quantidade = quantidade;
  else mensagem.value = `Estoque disponível: ${item.produto.quantidadeEstoque} unidade(s).`;
}
async function finalizarVenda() {
  mensagem.value = "";
  try {
    const resposta = await fetch("http://localhost:3000/vendas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      // Em produção, o usuário autenticado deve fornecer usuarioId; este UUID é apenas demonstrativo.
      body: JSON.stringify({ usuarioId: "00000000-0000-4000-8000-000000000001", itens: itens.value.map(({ produto, quantidade }) => ({ produtoId: produto.id, quantidade })) }),
    });
    const resultado = await resposta.json();
    if (!resposta.ok) throw new Error(resultado.erro ?? "Não foi possível registrar a venda.");
    mensagem.value = "Venda registrada com sucesso.";
    itens.value = [];
  } catch (erro) {
    // Os dados locais são demonstrativos; utilize produtos cadastrados na API para confirmar vendas.
    mensagem.value = erro instanceof Error ? erro.message : "Erro ao registrar a venda.";
  }
}
</script>

<template>
  <main class="app-shell">
    <header class="topbar"><a class="brand" href="#"><span class="brand-mark">B</span><span><strong>Bita Motos</strong><small>Oficina & Peças</small></span></a><div class="operator"><span class="online-dot"></span> Balcão de vendas <span class="avatar">BM</span></div></header>
    <section class="page-heading"><div><p class="eyebrow">OPERAÇÃO DA LOJA</p><h1>Nova venda</h1><p class="subtitle">Encontre peças e monte o pedido do cliente.</p></div><span class="status-pill">● Caixa aberto</span></section>
    <div class="workspace">
      <section class="panel products-panel"><div class="panel-heading"><div><p class="eyebrow">CATÁLOGO</p><h2>Produtos</h2></div><span class="count">{{ produtosVisiveis.length }} itens</span></div>
        <label class="search"><span>⌕</span><input v-model="busca" placeholder="Buscar por nome ou código..." /><kbd>⌘ K</kbd></label>
        <div class="product-list"><article v-for="produto in produtosVisiveis" :key="produto.id" class="product-row"><div class="product-icon">▧</div><div class="product-info"><strong>{{ produto.nome }}</strong><small>{{ produto.categoria }} <i>·</i> {{ produto.codigo }}</small></div><div class="product-stock"><strong>{{ moeda(produto.preco) }}</strong><small>{{ produto.quantidadeEstoque }} em estoque</small></div><button class="add-button" :aria-label="`Adicionar ${produto.nome}`" @click="adicionar(produto)">+</button></article><p v-if="!produtosVisiveis.length" class="empty">Nenhum produto encontrado.</p></div>
      </section>
      <section class="panel cart-panel"><div class="panel-heading"><div><p class="eyebrow">PEDIDO ATUAL</p><h2>Carrinho <span class="cart-count">{{ itens.length }}</span></h2></div><button class="text-button" :disabled="!itens.length" @click="itens = []">Limpar</button></div>
        <div v-if="!itens.length" class="empty-cart"><div class="cart-art">▱</div><strong>Seu carrinho está vazio</strong><p>Adicione produtos do catálogo para começar a venda.</p></div>
        <div v-else class="cart-list"><article v-for="item in itens" :key="item.produto.id" class="cart-row"><div class="product-icon small-icon">▧</div><div class="cart-item-info"><strong>{{ item.produto.nome }}</strong><small>{{ moeda(item.produto.preco) }} cada</small></div><div class="quantity"><button @click="alterarQuantidade(item, item.quantidade - 1)">−</button><span>{{ item.quantidade }}</span><button @click="alterarQuantidade(item, item.quantidade + 1)">+</button></div><strong class="line-total">{{ moeda(item.produto.preco * item.quantidade) }}</strong></article></div>
        <div class="checkout"><div class="summary-line"><span>Subtotal</span><strong>{{ moeda(total) }}</strong></div><div class="summary-line"><span>Desconto</span><span>—</span></div><div class="total-line"><span>Total da venda</span><strong>{{ moeda(total) }}</strong></div><button class="checkout-button" :disabled="!itens.length" @click="finalizarVenda">Finalizar venda <span>→</span></button><p v-if="mensagem" class="message">{{ mensagem }}</p><p class="secure-note">▣ &nbsp;Estoque validado ao confirmar a venda</p></div>
      </section>
    </div>
    <footer>BITA MOTOS <span>·</span> Sistema de gestão da loja</footer>
  </main>
</template>
