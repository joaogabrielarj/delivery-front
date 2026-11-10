export type Papel = "cliente" | "loja" | "entregador" | "admin";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  token: string;
}

export interface Categoria {
  id: string;
  nome: string;
  icone: string;
}

export interface Restaurante {
  id: string;
  nome: string;
  categoria: string;
  nota: number;
  tempoMin: number;
  tempoMax: number;
  freteCentavos: number;
  aberto: boolean;
  cor: string;
  icone: string;
}

export interface ItemCardapio {
  id: string;
  restauranteId: string;
  nome: string;
  descricao: string;
  precoCentavos: number;
  secao: string;
  icone: string;
}

export interface ItemCarrinho {
  item: ItemCardapio;
  quantidade: number;
}

export interface Cupom {
  codigo: string;
  descontoPercentual: number;
}

export type MetodoPagamento = "pix" | "cartao_credito";

export type StatusPedido = "em_preparo" | "saiu_para_entrega" | "entregue";

export interface Pedido {
  id: string;
  clienteId: string;
  restauranteId: string;
  restauranteNome: string;
  itens: ItemCarrinho[];
  subtotalCentavos: number;
  descontoCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  status: StatusPedido;
  pagamento?: Pagamento;
  criadoEm: string;
}

export interface Pagamento {
  id: string;
  pedidoId: string;
  status: "aprovado" | "recusado";
  motivoRecusa?: string;
  metodo?: MetodoPagamento;
  cartaoFinal?: string | null;
  criadoEm?: string;
}

export interface Rastreio {
  entregador: string;
  etaMin: number;
  progresso: number; // 0 a 1 do trajeto
}

export interface NovaAvaliacao {
  pedidoId: string;
  notaRestaurante: number;
  notaEntrega: number;
  comentario: string;
}

export interface DadosCartao {
  numero: string;
  titular: string;
  validade: string;
  cvv: string;
}
