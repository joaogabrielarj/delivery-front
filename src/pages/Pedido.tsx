import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { avaliar, ErroApi, listarPedidos, obterPedido, obterRastreio } from "../api";
import type { Pedido, Rastreio, StatusPedido } from "../api/types";
import { reais, useSessao } from "../store";

const etapas: { id: StatusPedido; titulo: string }[] = [
  { id: "em_preparo", titulo: "Preparando seu pedido" },
  { id: "saiu_para_entrega", titulo: "Saiu para entrega" },
  { id: "entregue", titulo: "Entregue" },
];

function Estrelas({ valor, onChange, nome }: { valor: number; onChange: (n: number) => void; nome: string }) {
  return (
    <div className="estrelas" role="radiogroup" aria-label={nome}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
          className={n <= valor ? "estrela estrela--on" : "estrela"}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function PedidoPage() {
  const { id = "" } = useParams();
  const { usuario } = useSessao();
  const [pedido, setPedido] = useState<Pedido | null | undefined>(undefined);
  const [rastreio, setRastreio] = useState<Rastreio | null>(null);
  const [notaR, setNotaR] = useState(0);
  const [notaE, setNotaE] = useState(0);
  const [comentario, setComentario] = useState("");
  const [msg, setMsg] = useState("");
  const [avaliado, setAvaliado] = useState(false);

  useEffect(() => {
    let ativo = true;
    const atualizar = async () => {
      const p = await obterPedido(id);
      if (!ativo) return;
      setPedido(p);
      if (p) setRastreio(await obterRastreio(id));
    };
    void atualizar();
    const t = setInterval(() => void atualizar(), 2000);
    return () => {
      ativo = false;
      clearInterval(t);
    };
  }, [id]);

  if (pedido === undefined) return <p className="vazio">Carregando pedido…</p>;
  if (pedido === null)
    return (
      <p className="vazio">
        Pedido não encontrado. <Link to="/pedidos">Ver meus pedidos</Link>
      </p>
    );

  const indice = etapas.findIndex((e) => e.id === pedido.status);

  async function enviarAvaliacao(e: FormEvent) {
    e.preventDefault();
    if (!usuario || !pedido) return;
    setMsg("");
    try {
      await avaliar({ pedidoId: pedido.id, notaRestaurante: notaR, notaEntrega: notaE, comentario }, usuario);
      setAvaliado(true);
    } catch (err) {
      setMsg(err instanceof ErroApi ? err.message : "Não foi possível enviar a avaliação.");
    }
  }

  return (
    <div className="duas-colunas">
      <div className="coluna">
        <section className="cartao">
          <h1>Pedido de {pedido.restauranteNome}</h1>
          <ol className="etapas">
            {etapas.map((e, i) => (
              <li key={e.id} className={i < indice ? "etapa etapa--feita" : i === indice ? "etapa etapa--atual" : "etapa"}>
                {e.titulo}
              </li>
            ))}
          </ol>

          {pedido.status === "saiu_para_entrega" && rastreio ? (
            <div className="mapa" role="img" aria-label={`Entregador a caminho, chega em cerca de ${rastreio.etaMin} minutos`}>
              <div className="mapa__trajeto">
                <span className="mapa__ponto mapa__ponto--origem" aria-hidden>🍽️</span>
                <span className="mapa__moto" style={{ left: `${rastreio.progresso * 100}%` }} aria-hidden>🛵</span>
                <span className="mapa__ponto mapa__ponto--destino" aria-hidden>🏠</span>
              </div>
              <p>
                {rastreio.entregador} está a caminho · chega em cerca de <b>{rastreio.etaMin} min</b>
              </p>
            </div>
          ) : null}
        </section>

        {pedido.status === "entregue" ? (
          <section className="cartao">
            <h2>Como foi o pedido?</h2>
            {avaliado ? (
              <p className="ok" role="status">Obrigado! Sua avaliação foi enviada.</p>
            ) : (
              <form onSubmit={enviarAvaliacao} className="form">
                <span id="l-rest">Restaurante</span>
                <Estrelas valor={notaR} onChange={setNotaR} nome="Nota do restaurante" />
                <span id="l-ent">Entrega</span>
                <Estrelas valor={notaE} onChange={setNotaE} nome="Nota da entrega" />
                <label htmlFor="comentario">Comentário (opcional)</label>
                <textarea id="comentario" maxLength={1000} rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} />
                {msg ? <p className="erro" role="alert">{msg}</p> : null}
                <button type="submit" className="botao" disabled={notaR === 0 || !usuario}>
                  Enviar avaliação
                </button>
                {!usuario ? <p className="mudo">Entre na sua conta para avaliar.</p> : null}
              </form>
            )}
          </section>
        ) : null}
      </div>

      <aside className="cartao resumo" aria-label="Itens do pedido">
        <h2>Itens</h2>
        <ul className="linhas">
          {pedido.itens.map(({ item, quantidade }) => (
            <li key={item.id} className="linha">
              <span className="linha__nome">{quantidade}× {item.nome}</span>
              <span className="linha__valor">{reais(item.precoCentavos * quantidade)}</span>
            </li>
          ))}
        </ul>
        <dl>
          <div className="total"><dt>Total pago</dt><dd>{reais(pedido.totalCentavos)}</dd></div>
        </dl>
      </aside>
    </div>
  );
}

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  useEffect(() => {
    void listarPedidos().then(setPedidos);
  }, []);
  if (pedidos === null) return <p className="vazio">Carregando pedidos…</p>;
  return (
    <section>
      <h1>Meus pedidos</h1>
      {pedidos.length === 0 ? (
        <p className="vazio">Você ainda não fez pedidos. <Link to="/">Escolher um restaurante</Link></p>
      ) : (
        <ul className="lista-pedidos">
          {pedidos.map((p) => (
            <li key={p.id}>
              <Link to={`/pedido/${p.id}`} className="pedido-linha">
                <span><b>{p.restauranteNome}</b><br /><span className="mudo">{new Date(p.criadoEm).toLocaleString("pt-BR")}</span></span>
                <span>{reais(p.totalCentavos)}<br /><span className="mudo">{etapas.find((e) => e.id === p.status)?.titulo}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
