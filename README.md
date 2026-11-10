# Zeppel

Front-end da Plataforma de Delivery (Integração de Sistemas, UPE Garanhuns). Um app web responsivo, pensado primeiro para o celular, que cobre o fluxo completo: entrar, escolher restaurante, montar a sacola, pagar, acompanhar a entrega e avaliar.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # confere tipos e gera dist/
```

## Telas

| Rota | O que faz | Equipe dona do back-end |
|---|---|---|
| `/` | Busca, categorias e lista de restaurantes | 2 (Catálogo) |
| `/restaurante/:id` | Cardápio e adicionar à sacola | 2 (Catálogo) |
| `/carrinho` | Sacola, cupom e pagamento (Pix ou cartão) | 3 (Checkout) e 5 (Pagamentos) |
| `/pedido/:id` | Etapas do pedido, rastreio e avaliação | 3, 4 (Logística) e 5 (Avaliações) |
| `/pedidos` | Histórico | 3 (Pedidos) |
| `/entrar` | Login | 1 (Identidade) |

## Mock e API real

Toda chamada passa por `src/api/index.ts`. Cada equipe pode estar em modo mock (dados de mentira, o padrão) ou real. Para ligar uma equipe, crie um arquivo `.env.local`:

```
VITE_MODE_FINANCEIRO=real
VITE_PAGAMENTOS_URL=http://localhost:8013
VITE_AVALIACOES_URL=http://localhost:8015
```

| Equipe | Variável de modo | URL |
|---|---|---|
| 1 Identidade | `VITE_MODE_IDENTIDADE` | `VITE_IDENTIDADE_URL` |
| 2 Catálogo | `VITE_MODE_CATALOGO` | `VITE_CATALOGO_URL` |
| 3 Checkout | `VITE_MODE_PEDIDOS` | `VITE_PEDIDOS_URL` |
| 4 Logística | `VITE_MODE_LOGISTICA` | `VITE_LOGISTICA_URL` |
| 5 Financeiro | `VITE_MODE_FINANCEIRO` | `VITE_PAGAMENTOS_URL`, `VITE_AVALIACOES_URL` |

Estado atual: só o Financeiro (pagamento e avaliação) tem integração real escrita; as demais equipes seguem em mock até publicarem o Swagger. Ao integrar uma equipe, troque o corpo da função correspondente em `src/api/index.ts` mantendo a assinatura e os tipos de `src/api/types.ts`; as telas não mudam.

No mock do pagamento, cartão final `0002` simula recusa por saldo e final `0119` simula falha da operadora. Cupons de teste: `PRIMEIRA` (15%) e `ZEPPEL10` (10%).

## Contribuição

Uma branch por tarefa a partir de `main` (`feat/...`, `fix/...`), commits em português no formato `tipo(escopo): descrição` e PR para `main`.
