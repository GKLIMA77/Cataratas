"use strict";

/* ==========================================================================
   Tema claro/escuro
   O tema salvo é aplicado o mais cedo possível por um pequeno script no <head>
   do index.html (evita o "piscar" de cor); aqui fica só o botão de alternar.
   ========================================================================== */

function initTheme() {
  const root = document.documentElement;
  const saved = store.get("theme");
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;

  $("#th").addEventListener("click", () => {
    const prefersLight = matchMedia("(prefers-color-scheme: light)").matches;
    const current = root.dataset.theme || (prefersLight ? "light" : "dark");
    const next = current === "light" ? "dark" : "light";
    root.dataset.theme = next;
    store.set("theme", next);
  });
}
