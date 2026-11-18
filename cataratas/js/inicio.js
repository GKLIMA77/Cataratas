"use strict";

/* ==========================================================================
   Tela inicial: clima simulado, indicadores e visitantes
   ========================================================================== */

/**
 * Clima de um dia qualquer. É sempre o mesmo para a mesma data.
 *  t = temperatura (°C), h = umidade (%), w = vento (km/h),
 *  v = visibilidade (km), rv = nível médio do rio (m)
 */
const dayWeather = (date) => {
  const r = seeded(dateKey(date) + 7);
  return {
    t: 18 + ((r() * 12) | 0),
    h: 60 + ((r() * 30) | 0),
    w: 5 + ((r() * 18) | 0),
    v: 6 + ((r() * 6) | 0),
    rv: +(2.8 + r() * 2.6).toFixed(1),
  };
};

/** Card "Clima e condições" da tela de alertas. */
function renderDayWeatherCard(weather) {
  $("#wT2").textContent = `${weather.t}°C`;
  $("#wH2").textContent = `${weather.h}%`;
  $("#wW2").textContent = `${weather.w} km/h`;
}

/** Card de clima do hero. */
function renderHomeWeather() {
  const w = state.weather;
  $("#wT").textContent = `${w.t}°C`;
  $("#wH").textContent = `${w.h}%`;
  $("#wW").textContent = `${w.w} km/h`;
  $("#wV").textContent = `${w.v} km`;
  if (isToday()) renderDayWeatherCard(w);
}

function initWeather() {
  state.weather = dayWeather(new Date());
  renderHomeWeather();

  // Pequenas oscilações a cada 5 s, sempre dentro de limites realistas.
  const drift = (value, min, max) => clamp(value + Math.round(Math.random() * 2 - 1), min, max);
  setInterval(() => {
    const w = state.weather;
    w.t = drift(w.t, 20, 29);
    w.h = drift(w.h, 65, 90);
    w.w = drift(w.w, 6, 22);
    renderHomeWeather();
  }, 5000);
}

function initVisitors() {
  const now = new Date();
  const minutesToday = now.getHours() * 60 + now.getMinutes();
  // Parte da contagem diária proporcional à hora do dia (o parque "fecha" às 18h).
  const dayShare = Math.min(1, minutesToday / 1080);
  let visitors = Math.round((3000 + seeded(dateKey(now) + 5)() * 3000) * dayShare);

  const show = () => {
    $("#kpiV").textContent = fmtNumber(visitors);
  };
  show();
  setInterval(() => {
    visitors += Math.floor(Math.random() * 4);
    show();
  }, 3000);
}

function initHome() {
  initWeather();
  initVisitors();

  const sensors = PONTOS.filter((p) => p.tipo === "sen").length;
  $("#kpiC").textContent = `${CAMS.length}/${CAMS.length}`;
  $("#kpiS").textContent = `${sensors}/${sensors}`;
}
