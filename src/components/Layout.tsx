import { NavLink, Outlet, Link } from "react-router-dom";
import { reais, useCarrinho, useSessao } from "../store";

export function Layout() {
  const { usuario, sair } = useSessao();
  const { quantidadeTotal, subtotalCentavos } = useCarrinho();

  return (
    <div className="app">
      <header className="topo">
        <div className="topo__interno">
          <Link to="/" className="marca" aria-label="Zeppel, página inicial">
            zeppel
          </Link>
          <span className="endereco">
            Entregar em <b>Rua das Flores, 120, Garanhuns</b>
          </span>
          <nav className="topo__nav" aria-label="Principal">
            <NavLink to="/pedidos">Pedidos</NavLink>
            {usuario ? (
              <button type="button" className="link" onClick={sair}>
                Sair ({usuario.nome})
              </button>
            ) : (
              <NavLink to="/entrar">Entrar</NavLink>
            )}
            <Link to="/carrinho" className="sacola" aria-label={`Sacola com ${quantidadeTotal} itens`}>
              Sacola
              {quantidadeTotal > 0 ? (
                <span className="sacola__valor">
                  {reais(subtotalCentavos)} · {quantidadeTotal}
                </span>
              ) : null}
            </Link>
          </nav>
        </div>
      </header>

      <main className="conteudo">
        <Outlet />
      </main>

      <nav className="abas" aria-label="Navegação">
        <NavLink to="/" end>
          <span aria-hidden>🏠</span>Início
        </NavLink>
        <NavLink to="/pedidos">
          <span aria-hidden>🧾</span>Pedidos
        </NavLink>
        <NavLink to="/carrinho">
          <span aria-hidden>🛍️</span>Sacola{quantidadeTotal > 0 ? ` (${quantidadeTotal})` : ""}
        </NavLink>
        <NavLink to={usuario ? "/pedidos" : "/entrar"}>
          <span aria-hidden>👤</span>Perfil
        </NavLink>
      </nav>
    </div>
  );
}
