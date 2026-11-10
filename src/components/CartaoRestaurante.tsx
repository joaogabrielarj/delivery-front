import { Link } from "react-router-dom";
import type { Restaurante } from "../api/types";
import { reais } from "../store";

export function CartaoRestaurante({ r }: { r: Restaurante }) {
  return (
    <Link to={`/restaurante/${r.id}`} className={`restaurante${r.aberto ? "" : " restaurante--fechado"}`}>
      <span className="restaurante__logo" style={{ background: r.cor }} aria-hidden>
        {r.icone}
      </span>
      <span className="restaurante__info">
        <span className="restaurante__nome">{r.nome}</span>
        <span className="restaurante__meta">
          <span className="nota">★ {r.nota.toFixed(1)}</span> · {r.categoria} · {r.tempoMin}-{r.tempoMax} min
        </span>
        <span className={r.freteCentavos === 0 ? "frete frete--gratis" : "frete"}>
          {r.aberto ? (r.freteCentavos === 0 ? "Entrega grátis" : `Entrega ${reais(r.freteCentavos)}`) : "Fechado agora"}
        </span>
      </span>
    </Link>
  );
}
