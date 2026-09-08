// Entrada de renderização no servidor (build time).
// Usada pelo script `scripts/prerender.mjs` para gerar o HTML estático
// que é embutido no `dist/index.html`, garantindo que todo o conteúdo do
// site exista no HTML inicial — sem depender de JavaScript no navegador.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App.jsx";

export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
