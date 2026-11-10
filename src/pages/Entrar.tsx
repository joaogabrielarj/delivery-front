import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { entrar, ErroApi } from "../api";
import { useSessao } from "../store";

export function Entrar() {
  const { entrarCom } = useSessao();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      entrarCom(await entrar(email, senha));
      navegar(params.get("voltar") ?? "/");
    } catch (err) {
      setErro(err instanceof ErroApi ? err.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="cartao cartao--estreito">
      <h1>Entrar</h1>
      <p className="mudo">Use o e-mail da sua conta. No modo de demonstração, qualquer e-mail e senha com 3 ou mais caracteres funciona.</p>
      <form onSubmit={enviar} className="form">
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <label htmlFor="senha">Senha</label>
        <input id="senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
        {erro ? <p className="erro" role="alert">{erro}</p> : null}
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </section>
  );
}
