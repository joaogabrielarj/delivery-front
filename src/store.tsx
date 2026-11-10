import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Cupom, ItemCardapio, ItemCarrinho, Restaurante, Usuario } from "./api/types";

export const reais = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function lerLocal<T>(chave: string): T | null {
  try {
    const v = localStorage.getItem(chave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function gravarLocal(chave: string, valor: unknown) {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* sem armazenamento: vale só até recarregar */
  }
}

interface Sessao {
  usuario: Usuario | null;
  entrarCom: (u: Usuario) => void;
  sair: () => void;
}

interface Carrinho {
  restaurante: Restaurante | null;
  itens: ItemCarrinho[];
  cupom: Cupom | null;
  quantidadeTotal: number;
  subtotalCentavos: number;
  adicionar: (r: Restaurante, item: ItemCardapio) => void;
  alterar: (itemId: string, delta: number) => void;
  aplicarCupom: (c: Cupom | null) => void;
  limpar: () => void;
}

const SessaoCtx = createContext<Sessao | null>(null);
const CarrinhoCtx = createContext<Carrinho | null>(null);

export function Provedores({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => lerLocal<Usuario>("zeppel.usuario"));
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [cupom, setCupom] = useState<Cupom | null>(null);

  const entrarCom = useCallback((u: Usuario) => {
    setUsuario(u);
    gravarLocal("zeppel.usuario", u);
  }, []);
  const sair = useCallback(() => {
    setUsuario(null);
    gravarLocal("zeppel.usuario", null);
  }, []);

  const adicionar = useCallback(
    (r: Restaurante, item: ItemCardapio) => {
      // O carrinho é de um restaurante só: trocar de loja esvazia o carrinho.
      if (restaurante && restaurante.id !== r.id) {
        setItens([{ item, quantidade: 1 }]);
        setCupom(null);
      } else {
        setItens((atual) => {
          const existe = atual.find((x) => x.item.id === item.id);
          return existe
            ? atual.map((x) => (x.item.id === item.id ? { ...x, quantidade: x.quantidade + 1 } : x))
            : [...atual, { item, quantidade: 1 }];
        });
      }
      setRestaurante(r);
    },
    [restaurante],
  );

  const alterar = useCallback((itemId: string, delta: number) => {
    setItens((atual) =>
      atual
        .map((x) => (x.item.id === itemId ? { ...x, quantidade: x.quantidade + delta } : x))
        .filter((x) => x.quantidade > 0),
    );
  }, []);

  const limpar = useCallback(() => {
    setItens([]);
    setRestaurante(null);
    setCupom(null);
  }, []);

  const carrinho = useMemo<Carrinho>(
    () => ({
      restaurante: itens.length ? restaurante : null,
      itens,
      cupom,
      quantidadeTotal: itens.reduce((s, x) => s + x.quantidade, 0),
      subtotalCentavos: itens.reduce((s, x) => s + x.item.precoCentavos * x.quantidade, 0),
      adicionar,
      alterar,
      aplicarCupom: setCupom,
      limpar,
    }),
    [restaurante, itens, cupom, adicionar, alterar, limpar],
  );

  const sessao = useMemo(() => ({ usuario, entrarCom, sair }), [usuario, entrarCom, sair]);

  return (
    <SessaoCtx.Provider value={sessao}>
      <CarrinhoCtx.Provider value={carrinho}>{children}</CarrinhoCtx.Provider>
    </SessaoCtx.Provider>
  );
}

export function useSessao(): Sessao {
  const c = useContext(SessaoCtx);
  if (!c) throw new Error("useSessao fora do provedor");
  return c;
}

export function useCarrinho(): Carrinho {
  const c = useContext(CarrinhoCtx);
  if (!c) throw new Error("useCarrinho fora do provedor");
  return c;
}
