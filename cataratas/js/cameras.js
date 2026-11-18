"use strict";

/* ==========================================================================
   Câmeras: grade, filtro por área, janela ampliada e fotos do usuário
   ========================================================================== */

/** Fotos enviadas pelo usuário: { [índice da câmera]: dataURL }. */
let userPhotos = store.get("photos", {});

const cameraPhoto = (i) => userPhotos[i] || CAMS[i].foto;

/** Aplica (ou remove) a foto da câmera `i` como fundo do elemento. */
function applyPhoto(el, i) {
  const url = cameraPhoto(i);
  el.classList.toggle("has-photo", Boolean(url));
  el.style.backgroundImage = url ? `url("${url}")` : "";
}

const feedBadges = (live) =>
  `<span class="tag"><span class="dot"></span>${live ? "Ao vivo" : "Online"}</span>` +
  `<span class="ts" data-ts>${fmtClock()}</span>`;

function renderCameras(zone = "Todas") {
  $("#camGrid").innerHTML = CAMS.map((c, i) => {
    if (zone !== "Todas" && c.zona !== zone) return "";
    return `<div class="cam card">
      <button type="button" class="feed${c.quedas ? " fl" : ""}" style="--h:${c.hue}" data-i="${i}"
        aria-label="Ampliar câmera ${esc(c.id)} ${esc(c.nome)}">${scene(i, `sky-grid-${i}`)}${feedBadges(false)}</button>
      <h3>${esc(c.id)} · ${esc(c.nome)}</h3>
      <p>${esc(c.local)} · ${esc(c.zona)}</p>
    </div>`;
  }).join("");

  $$("#camGrid .feed").forEach((button) => applyPhoto(button, +button.dataset.i));
}

/* ---------- Janela ampliada ---------- */
function openCamera(i) {
  const cam = CAMS[i];
  const dialog = $("#dlg");
  const feed = $("#dF");

  state.currentCam = i;
  $("#dT").textContent = `${cam.id} · ${cam.nome}`;
  feed.style.setProperty("--h", cam.hue);
  feed.classList.toggle("fl", cam.quedas);
  feed.innerHTML = scene(i, `sky-dialog-${i}`) + feedBadges(true);
  applyPhoto(feed, i);

  if (!dialog.open) dialog.showModal();
}

const stepCamera = (delta) => openCamera((state.currentCam + delta + CAMS.length) % CAMS.length);

/* ---------- Fotos do usuário ---------- */

/** Reduz a imagem (máx. 960 px de largura) para caber no armazenamento local. */
function shrinkImage(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.onload = () => {
      const scale = Math.min(1, 960 / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.src = url;
  });
}

function savePhotos() {
  const saved = store.set("photos", userPhotos);
  $$("#camGrid .feed").forEach((button) => applyPhoto(button, +button.dataset.i));
  applyPhoto($("#dF"), state.currentCam);
  toast(
    saved
      ? "Fotos atualizadas."
      : "As fotos aparecem agora, mas não couberam no armazenamento e somem ao recarregar."
  );
}

function initPhotoUpload() {
  const input = $("#fl");
  let mode = "all"; // "all" = várias câmeras de uma vez · "one" = só a câmera aberta

  $("#upAll").addEventListener("click", () => {
    mode = "all";
    input.click();
  });
  $("#upOne").addEventListener("click", () => {
    mode = "one";
    input.click();
  });

  input.addEventListener("change", async (e) => {
    const files = [...e.target.files].filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (!files.length) return;

    const targetCam = state.currentCam; // guarda agora: o usuário pode navegar durante o envio
    const list = mode === "one" ? [files[0]] : files.slice(0, CAMS.length);

    for (const [k, file] of list.entries()) {
      const url = await shrinkImage(file);
      if (url) userPhotos[mode === "one" ? targetCam : k] = url;
    }
    savePhotos();
  });

  $("#rmOne").addEventListener("click", () => {
    delete userPhotos[state.currentCam];
    savePhotos();
  });
  $("#rmAll").addEventListener("click", () => {
    userPhotos = {};
    savePhotos();
  });
}

/* ---------- Inicialização ---------- */
function initCameras() {
  // Filtro por área
  const filter = $("#camF");
  filter.innerHTML = ZONAS.map(
    (z) => `<button type="button" class="chip" data-z="${esc(z)}" aria-pressed="${z === "Todas"}">${esc(z)}</button>`
  ).join("");
  filter.addEventListener("click", (e) => {
    const button = e.target.closest("[data-z]");
    if (!button) return;
    $$("#camF .chip").forEach((chip) => chip.setAttribute("aria-pressed", chip === button));
    renderCameras(button.dataset.z);
  });

  renderCameras("Todas");
  $("#camGrid").addEventListener("click", (e) => {
    const button = e.target.closest("[data-i]");
    if (button) openCamera(+button.dataset.i);
  });

  // Janela ampliada
  const dialog = $("#dlg");
  $("#dX").addEventListener("click", () => dialog.close());
  $("#dP").addEventListener("click", () => stepCamera(-1));
  $("#dN").addEventListener("click", () => stepCamera(1));
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") stepCamera(-1);
    if (e.key === "ArrowRight") stepCamera(1);
  });
  // Clique fora da janela (no fundo escurecido) fecha.
  dialog.addEventListener("click", (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });

  initPhotoUpload();

  // Relógio de cada câmera
  setInterval(() => {
    const now = fmtClock();
    $$("[data-ts]").forEach((el) => {
      el.textContent = now;
    });
  }, 1000);
}
