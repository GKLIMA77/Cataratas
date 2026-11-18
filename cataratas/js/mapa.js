"use strict";

/* ==========================================================================
   Mapa esquemático do parque
   ========================================================================== */

const MAP_W = 600;
const MAP_H = 380;

const mapVisible = Object.fromEntries(Object.keys(GRUPOS).map((k) => [k, true]));
let mapSelectedCam = null; // índice da câmera do ponto selecionado (ou null)
let mapZoom = 1;

function renderMap() {
  const markers = PONTOS.map((p, i) => {
    if (!mapVisible[p.tipo]) return "";
    const color = GRUPOS[p.tipo].cor;
    const shape =
      p.tipo === "risco"
        ? `<path d="M${p.x} ${p.y - 11}l11 19h-22z" fill="${color}"/>` // triângulo = área de risco
        : `<circle cx="${p.x}" cy="${p.y}" r="9" fill="${color}"/>`;
    return `<g class="mk" tabindex="0" role="button" data-p="${i}" aria-label="${esc(p.nome)}">${shape}</g>`;
  }).join("");

  $("#mapSvg").innerHTML =
    `<rect width="${MAP_W}" height="${MAP_H}" fill="#0a1f1a"/>` +
    `<path class="map-land" d="M40 60 Q120 20 300 30 T560 70 Q590 200 540 330 Q400 370 220 350 T50 260 Q20 150 40 60Z"/>` +
    `<path class="map-river" d="M0 150 C120 130 160 210 260 215 S400 270 470 230 S590 250 600 245"/>` +
    markers;
}

function renderLegend() {
  $("#legend").innerHTML = Object.entries(GRUPOS)
    .map(
      ([key, g]) =>
        `<label><input type="checkbox" data-k="${key}" checked><span style="color:${g.cor}" aria-hidden="true">●</span>${esc(g.nome)}</label>`
    )
    .join("");
}

/** Mostra os detalhes do ponto clicado (ou focado + Enter/Espaço). */
function selectMapPoint(target) {
  const marker = target.closest("[data-p]");
  if (!marker) return;

  const point = PONTOS[+marker.dataset.p];
  const isLevelSensor = point.nome === "Sensor S03";
  const lastLevel = state.riverLevels[state.riverLevels.length - 1];

  $("#mTitle").textContent = point.nome;
  $("#mText").textContent = isLevelSensor
    ? `Nível atual do rio: ${fmtLevel(lastLevel)} m (limite de ${fmtLevel(RIVER_LIMIT)} m).`
    : point.texto;

  mapSelectedCam = point.cam ?? null;
  $("#mCam").hidden = mapSelectedCam === null;
}

function zoomMap(factor) {
  mapZoom = clamp(mapZoom * factor, 1, 3);
  const w = MAP_W / mapZoom;
  const h = MAP_H / mapZoom;
  $("#mapSvg").setAttribute("viewBox", `${(MAP_W - w) / 2} ${(MAP_H - h) / 2} ${w} ${h}`);
}

function initMap() {
  renderMap();
  renderLegend();

  $("#legend").addEventListener("change", (e) => {
    const key = e.target.dataset.k;
    if (!key) return;
    mapVisible[key] = e.target.checked;
    renderMap();
  });

  const svg = $("#mapSvg");
  svg.addEventListener("click", (e) => selectMapPoint(e.target));
  svg.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectMapPoint(e.target);
    }
  });

  $("#mCam").addEventListener("click", () => {
    if (mapSelectedCam !== null) openCamera(mapSelectedCam);
  });
  $("#zI").addEventListener("click", () => zoomMap(1.5));
  $("#zO").addEventListener("click", () => zoomMap(1 / 1.5));
}
