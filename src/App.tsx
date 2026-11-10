import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Carrinho } from "./pages/Carrinho";
import { Entrar } from "./pages/Entrar";
import { Home } from "./pages/Home";
import { PedidoPage, PedidosPage } from "./pages/Pedido";
import { RestaurantePage } from "./pages/Restaurante";
import { Provedores } from "./store";

export default function App() {
  return (
    <Provedores>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="restaurante/:id" element={<RestaurantePage />} />
            <Route path="carrinho" element={<Carrinho />} />
            <Route path="entrar" element={<Entrar />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="pedido/:id" element={<PedidoPage />} />
            <Route path="*" element={<p className="vazio">Página não encontrada.</p>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provedores>
  );
}
