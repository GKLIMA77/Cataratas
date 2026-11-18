"use strict";

/* ==========================================================================
   Busca no cabeçalho (câmeras, alertas e pontos do mapa)
   ========================================================================== */

/** Minúsculas e sem acentos, para "preservacao" encontrar "Preservação". */
const plain = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Devolve até 8 resultados: [{ label, go }]. */
function searchAll(term) {
  const t = plain(term);
  const results = [];
  const has = (...parts) => plain(parts.join(" ")).includes(t);

  CAMS.forEach((c, i) => {
    if (has(c.id, c.nome, c.local, c.zona)) {
      results.push({ label: `📹 ${c.id} · ${c.nome}`, go: () => openCamera(i) });
    }
  });
  state.alerts.forEach((a) => {
    if (has(a.t, a.s)) {
      results.push({ label: `🔔 ${a.t}`, go: () => (location.hash = "#/alertas") });
    }
  });
  PONTOS.forEach((p) => {
    if (p.tipo !== "cam" && has(p.nome, p.texto)) {
      results.push({ label: `📍 ${p.nome}`, go: () => (location.hash = "#/mapa") });
    }
  });

  return results.slice(0, 8);
}

function initSearch() {
  const input = $("#q");
  const panel = $("#res");
  let current = [];

  const close = () => {
    panel.hidden = true;
  };
  const reset = () => {
    close();
    input.value = "";
  };

  input.addEventListener("input", () => {
    const term = input.value.trim();
    if (term.length < 2) {
      close();
      return;
    }

    current = searchAll(term);
    panel.replaceChildren();

    if (!current.length) {
      const empty = document.createElement("p");
      empty.className = "note";
      empty.textContent = "Nada encontrado. Tente outro termo, como rio ou trilha.";
      panel.append(empty);
    }
    current.forEach((result, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = result.label;
      button.dataset.r = i;
      panel.append(button);
    });
    panel.hidden = false;
  });

  panel.addEventListener("click", (e) => {
    const button = e.target.closest("[data-r]");
    if (!button) return;
    current[+button.dataset.r].go();
    reset();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") reset();
  });

  // Clicar fora da busca fecha os resultados.
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== input) close();
  });

  // Atalho: "/" foca a busca (exceto ao digitar em outro campo).
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      input.focus();
    }
  });
}
