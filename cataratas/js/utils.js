"use strict";

/* ==========================================================================
   Utilitários e estado compartilhado
   ========================================================================== */

/* ---------- DOM ---------- */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Escapa texto antes de colocá-lo em innerHTML (evita injeção de HTML/XSS). */
const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

/* ---------- Datas e formatação ---------- */
const pad2 = (n) => String(n).padStart(2, "0");

/** Data no formato numérico AAAAMMDD, usada como "semente" e como chave. */
const dateKey = (d) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

/** Data no formato AAAA-MM-DD (valor do <input type="date">). */
const toIso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const fmtClock = () => new Date().toLocaleTimeString("pt-BR");
const fmtHourMin = (d = new Date()) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const fmtNumber = (n) => n.toLocaleString("pt-BR");
const fmtLevel = (v) => v.toFixed(1).replace(".", ",");
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ---------- Números pseudoaleatórios ---------- */

/**
 * Gerador determinístico (mulberry32): a mesma semente sempre produz a mesma
 * sequência. É isso que faz os dados simulados serem iguais para o mesmo dia.
 */
const seeded = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ---------- Armazenamento local ---------- */

/**
 * Guarda no localStorage. Se ele estiver bloqueado ou cheio (modo privado,
 * cota estourada), os dados continuam valendo até recarregar a página.
 * `set` devolve true só quando realmente gravou no navegador.
 */
const memoryStore = new Map();

const store = {
  get(key, fallback = null) {
    // A cópia em memória é sempre a mais recente desta sessão.
    let raw = memoryStore.get(key);
    if (raw === undefined) {
      try {
        raw = localStorage.getItem(key);
      } catch {
        raw = null;
      }
    }
    if (raw === null || raw === undefined) return fallback;
    try {
      return JSON.parse(raw) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    const raw = JSON.stringify(value);
    memoryStore.set(key, raw);
    try {
      localStorage.setItem(key, raw);
      return true;
    } catch {
      return false;
    }
  },
};

/* ---------- Aviso rápido ---------- */
let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 4500);
}

/* ---------- Estado compartilhado entre os módulos ---------- */
const state = {
  day: startOfToday(), // dia exibido na tela de alertas
  alerts: [], // alertas do dia exibido
  sessionAlerts: [], // alertas gerados nesta sessão (limite do rio)
  alertFilter: "todos",
  riverLevels: [], // últimas leituras do sensor S03 (hoje)
  currentCam: 0, // câmera aberta na janela ampliada
  reportRows: [], // linhas do relatório exibido
  weather: null, // clima simulado de hoje
};

const isToday = () => dateKey(state.day) === dateKey(new Date());
