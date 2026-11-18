"use strict";

/* ==========================================================================
   Alertas: geração por dia, reconhecimento, ocorrências manuais e nível do rio
   ========================================================================== */

/**
 * @typedef {Object} Alerta
 * @property {number}  d     dia (AAAAMMDD)
 * @property {string}  l     nível: "alto" | "atencao" | "normal" | "ok"
 * @property {string}  t     título
 * @property {string}  s     origem (sensor, câmera...)
 * @property {string}  m     horário "HH:MM"
 * @property {boolean} done  já foi reconhecido?
 * @property {number}  [mm]  minutos desde 00:00 (só nos alertas gerados)
 * @property {string}  [k]   "lim" = alerta de limite do rio
 */

/** Identifica um alerta de forma estável, para lembrar que ele foi reconhecido. */
const ackKey = (a) => `${a.d}|${a.t}|${a.s}|${a.m}`;

const isActionable = (a) => !a.done && (a.l === "alto" || a.l === "atencao");

/* ---------- Geração dos alertas de um dia ---------- */

/** Alertas simulados de um dia. Para a mesma data, o resultado é sempre o mesmo. */
function generateDay(date) {
  const r = seeded(dateKey(date));
  const today = dateKey(date) === dateKey(new Date());
  const now = new Date();
  const nowMinutes = today ? now.getHours() * 60 + now.getMinutes() : 18 * 60;
  // Alertas entre 06:00 e agora (ou 18:00 em dias passados). Antes das 06:00, usa 00:00 até agora,
  // para nunca mostrar um horário que ainda não aconteceu.
  const earliest = nowMinutes > 6 * 60 ? 6 * 60 : 0;
  const latest = Math.max(earliest + 1, nowMinutes);

  // Embaralhamento de Fisher–Yates (determinístico, pois usa o gerador com semente)
  const order = POOL.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const picked = order.slice(0, 4 + Math.floor(r() * 4));
  if (!picked.some((i) => POOL[i].nivel === "ok")) {
    picked.push(POOL.findIndex((p) => p.nivel === "ok")); // sempre há ao menos um "tudo certo"
  }

  return picked
    .map((i) => {
      const p = POOL[i];
      const minutes = earliest + Math.floor(r() * (latest - earliest));
      return {
        d: dateKey(date),
        l: p.nivel,
        t: p.titulo,
        s: p.origem,
        mm: minutes,
        m: `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`,
        // Em dias passados, o que era Alto/Atenção já foi tratado.
        done: !today && (p.nivel === "alto" || p.nivel === "atencao"),
      };
    })
    .sort((a, b) => b.mm - a.mm);
}

/** Todos os alertas de um dia: manuais + da sessão + simulados, com as baixas aplicadas. */
function getAlertsFor(date) {
  const day = dateKey(date);
  const list = [
    ...store.get("manual", []).filter((a) => a.d === day && NIVEIS[a.l]),
    ...state.sessionAlerts.filter((a) => a.d === day),
    ...generateDay(date),
  ];
  const acknowledged = store.get("done", []);
  list.forEach((a) => {
    if (acknowledged.includes(ackKey(a))) a.done = true;
  });
  return list;
}

/* ---------- Tela de alertas ---------- */
function renderAlerts() {
  const list = state.alerts;
  const high = list.filter((a) => a.l === "alto" && !a.done).length;
  const warn = list.filter((a) => a.l === "atencao" && !a.done).length;
  const fine = list.filter((a) => a.l === "ok" || a.l === "normal" || a.done).length;

  $("#kA").textContent = high;
  $("#kW").textContent = warn;
  $("#kO").textContent = fine;

  // O sino e o indicador da tela inicial sempre mostram os alertas de HOJE.
  const todayList = isToday() ? list : getAlertsFor(startOfToday());
  const todayHigh = todayList.filter((a) => a.l === "alto" && !a.done).length;
  $("#kpiA").textContent = todayHigh;
  $("#bellN").textContent = todayHigh;

  const rows = list
    .map((alert, index) => ({ alert, index }))
    .filter(({ alert }) => state.alertFilter === "todos" || alert.l === state.alertFilter)
    .map(({ alert: a, index }) => {
      const ackButton = isActionable(a)
        ? `<button type="button" class="ack" data-a="${index}">Reconhecer</button>`
        : "";
      return `<div class="al${a.done ? " done" : ""}">
        <span aria-hidden="true">${ICONES[a.l]}</span>
        <div><b>${esc(a.t)}</b><br><small>${esc(a.s)} · ${esc(a.m)}</small></div>
        <span class="badge ${a.l}">${NIVEIS[a.l]}</span>${ackButton}
      </div>`;
    })
    .join("");

  $("#alList").innerHTML = rows || '<p class="sub">Nenhum alerta neste filtro.</p>';
}

/** Troca o dia exibido (limitado a hoje e aos 30 dias anteriores). */
function setDay(date) {
  const today = startOfToday();
  const oldest = new Date(today);
  oldest.setDate(oldest.getDate() - 30);

  state.day = date > today ? today : date < oldest ? oldest : date;
  state.alerts = getAlertsFor(state.day);

  renderAlerts();
  renderRiver();
  renderDayWeatherCard(isToday() ? state.weather : dayWeather(state.day));

  const label = state.day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  $("#dLbl").textContent = label + (isToday() ? " · hoje" : "");

  const input = $("#dIn");
  input.value = toIso(state.day);
  input.max = toIso(today);
  input.min = toIso(oldest);
  $("#dNx").disabled = isToday();
  $("#dPv").disabled = dateKey(state.day) === dateKey(oldest);
}

