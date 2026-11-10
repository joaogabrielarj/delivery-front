import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { obterRestaurante } from "../api";
import type { ItemCardapio, Restaurante } from "../api/types";
import { reais, useCarrinho } from "../store";

export function RestaurantePage() {
  const { id = "" } = useParams();
  const carrinho = useCarrinho();
  const [dados, setDados] = useState<{ restaurante: Restaurante; itens: ItemCardapio[] } | null | undefined>(undefined);

  useEffect(() => {
    void obterRestaurante(id).then(setDados);
  }, [id]);

  if (dados === undefined) return <p className="vazio">Carregando cardápio…</p>;
  if (dados === null)
    return (
      <p className="vazio">
        Restaurante não encontrado. <Link to="/">Voltar ao início</Link>
      </p>
    );

  const { restaurante: r, itens } = dados;
  const secoes = [...new Set(itens.map((i) => i.secao))];

  return (
    <>
      <section className="loja" style={{ background: r.cor }}>
        <span className="loja__icone" aria-hidden>
          {r.icone}
        </span>
        <div>
          <h1>{r.nome}</h1>
          <p>
            ★ {r.nota.toFixed(1)} · {r.categoria} · {r.tempoMin}-{r.tempoMax} min ·{" "}
            {r.freteCentavos === 0 ? "Entrega grátis" : `Entrega ${reais(r.freteCentavos)}`}
          </p>
        </div>
      </section>

      {!r.aberto ? <p className="aviso">Este restaurante está fechado agora. Você pode ver o cardápio, mas não pedir.</p> : null}

      {secoes.map((secao) => (
        <section key={secao}>
          <h2>{secao}</h2>
          <ul className="itens">
            {itens
              .filter((i) => i.secao === secao)
              .map((i) => {
                const qtd = carrinho.itens.find((x) => x.item.id === i.id)?.quantidade ?? 0;
                return (
                  <li key={i.id} className="item">
                    <div className="item__texto">
                      <span className="item__nome">{i.nome}</span>
                      <span className="item__desc">{i.descricao}</span>
                      <span className="item__preco">{reais(i.precoCentavos)}</span>
                    </div>
                    <span className="item__icone" aria-hidden>
                      {i.icone}
                    </span>
                    <button
                      type="button"
                      className="botao botao--pequeno"
                      disabled={!r.aberto}
                      onClick={() => carrinho.adicionar(r, i)}
                    >
                      {qtd > 0 ? `Adicionar mais (${qtd})` : "Adicionar"}
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      {carrinho.quantidadeTotal > 0 && carrinho.restaurante?.id === r.id ? (
        <Link to="/carrinho" className="barra-sacola">
          <span>Ver sacola · {carrinho.quantidadeTotal} {carrinho.quantidadeTotal === 1 ? "item" : "itens"}</span>
          <b>{reais(carrinho.subtotalCentavos)}</b>
        </Link>
      ) : null}
    </>
  );
}
