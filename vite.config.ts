import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O proxy evita CORS no desenvolvimento: o front chama /api/<serviço> e o Vite repassa
// para o serviço local (portas do compose do delivery-financeiro).
const destino = (porta: number) => ({
  target: `http://127.0.0.1:${porta}`,
  changeOrigin: true,
  rewrite: (caminho: string) => caminho.replace(/^\/api\/[a-z]+/, ''),
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/identidade': destino(8001),
      '/api/pedidos': destino(8008),
      '/api/pagamentos': destino(8013),
      '/api/avaliacoes': destino(8015),
    },
  },
})
