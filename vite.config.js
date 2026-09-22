import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // IPv4 explícito: no Windows o Vite às vezes sobe só em [::1] e o proxy do
  // "netlify dev" (que fala IPv4 com o framework dev server) não consegue
  // conectar, servindo o index.html no lugar do JS.
  server: { host: "127.0.0.1" },
});
