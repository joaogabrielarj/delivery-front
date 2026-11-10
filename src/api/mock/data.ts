import type { Categoria, Cupom, ItemCardapio, Restaurante } from "../types";

export const categorias: Categoria[] = [
  { id: "lanches", nome: "Lanches", icone: "🍔" },
  { id: "pizza", nome: "Pizza", icone: "🍕" },
  { id: "japonesa", nome: "Japonesa", icone: "🍣" },
  { id: "brasileira", nome: "Brasileira", icone: "🍛" },
  { id: "doces", nome: "Doces", icone: "🍰" },
  { id: "saudavel", nome: "Saudável", icone: "🥗" },
];

export const restaurantes: Restaurante[] = [
  { id: "r1", nome: "Burger do Zé", categoria: "lanches", nota: 4.8, tempoMin: 25, tempoMax: 35, freteCentavos: 0, aberto: true, cor: "#ffe2c7", icone: "🍔" },
  { id: "r2", nome: "Pizzaria Nonna Lia", categoria: "pizza", nota: 4.7, tempoMin: 35, tempoMax: 50, freteCentavos: 599, aberto: true, cor: "#ffd9d6", icone: "🍕" },
  { id: "r3", nome: "Sushi Garanhuns", categoria: "japonesa", nota: 4.9, tempoMin: 40, tempoMax: 55, freteCentavos: 799, aberto: true, cor: "#e0f0ea", icone: "🍣" },
  { id: "r4", nome: "Cantinho da Dona Rita", categoria: "brasileira", nota: 4.6, tempoMin: 30, tempoMax: 45, freteCentavos: 499, aberto: true, cor: "#fff1bf", icone: "🍛" },
  { id: "r5", nome: "Doce Vó Lourdes", categoria: "doces", nota: 4.9, tempoMin: 20, tempoMax: 30, freteCentavos: 0, aberto: true, cor: "#fbdcec", icone: "🍰" },
  { id: "r6", nome: "Verde Bowl", categoria: "saudavel", nota: 4.5, tempoMin: 25, tempoMax: 40, freteCentavos: 399, aberto: false, cor: "#dcf0d2", icone: "🥗" },
];

const i = (
  id: string,
  restauranteId: string,
  secao: string,
  nome: string,
  descricao: string,
  precoCentavos: number,
  icone: string,
): ItemCardapio => ({ id, restauranteId, secao, nome, descricao, precoCentavos, icone });

export const cardapio: ItemCardapio[] = [
  i("i1", "r1", "Mais pedidos", "Zé Clássico", "Pão brioche, blend 160 g, queijo prato e molho da casa", 2890, "🍔"),
  i("i2", "r1", "Mais pedidos", "Zé Bacon", "Blend 160 g, bacon crocante, cheddar e cebola caramelizada", 3490, "🍔"),
  i("i3", "r1", "Acompanhamentos", "Batata rústica", "Porção para dividir, com alecrim", 1990, "🍟"),
  i("i4", "r1", "Bebidas", "Refrigerante lata", "350 ml", 650, "🥤"),
  i("i5", "r2", "Pizzas", "Margherita", "Molho de tomate, mussarela e manjericão. 8 fatias", 4290, "🍕"),
  i("i6", "r2", "Pizzas", "Calabresa", "Calabresa, cebola e azeitona. 8 fatias", 4590, "🍕"),
  i("i7", "r2", "Bebidas", "Guaraná 2 L", "Garrafa de 2 litros", 1090, "🥤"),
  i("i8", "r3", "Combinados", "Combinado 20 peças", "Sashimi, uramaki e niguiri variados", 6890, "🍣"),
  i("i9", "r3", "Quentes", "Hot roll (10 un.)", "Salmão empanado com cream cheese", 3290, "🍤"),
  i("i10", "r4", "Pratos do dia", "Feijoada completa", "Arroz, couve, farofa e laranja. Serve uma pessoa", 3190, "🍛"),
  i("i11", "r4", "Pratos do dia", "Baião de dois", "Com carne de sol e queijo coalho", 2790, "🍛"),
  i("i12", "r5", "Sobremesas", "Bolo de rolo", "Fatia generosa de goiabada", 1290, "🍰"),
  i("i13", "r5", "Sobremesas", "Pudim de leite", "Calda de caramelo", 1190, "🍮"),
  i("i14", "r6", "Bowls", "Bowl de frango", "Quinoa, frango grelhado, legumes e molho de iogurte", 3390, "🥗"),
];

export const cupons: Cupom[] = [
  { codigo: "PRIMEIRA", descontoPercentual: 15 },
  { codigo: "ZEPPEL10", descontoPercentual: 10 },
];
