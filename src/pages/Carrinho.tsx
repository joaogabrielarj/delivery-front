import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { criarPedido, ErroApi, pagar, validarCartao, validarCupom } from "../api";
import type { DadosCartao, MetodoPagamento } from "../api/types";
import { reais, useCarrinho, useSessao } from "../store";

const cartaoVazio: DadosCartao = { numero: "", titular: "", validade: "", cvv: "" };

export function Carrinho() {
  const c = useCarrinho();
  const { usuario } = useSessao();
  const navegar = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [msgCupom, setMsgCupom] = useState("");
  const [metodo, setMetodo] = useState<MetodoPagamento>("pix");
  const [cartao, setCartao] = useState(cartaoVazio);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!c.restaurante || c.itens.length === 0) {
    return (
      <section className="cartao cartao--estreito">
        <h1>Sua sacola está vazia</h1>
        <p className="mudo">Escolha um restaurante e adicione os pratos que quiser.</p>
        <Link to="/" className="botao">
          Ver restaurantes
        </Link>
      </section>
    );
  }

  const restaurante = c.restaurante;
  const desconto = c.cupom ? Math.round((c.subtotalCentavos * c.cupom.descontoPercentual) / 100) : 0;
  const total = c.subtotalCentavos - desconto + restaurante.freteCentavos;

  async function aplicar() {
    setMsgCupom("");
    try {
      const cupom = await validarCupom(codigo);
      c.aplicarCupom(cupom);
      setMsgCupom(`Cupom aplicado: ${cupom.descontoPercentual}% de desconto.`);
    } catch (e) {
      c.aplicarCupom(null);
      setMsgCupom(e instanceof ErroApi ? e.message : "Não foi possível validar o cupom.");
    }
  }

  async function finalizar(e: FormEvent) {
    e.preventDefault();
    if (!usuario) {
      navegar("/entrar?voltar=/carrinho");
      return;
    }
    setErro("");
    if (metodo === "cartao_credito") {
      const problema = validarCartao(cartao);
      if (problema) {
        setErro(problema);
        return;
      }
    }
    setEnviando(true);
    try {
      const pedido = await criarPedido(restaurante, c.itens, c.cupom, usuario.id);
      const pagamento = await pagar(pedido, metodo, metodo === "cartao_credito" ? cartao : null, usuario);
      if (pagamento.status === "recusado") {
        setErro(`Pagamento recusado. ${pagamento.motivoRecusa ?? "Tente outro cartão."}`);
        return;
      }
      c.limpar();
      navegar(`/pedido/${pedido.id}`);
    } catch (err) {
      setErro(err instanceof ErroApi ? err.message : "Não foi possível finalizar o pedido.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="duas-colunas" onSubmit={finalizar}>
      <div className="coluna">
        <section className="cartao">
          <h1>Sacola · {restaurante.nome}</h1>
          <ul className="linhas">
            {c.itens.map(({ item, quantidade }) => (
              <li key={item.id} className="linha">
                <span className="linha__nome">{item.nome}</span>
                <span className="qtd">
                  <button type="button" aria-label={`Remover um ${item.nome}`} onClick={() => c.alterar(item.id, -1)}>
                    −
                  </button>
                  <span aria-live="polite">{quantidade}</span>
                  <button type="button" aria-label={`Adicionar um ${item.nome}`} onClick={() => c.alterar(item.id, 1)}>
                    +
                  </button>
                </span>
                <span className="linha__valor">{reais(item.precoCentavos * quantidade)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="cartao">
          <h2>Cupom</h2>
          <div className="cupom">
            <label className="sr" htmlFor="cupom">Código do cupom</label>
            <input id="cupom" placeholder="Ex.: PRIMEIRA" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            <button type="button" className="botao botao--contorno" onClick={aplicar} disabled={!codigo.trim()}>
              Aplicar
            </button>
          </div>
          {msgCupom ? <p className={c.cupom ? "ok" : "erro"} role="status">{msgCupom}</p> : null}
        </section>

        <section className="cartao">
          <h2>Pagamento</h2>
          <div className="metodos" role="radiogroup" aria-label="Forma de pagamento">
            <label className={`metodo${metodo === "pix" ? " metodo--ativo" : ""}`}>
              <input type="radio" name="metodo" checked={metodo === "pix"} onChange={() => setMetodo("pix")} />
              Pix
            </label>
            <label className={`metodo${metodo === "cartao_credito" ? " metodo--ativo" : ""}`}>
              <input type="radio" name="metodo" checked={metodo === "cartao_credito"} onChange={() => setMetodo("cartao_credito")} />
              Cartão de crédito
            </label>
          </div>
          {metodo === "cartao_credito" ? (
            <div className="form">
              <label htmlFor="numero">Número do cartão</label>
              <input id="numero" inputMode="numeric" autoComplete="cc-number" required value={cartao.numero} onChange={(e) => setCartao({ ...cartao, numero: e.target.value })} />
              <label htmlFor="titular">Nome no cartão</label>
              <input id="titular" autoComplete="cc-name" required value={cartao.titular} onChange={(e) => setCartao({ ...cartao, titular: e.target.value })} />
              <div className="par">
                <div>
                  <label htmlFor="validade">Validade (MM/AA)</label>
                  <input id="validade" placeholder="12/28" autoComplete="cc-exp" required value={cartao.validade} onChange={(e) => setCartao({ ...cartao, validade: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="cvv">CVV</label>
                  <input id="cvv" inputMode="numeric" autoComplete="cc-csc" required value={cartao.cvv} onChange={(e) => setCartao({ ...cartao, cvv: e.target.value })} />
                </div>
              </div>
            </div>
          ) : (
            <p className="mudo">O Pix é confirmado na hora, sem digitar nada.</p>
          )}
        </section>
      </div>

      <aside className="cartao resumo" aria-label="Resumo do pedido">
        <h2>Resumo</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>{reais(c.subtotalCentavos)}</dd></div>
          {desconto > 0 ? <div className="ok"><dt>Desconto</dt><dd>− {reais(desconto)}</dd></div> : null}
          <div><dt>Entrega</dt><dd>{restaurante.freteCentavos === 0 ? "Grátis" : reais(restaurante.freteCentavos)}</dd></div>
          <div className="total"><dt>Total</dt><dd>{reais(total)}</dd></div>
        </dl>
        {erro ? <p className="erro" role="alert">{erro}</p> : null}
        <button type="submit" className="botao botao--grande" disabled={enviando}>
          {enviando ? "Processando…" : usuario ? `Pagar ${reais(total)}` : "Entrar para pagar"}
        </button>
      </aside>
    </form>
  );
}
