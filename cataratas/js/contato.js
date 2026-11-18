"use strict";

/* ==========================================================================
   Contato: formulário (demonstração, nada é enviado) e mensagens salvas
   ========================================================================== */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_MESSAGES = 5;

function renderMessages() {
  const list = store.get("msgs", []);
  const box = $("#msgs");

  box.hidden = !list.length;
  box.replaceChildren();
  if (!list.length) return;

  const title = document.createElement("h3");
  title.textContent = "Mensagens registradas neste navegador";
  box.append(title);

  // textContent (e não innerHTML) mantém o texto digitado seguro.
  list.forEach((m) => {
    const p = document.createElement("p");
    p.className = "sub sub--tight";
    p.textContent = `${m.d} · ${m.n}: ${m.t}`;
    box.append(p);
  });

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "chip mt-16";
  clear.textContent = "Apagar mensagens";
  clear.addEventListener("click", () => {
    store.set("msgs", []);
    renderMessages();
  });
  box.append(clear);
}

function initContact() {
  const form = $("#form");
  const error = $("#fErr");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#fN").value.trim();
    const email = $("#fE").value.trim();
    const text = $("#fM").value.trim();

    error.classList.remove("is-ok");
    if (!name || !text) {
      error.textContent = "Preencha nome e mensagem.";
      return;
    }
    if (!EMAIL_RE.test(email)) {
      error.textContent = "Digite um e-mail válido, como nome@exemplo.com.";
      return;
    }

    const saved = store.get("msgs", []);
    saved.unshift({ n: name, t: text, d: new Date().toLocaleString("pt-BR") });
    store.set("msgs", saved.slice(0, MAX_MESSAGES));
    renderMessages();

    error.classList.add("is-ok");
    error.textContent = `Mensagem registrada. Obrigado, ${name.split(" ")[0]}!`;
    form.reset();
  });

  form.addEventListener("input", () => {
    error.textContent = "";
    error.classList.remove("is-ok");
  });

  renderMessages();
}
