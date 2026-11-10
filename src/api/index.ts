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
const urlDe = (e: Equipe) => env[`VITE_${e}_URL`] ?? `/api/${e.toLowerCase()}`;
const PAGAMENTOS = () => env.VITE_PAGAMENTOS_URL ?? "/api/pagamentos";
const AVALIACOES = () => env.VITE_AVALIACOES_URL ?? "/api/avaliacoes";
const PEDIDOS_MOCK = () => env.VITE_PEDIDOS_URL ?? "/api/pedidos";
const espera = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export class ErroApi extends Error {
  status: number;
  codigo?: string;
  motivo?: string;
  constructor(mensagem: string, status = 0, codigo?: string, motivo?: string) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.motivo = motivo;
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
    throw new ErroApi(String(dados.mensagem ?? "Algo deu errado."), resp.status, dados.codigo as string | undefined, dados.motivo as string | undefined);
  }
  return dados as T;
}

// ---------- Eq. 1: Identidade ----------
export async function entrar(email: string, senha: string): Promise<Usuario> {
  if (modoReal("IDENTIDADE")) {
    // Contrato do mock da Identidade (Eq. 1): POST /tokens {sub, papel, email, nome} -> {access_token}.
    // Quando a Eq. 1 publicar o login real, só este bloco muda.
    const id = email.split("@")[0].replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const nome = id;
    const r = await http<{ access_token: string }>(urlDe("IDENTIDADE"), "/tokens", {
      metodo: "POST",
      corpo: { sub: id, papel: "cliente", email, nome },
    });
    return { id, nome, email, papel: "cliente", token: r.access_token };
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
  clienteId: string,
): Promise<Pedido> {
  await espera();
  const subtotal = itens.reduce((s, x) => s + x.item.precoCentavos * x.quantidade, 0);
  const desconto = cupom ? Math.round((subtotal * cupom.descontoPercentual) / 100) : 0;
  const pedido: Pedido = {
    id: `ped-${Date.now().toString(36)}`,
    clienteId,
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
  // O pedido só é guardado quando o pagamento é aprovado (ver guardarPagamento).
  return pedido;
}

// Pedidos são do cliente que os fez: sem login ou com outra conta, não aparecem.
export async function obterPedido(id: string, clienteId: string): Promise<Pedido | null> {
  const p = lerPedidos().find((x) => x.id === id && x.clienteId === clienteId);
  if (!p) return null;
  return { ...p, status: statusPorTempo(p.criadoEm) };
}

export async function listarPedidos(clienteId: string): Promise<Pedido[]> {
  return lerPedidos()
    .filter((p) => p.clienteId === clienteId)
    .map((p) => ({ ...p, status: statusPorTempo(p.criadoEm) }));
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
      // Enquanto a Eq. 3 não está no ar, registramos o pedido no mock dela para o Pagamentos poder consultá-lo.
      await http(PEDIDOS_MOCK(), `/pedidos/${pedido.id}`, {
        metodo: "PUT",
        token: usuario.token,
        corpo: {
          cliente_id: usuario.id,
          restaurante_id: pedido.restauranteId,
          valor_total_centavos: pedido.totalCentavos,
          status: "confirmado",
        },
      });
      const r = await http<{ id: string; metodo: MetodoPagamento; cartao_final: string | null; criado_em: string }>(
        PAGAMENTOS(),
        "/v1/pagamentos",
        {
          metodo: "POST",
          token: usuario.token,
          chave: `pedido-${pedido.id}`,
          corpo: { pedido_id: pedido.id, metodo, cartao: metodo === "cartao_credito" ? cartao : undefined },
        },
      );
      const aprovado: Pagamento = {
        id: r.id,
        pedidoId: pedido.id,
        status: "aprovado",
        metodo: r.metodo,
        cartaoFinal: r.cartao_final,
        criadoEm: r.criado_em,
      };
      guardarPagamento(pedido, aprovado);
      return aprovado;
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === "PAGAMENTO_RECUSADO") {
        const motivos: Record<string, string> = {
          saldo_insuficiente: "Saldo insuficiente.",
          analise_antifraude: "Em análise antifraude.",
        };
        return { id: "", pedidoId: pedido.id, status: "recusado", motivoRecusa: motivos[e.motivo ?? ""] ?? "Recusado pelo emissor." };
      }
      throw e;
    }
  }
  await espera(900);
  if (metodo === "cartao_credito") {
    const problema = validarCartao(cartao);
    if (problema) throw new ErroApi(problema, 422);
  }
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
  const pagamento: Pagamento = {
    id: crypto.randomUUID(),
    pedidoId: pedido.id,
    status: "aprovado",
    metodo,
    cartaoFinal: metodo === "cartao_credito" ? final : null,
    criadoEm: new Date().toISOString(),
  };
  guardarPagamento(pedido, pagamento);
  return pagamento;
}

// O comprovante lê o pagamento guardado junto do pedido.
function guardarPagamento(pedido: Pedido, pagamento: Pagamento) {
  gravarPedidos([{ ...pedido, pagamento }, ...lerPedidos().filter((p) => p.id !== pedido.id)]);
}

export async function avaliar(nova: NovaAvaliacao, usuario: Usuario): Promise<void> {
  if (modoReal("FINANCEIRO")) {
    // A Eq. 4 ainda não existe: marcamos o pedido como entregue no mock da Eq. 3, que é o que Avaliações confere.
    await http(PEDIDOS_MOCK(), `/pedidos/${nova.pedidoId}`, {
      metodo: "PATCH",
      token: usuario.token,
      corpo: { status: "entregue" },
    });
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

// Validação de formato (não confere o número com o emissor).
export function validarCartao(c: DadosCartao | null): string | null {
  if (!c) return "Informe os dados do cartão.";
  const numero = c.numero.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(numero)) return "Número do cartão inválido: use de 13 a 19 dígitos.";
  if (c.titular.trim().length < 3) return "Informe o nome impresso no cartão.";
  const m = /^(\d{2})\/(\d{2})$/.exec(c.validade.trim());
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) return "Validade inválida: use o formato MM/AA.";
  const fim = new Date(2000 + Number(m[2]), Number(m[1]), 1);
  if (fim <= new Date()) return "Cartão vencido.";
  if (!/^\d{3,4}$/.test(c.cvv)) return "CVV inválido: use 3 ou 4 dígitos.";
  return null;
}
