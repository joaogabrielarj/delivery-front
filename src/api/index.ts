// Camada de API: uma função por operação, com modo mock ou real por equipe.
// Variáveis (veja o README): VITE_MODE_<EQUIPE>=real e VITE_<EQUIPE>_URL.
// Hoje só o Financeiro (Eq. 5) tem API real; as outras usam mock até publicarem o Swagger.
import { cardapio, categorias, cupons, restaurantes } from "./mock/data";
import type {
  Categoria,
  Cupom,
  DadosCartao,
  ItemCardapio,
  ItemCarrinho,
  MetodoPagamento,
  NovaAvaliacao,
  Pagamento,
  Pedido,
  Rastreio,
  Restaurante,
  Usuario,
} from "./types";

type Equipe = "IDENTIDADE" | "CATALOGO" | "PEDIDOS" | "LOGISTICA" | "FINANCEIRO";

const env = import.meta.env as Record<string, string | undefined>;
const modoReal = (e: Equipe) => env[`VITE_MODE_${e}`] === "real";
const urlDe = (e: Equipe) => env[`VITE_${e}_URL`] ?? "";
const PAGAMENTOS = () => env.VITE_PAGAMENTOS_URL ?? "http://localhost:8013";
const AVALIACOES = () => env.VITE_AVALIACOES_URL ?? "http://localhost:8015";
const espera = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export class ErroApi extends Error {
  status: number;
  codigo?: string;
  constructor(mensagem: string, status = 0, codigo?: string) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}

async function http<T>(
  base: string,
  caminho: string,
  opcoes: { metodo?: string; corpo?: unknown; token?: string; chave?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opcoes.token) headers.Authorization = `Bearer ${opcoes.token}`;
  if (opcoes.chave) headers["Idempotency-Key"] = opcoes.chave;
  let resp: Response;
  try {
    resp = await fetch(`${base}${caminho}`, {
      method: opcoes.metodo ?? "GET",
      headers,
      body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
    });
  } catch {
    throw new ErroApi("Serviço indisponível. Tente de novo em instantes.", 503);
  }
  const dados = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
  if (!resp.ok) {
    throw new ErroApi(String(dados.mensagem ?? "Algo deu errado."), resp.status, dados.codigo as string | undefined);
  }
  return dados as T;
}

// ---------- Eq. 1: Identidade ----------
export async function entrar(email: string, senha: string): Promise<Usuario> {
  if (modoReal("IDENTIDADE")) {
    const r = await http<{ token: string; id: string; nome: string; papel: Usuario["papel"] }>(urlDe("IDENTIDADE"), "/tokens", {
      metodo: "POST",
      corpo: { email, senha },
    });
    return { id: r.id, nome: r.nome, email, papel: r.papel, token: r.token };
  }
  await espera();
  if (!email.includes("@") || senha.length < 3) throw new ErroApi("E-mail ou senha inválidos.", 401);
  return { id: "cliente-1", nome: email.split("@")[0], email, papel: "cliente", token: "mock-token" };
}

// ---------- Eq. 2: Catálogo ----------
export async function listarCategorias(): Promise<Categoria[]> {
  await espera(120);
  return categorias;
}

export async function listarRestaurantes(busca = "", categoria = ""): Promise<Restaurante[]> {
  await espera(200);
  const q = busca.trim().toLowerCase();
  return restaurantes.filter(
    (r) => (!categoria || r.categoria === categoria) && (!q || r.nome.toLowerCase().includes(q) || r.categoria.includes(q)),
  );
}

export async function obterRestaurante(id: string): Promise<{ restaurante: Restaurante; itens: ItemCardapio[] } | null> {
  await espera(200);
  const restaurante = restaurantes.find((r) => r.id === id);
  return restaurante ? { restaurante, itens: cardapio.filter((i) => i.restauranteId === id) } : null;
}

// ---------- Eq. 3: Checkout ----------
export async function validarCupom(codigo: string): Promise<Cupom> {
  await espera(250);
  const c = cupons.find((x) => x.codigo === codigo.trim().toUpperCase());
  if (!c) throw new ErroApi("Cupom inválido ou expirado.", 422);
  return c;
}

const CHAVE_PEDIDOS = "zeppel.pedidos";
const lerPedidos = (): Pedido[] => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_PEDIDOS) ?? "[]") as Pedido[];
  } catch {
    return [];
  }
};
const gravarPedidos = (p: Pedido[]) => {
  try {
    localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(p));
  } catch {
    /* sem armazenamento: o pedido vale só até recarregar */
  }
};

