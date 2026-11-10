import { useEffect, useState } from "react";
import { listarCategorias, listarRestaurantes } from "../api";
import type { Categoria, Restaurante } from "../api/types";
import { CartaoRestaurante } from "../components/CartaoRestaurante";

export function Home() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [restaurantes, setRestaurantes] = useState<Restaurante[] | null>(null);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");

  useEffect(() => {
    void listarCategorias().then(setCategorias);
  }, []);

  useEffect(() => {
    let ativo = true;
    const t = setTimeout(() => {
      void listarRestaurantes(busca, categoria).then((r) => ativo && setRestaurantes(r));
    }, 150);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [busca, categoria]);

  return (
    <>
      <section className="faixa">
        <div>
          <h1>Fome de quê hoje?</h1>
          <p>Peça dos restaurantes de Garanhuns e acompanhe a entrega em tempo real.</p>
        </div>
        <label className="busca">
          <span className="sr">Buscar restaurante ou prato</span>
          <input
            id="busca"
            type="search"
            placeholder="Buscar restaurante ou tipo de comida"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
      </section>

      <section aria-label="Categorias">
        <ul className="categorias">
          {categorias.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`categoria${categoria === c.id ? " categoria--ativa" : ""}`}
                aria-pressed={categoria === c.id}
                onClick={() => setCategoria(categoria === c.id ? "" : c.id)}
              >
                <span className="categoria__icone" aria-hidden>
                  {c.icone}
                </span>
                {c.nome}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Restaurantes</h2>
        {restaurantes === null ? (
          <p className="vazio">Carregando restaurantes…</p>
        ) : restaurantes.length === 0 ? (
          <p className="vazio">Nenhum restaurante encontrado. Tente outra busca ou categoria.</p>
        ) : (
          <div className="grade">
            {restaurantes.map((r) => (
              <CartaoRestaurante key={r.id} r={r} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
