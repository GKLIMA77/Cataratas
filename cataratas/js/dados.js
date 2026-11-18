"use strict";

/* ==========================================================================
   Dados fixos da demonstração
   ========================================================================== */

/**
 * Câmeras.
 *  - hue:     matiz (0–360) do fundo quando não há foto
 *  - quedas:  true = mostra o efeito de água caindo
 *  - foto:    imagem padrão (null = usa a ilustração desenhada em cenas.js)
 */
const CAMS = [
  { id: "C1",  nome: "Trilha das Cataratas",  local: "Trilha principal",      zona: "Quedas",      hue: 150, quedas: true,  foto: "assets/img/camera-01.jpg" },
  { id: "C2",  nome: "Salto Floriano",        local: "Vista lateral",         zona: "Quedas",      hue: 170, quedas: true,  foto: "assets/img/camera-02.jpg" },
  { id: "C3",  nome: "Vista Panorâmica",      local: "Panorâmica",            zona: "Quedas",      hue: 190, quedas: true,  foto: "assets/img/camera-03.jpg" },
  { id: "C4",  nome: "Estacionamento",        local: "Entrada do parque",     zona: "Entrada",     hue: 210, quedas: false, foto: "assets/img/camera-04.jpg" },
  { id: "C5",  nome: "Passarela Inferior",    local: "Área das quedas",       zona: "Quedas",      hue: 160, quedas: true,  foto: "assets/img/camera-05.jpg" },
  { id: "C6",  nome: "Ilha das Aves",         local: "Área de preservação",   zona: "Preservação", hue: 130, quedas: false, foto: "assets/img/camera-06.jpg" },
  { id: "C7",  nome: "Centro de Visitantes",  local: "Entrada",               zona: "Entrada",     hue: 200, quedas: false, foto: null },
  { id: "C8",  nome: "Restaurante",           local: "Área interna",          zona: "Entrada",     hue: 30,  quedas: false, foto: "assets/img/camera-08.jpg" },
  { id: "C9",  nome: "Passarela da Garganta", local: "Vista da Garganta",     zona: "Quedas",      hue: 200, quedas: false, foto: "assets/img/camera-09.jpg" },
  { id: "C10", nome: "Mirante Inferior",      local: "Vista das corredeiras", zona: "Quedas",      hue: 20,  quedas: false, foto: "assets/img/camera-10.jpg" },
];

const ZONAS = ["Todas", "Quedas", "Entrada", "Preservação"];

/* ---------- Alertas ---------- */
const NIVEIS = { alto: "Alto", atencao: "Atenção", normal: "Normal", ok: "OK" };
const ICONES = { alto: "🔺", atencao: "⚠️", normal: "🌤️", ok: "✅" };

/** Ocorrências possíveis; cada dia sorteia algumas delas. */
const POOL = [
  { nivel: "alto",    titulo: "Nível do rio em elevação",              origem: "Sensor S03" },
  { nivel: "alto",    titulo: "Acúmulo de pessoas no mirante",         origem: "Câmera 02" },
  { nivel: "alto",    titulo: "Passarela fechada por vazão elevada",   origem: "Sensor S03" },
  { nivel: "atencao", titulo: "Movimento incomum na trilha",           origem: "Câmera 05" },
  { nivel: "atencao", titulo: "Vento forte na área das quedas",        origem: "Estação meteo" },
  { nivel: "atencao", titulo: "Visibilidade reduzida por neblina",     origem: "Câmera 03" },
  { nivel: "normal",  titulo: "Condição climática estável",            origem: "Estação meteo" },
  { nivel: "normal",  titulo: "Fluxo de visitantes dentro do esperado", origem: "Câmera 04" },
  { nivel: "ok",      titulo: "Sistema funcionando normalmente",       origem: "Todos os sensores" },
  { nivel: "ok",      titulo: "Todas as câmeras online",               origem: "Central" },
];

const RIVER_LIMIT = 5.5; // metros

/* ---------- Mapa ---------- */
const GRUPOS = {
  cam:   { nome: "Câmeras",             cor: "#2f6bff" },
  sen:   { nome: "Sensores de nível",   cor: "#22d3a0" },
  risco: { nome: "Áreas de risco",      cor: "#ef4452" },
  ctl:   { nome: "Central de controle", cor: "#8b5cf6" },
};

/** Pontos do mapa. `cam` = índice em CAMS (só para câmeras). */
const PONTOS = [
  { tipo: "cam", x: 120, y: 90,  nome: "C1 · Trilha das Cataratas",   texto: "Câmera online na trilha principal.",      cam: 0 },
  { tipo: "cam", x: 250, y: 140, nome: "C2 · Salto Floriano",         texto: "Câmera online com vista lateral.",        cam: 1 },
  { tipo: "cam", x: 330, y: 200, nome: "C3 · Vista Panorâmica",       texto: "Câmera online com vista panorâmica.",     cam: 2 },
  { tipo: "cam", x: 470, y: 100, nome: "C4 · Estacionamento",         texto: "Câmera online na entrada do parque.",     cam: 3 },
  { tipo: "cam", x: 300, y: 290, nome: "C5 · Passarela Inferior",     texto: "Câmera online na área das quedas.",       cam: 4 },
  { tipo: "cam", x: 190, y: 250, nome: "C6 · Ilha das Aves",          texto: "Câmera online na área de preservação.",   cam: 5 },
  { tipo: "cam", x: 510, y: 200, nome: "C7 · Centro de Visitantes",   texto: "Câmera online na entrada.",               cam: 6 },
  { tipo: "cam", x: 430, y: 300, nome: "C8 · Restaurante",            texto: "Câmera online na área interna.",          cam: 7 },
  { tipo: "cam", x: 385, y: 222, nome: "C9 · Passarela da Garganta",  texto: "Câmera online na passarela da Garganta.", cam: 8 },
  { tipo: "cam", x: 240, y: 320, nome: "C10 · Mirante Inferior",      texto: "Câmera online com vista das corredeiras.", cam: 9 },

  { tipo: "sen", x: 360, y: 255, nome: "Sensor S03", texto: "Mede o nível do rio. Veja a leitura atual em Alertas." },
  { tipo: "sen", x: 220, y: 190, nome: "Sensor S01", texto: "Estação de medição a montante." },
  { tipo: "sen", x: 440, y: 240, nome: "Sensor S05", texto: "Estação meteorológica." },

  { tipo: "risco", x: 290, y: 235, nome: "Área de risco · Passarela", texto: "Acesso controlado em caso de cheia." },
  { tipo: "risco", x: 150, y: 150, nome: "Área de risco · Trilha",    texto: "Trecho com barranco e piso molhado." },
  { tipo: "risco", x: 400, y: 170, nome: "Área de risco · Mirante",   texto: "Limite de pessoas por vez." },

  { tipo: "ctl", x: 540, y: 320, nome: "Central de controle", texto: "Equipe que recebe e trata os alertas, 24h por dia." },
];

/* ---------- Telas ---------- */
const ROTAS = [
  ["inicio", "Início"],
  ["sobre", "Sobre"],
  ["cameras", "Câmeras"],
  ["alertas", "Alertas"],
  ["mapa", "Mapa"],
  ["relatorios", "Relatórios"],
  ["contato", "Contato"],
];