function shiftDay(delta) {
  const d = new Date(state.day);
  d.setDate(d.getDate() + delta);
  setDay(d);
}

/* ---------- Nível do rio (simulado) ---------- */

/** 16 leituras do sensor S03 para um dia, sempre iguais para a mesma data. */
function riverSeries(date) {
  const r = seeded(dateKey(date) + 3);
  const base = dayWeather(date).rv;
  return Array.from({ length: 16 }, (_, i) =>
    +clamp(base + Math.sin(i / 2.6 + r() * 2) * 0.5 + (r() - 0.5) * 0.3, 2.2, 6.8).toFixed(2)
  );
}

function renderRiver() {
  const levels = isToday() ? state.riverLevels : riverSeries(state.day);
  const W = 440, H = 220, left = 34, bottom = 24, n = levels.length;
  const x = (i) => left + (i * (W - left - 10)) / (n - 1);
  const y = (v) => H - bottom - (v / 8) * (H - bottom - 12);

  const line = levels.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  const grid = [0, 2, 4, 6, 8]
    .map(
      (v) =>
        `<line class="chart-grid" x1="${left}" x2="${W - 10}" y1="${y(v)}" y2="${y(v)}"/>` +
        `<text x="2" y="${y(v) + 4}">${v}m</text>`
    )
    .join("");
  const limitY = y(RIVER_LIMIT);

  $("#river").innerHTML =
    grid +
    `<line class="chart-limit" x1="${left}" x2="${W - 10}" y1="${limitY}" y2="${limitY}"/>` +
    `<text class="chart-limit-label" x="${W - 90}" y="${limitY - 4}">limite ${fmtLevel(RIVER_LIMIT)}m</text>` +
    `<path class="chart-area" d="${line}L${x(n - 1)} ${H - bottom}L${left} ${H - bottom}Z"/>` +
    `<path class="chart-line" d="${line}"/>` +
    `<circle class="chart-dot" cx="${x(n - 1)}" cy="${y(levels[n - 1])}" r="5"/>`;

  $("#riverNote").textContent =
    (isToday() ? "Leitura atual: " : "Última leitura do dia: ") + fmtLevel(levels[n - 1]) + " m";
}

let riverWasAbove = false;

/** Cria o alerta "acima do limite" (se ainda não houver um pendente hoje). */
function raiseRiverAlert() {
  const day = dateKey(new Date());
  if (state.sessionAlerts.some((a) => a.k === "lim" && a.d === day && !a.done)) return;

  const alert = { d: day, k: "lim", l: "alto", t: "Nível do rio acima do limite", s: "Sensor S03", m: fmtHourMin(), done: false };
  state.sessionAlerts.push(alert);
  if (isToday()) state.alerts.unshift(alert);
  renderAlerts();
  toast("Nível do rio acima do limite (Sensor S03)");
}

function tickRiver() {
  const last = state.riverLevels[state.riverLevels.length - 1];
  const next = +clamp(last + (Math.random() - 0.47) * 0.5, 2.5, 6.5).toFixed(2);
  state.riverLevels = [...state.riverLevels.slice(1), next];
  renderRiver();

  // Só dispara o alerta quando o nível CRUZA o limite, e não a cada leitura acima dele.
  const above = next > RIVER_LIMIT;
  if (above && !riverWasAbove) raiseRiverAlert();
  riverWasAbove = above;
}

/* ---------- Inicialização ---------- */
function initAlerts() {
  state.riverLevels = riverSeries(new Date());

  // Filtro por nível
  const filter = $("#alF");
  filter.innerHTML = ["todos", "alto", "atencao", "normal"]
    .map(
      (k) =>
        `<button type="button" class="chip" data-f="${k}" aria-pressed="${k === "todos"}">${k === "todos" ? "Todos" : NIVEIS[k]}</button>`
    )
    .join("");
  filter.addEventListener("click", (e) => {
    const button = e.target.closest("[data-f]");
    if (!button) return;
    state.alertFilter = button.dataset.f;
    $$("#alF .chip").forEach((chip) => chip.setAttribute("aria-pressed", chip === button));
    renderAlerts();
  });

  // Reconhecer alerta
  $("#alList").addEventListener("click", (e) => {
    const button = e.target.closest("[data-a]");
    const alert = button && state.alerts[+button.dataset.a];
    if (!alert) return;
    alert.done = true;
    store.set("done", [...store.get("done", []), ackKey(alert)].slice(-200));
    renderAlerts();
  });

  // Navegação por dia
  $("#dPv").addEventListener("click", () => shiftDay(-1));
  $("#dNx").addEventListener("click", () => shiftDay(1));
  $("#dHj").addEventListener("click", () => setDay(startOfToday()));
  $("#dIn").addEventListener("change", (e) => {
    if (e.target.value) setDay(new Date(`${e.target.value}T00:00:00`));
  });

  // Registrar ocorrência
  const form = $("#oc");
  form.addEventListener("input", () => {
    $("#oErr").textContent = "";
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("#oT").value.trim();
    if (!title) {
      $("#oErr").textContent = "Descreva o que aconteceu.";
      return;
    }
    const alert = {
      d: dateKey(state.day),
      l: $("#oL").value,
      t: title,
      s: $("#oS").value.trim() || "Registro manual",
      m: fmtHourMin(),
      done: false,
    };
    state.alerts.unshift(alert);
    store.set("manual", [alert, ...store.get("manual", [])].slice(0, 20));
    renderAlerts();
    toast("Ocorrência registrada");
    form.reset();
  });

  setDay(state.day);
  setInterval(tickRiver, 4000);
}
