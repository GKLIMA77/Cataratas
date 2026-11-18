"use strict";

/* ==========================================================================
   Navegação entre telas (por #/nome na URL)
   ========================================================================== */

const DEFAULT_TITLE = "Cataratas – Monitoramento Inteligente";
let firstRoute = true;

/** Descobre qual tela a URL pede; se não existir, volta para o início. */
function currentRoute() {
  const match = location.hash.match(/^#\/(\w+)/);
  return match && ROTAS.some(([id]) => id === match[1]) ? match[1] : "inicio";
}

function route() {
  const id = currentRoute();
  const name = ROTAS.find(([key]) => key === id)[1];

  $$("main > section").forEach((section) => {
    section.hidden = section.id !== id;
  });

  $$("#nav a").forEach((link) => {
    if (link.getAttribute("href") === `#/${id}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  document.title = id === "inicio" ? DEFAULT_TITLE : `${name} – Cataratas`;
  setHeroPlaying(id === "inicio");
  window.scrollTo(0, 0);

  // Depois da primeira tela, leva o foco ao título para quem usa leitor de tela ou teclado.
  if (!firstRoute) {
    const heading = $(`#${id} h1`);
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }
  firstRoute = false;
}

function initRouter() {
  $("#nav").innerHTML = ROTAS.map(([id, name]) => `<a href="#/${id}">${name}</a>`).join("");
  window.addEventListener("hashchange", route);
  route();
}