export async function criarPedido(
  restaurante: Restaurante,
  itens: ItemCarrinho[],
  cupom: Cupom | null,
): Promise<Pedido> {
  await espera();
  const subtotal = itens.reduce((s, x) => s + x.item.precoCentavos * x.quantidade, 0);
  const desconto = cupom ? Math.round((subtotal * cupom.descontoPercentual) / 100) : 0;
  const pedido: Pedido = {
    id: `ped-${Date.now().toString(36)}`,
    restauranteId: restaurante.id,
    restauranteNome: restaurante.nome,
    itens,
    subtotalCentavos: subtotal,
    descontoCentavos: desconto,
    freteCentavos: restaurante.freteCentavos,
    totalCentavos: subtotal - desconto + restaurante.freteCentavos,
    status: "em_preparo",
    criadoEm: new Date().toISOString(),
  };
  gravarPedidos([pedido, ...lerPedidos()]);
  return pedido;
}

export async function obterPedido(id: string): Promise<Pedido | null> {
  const p = lerPedidos().find((x) => x.id === id);
  if (!p) return null;
  return { ...p, status: statusPorTempo(p.criadoEm) };
}

export async function listarPedidos(): Promise<Pedido[]> {
  return lerPedidos().map((p) => ({ ...p, status: statusPorTempo(p.criadoEm) }));
}

// ---------- Eq. 4: Logística (rastreio simulado pelo tempo) ----------
const PREPARO_S = 20;
const ENTREGA_S = 40;
function statusPorTempo(criadoEm: string): Pedido["status"] {
  const s = (Date.now() - new Date(criadoEm).getTime()) / 1000;
  if (s < PREPARO_S) return "em_preparo";
  if (s < PREPARO_S + ENTREGA_S) return "saiu_para_entrega";
  return "entregue";
}

export async function obterRastreio(pedidoId: string): Promise<Rastreio> {
  const p = lerPedidos().find((x) => x.id === pedidoId);
  const s = p ? (Date.now() - new Date(p.criadoEm).getTime()) / 1000 : 0;
  const progresso = Math.min(Math.max((s - PREPARO_S) / ENTREGA_S, 0), 1);
  return { entregador: "Carlos M.", etaMin: Math.max(Math.ceil((1 - progresso) * 12), 0), progresso };
}

// ---------- Eq. 5: Financeiro ----------
export async function pagar(
  pedido: Pedido,
  metodo: MetodoPagamento,
  cartao: DadosCartao | null,
  usuario: Usuario,
): Promise<Pagamento> {
  if (modoReal("FINANCEIRO")) {
    try {
      const r = await http<{ id: string }>(PAGAMENTOS(), "/v1/pagamentos", {
        metodo: "POST",
        token: usuario.token,
        chave: `pedido-${pedido.id}`,
        corpo: { pedido_id: pedido.id, metodo, cartao: metodo === "cartao_credito" ? cartao : undefined },
      });
      return { id: r.id, pedidoId: pedido.id, status: "aprovado" };
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === "PAGAMENTO_RECUSADO") {
        return { id: "", pedidoId: pedido.id, status: "recusado", motivoRecusa: e.message };
      }
      throw e;
    }
  }
  await espera(900);
  const final = (cartao?.numero ?? "").replace(/\D/g, "").slice(-4);
  if (metodo === "cartao_credito" && final === "0002") {
    return { id: "", pedidoId: pedido.id, status: "recusado", motivoRecusa: "Saldo insuficiente." };
  }
  if (metodo === "cartao_credito" && final === "0119") {
    throw new ErroApi("A operadora demorou a responder. Tente de novo.", 503);
  }
  if (pedido.totalCentavos > 500000) {
    return { id: "", pedidoId: pedido.id, status: "recusado", motivoRecusa: "Em análise antifraude." };
  }
  const pagamento: Pagamento = { id: `pag-${Date.now().toString(36)}`, pedidoId: pedido.id, status: "aprovado" };
  gravarPedidos(lerPedidos().map((p) => (p.id === pedido.id ? { ...p, pagamentoId: pagamento.id } : p)));
  return pagamento;
}

export async function avaliar(nova: NovaAvaliacao, usuario: Usuario): Promise<void> {
  if (modoReal("FINANCEIRO")) {
    await http(AVALIACOES(), "/v1/avaliacoes", {
      metodo: "POST",
      token: usuario.token,
      corpo: {
        pedido_id: nova.pedidoId,
        nota_restaurante: nova.notaRestaurante,
        nota_entrega: nova.notaEntrega,
        comentario: nova.comentario || undefined,
      },
    });
    return;
  }
  await espera(500);
}
