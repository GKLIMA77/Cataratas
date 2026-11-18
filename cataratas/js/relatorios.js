"use strict";

/* ==========================================================================
   Relatórios: visitantes, nível do rio e alertas por dia (dados de exemplo)
   ========================================================================== */

function buildReportRows(days) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));

    const r = seeded(dateKey(date) + 11);
    const weekend = date.getDay() % 6 === 0; // domingo (0) ou sábado (6)

    return {
      d: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      v: Math.round((6000 + r() * 5000) * (weekend ? 1.25 : 1)),
      l: fmtLevel(dayWeather(date).rv),
      a: generateDay(date).filter((x) => x.l === "alto" || x.l === "atencao").length,
    };
  });
}

function renderReport() {
  const days = +$("#per").value;
  const rows = buildReportRows(days);
  state.reportRows = rows;

  // Gráfico de barras
  const max = Math.max(...rows.map((r) => r.v));
  const slot = 600 / days;
  $("#bars").innerHTML =
    rows
      .map((r, i) => {
        const h = (r.v / max) * 170;
        return (
          `<rect class="chart-bar" x="${30 + i * slot + 4}" y="${190 - h}" width="${slot - 8}" height="${h}" rx="4"/>` +
          `<text x="${30 + i * slot + slot / 2}" y="208" text-anchor="middle">${r.d}</text>`
        );
      })
      .join("") +
    `<text x="2" y="20">${max}</text><text x="2" y="190">0</text>`;

  // Indicadores
  const total = rows.reduce((sum, r) => sum + r.v, 0);
  const alerts = rows.reduce((sum, r) => sum + r.a, 0);
  $("#repK").innerHTML =
    `<div class="card"><b>${fmtNumber(total)}</b>Visitantes no período</div>` +
    `<div class="card"><b>${fmtNumber(Math.round(total / days))}</b>Média por dia</div>` +
    `<div class="card"><b>${alerts}</b>Alertas no período</div>`;

  // Tabela (dia mais recente primeiro)
  $("#rep").innerHTML = rows
    .slice()
    .reverse()
    .map((r) => `<tr><td>${r.d}</td><td>${fmtNumber(r.v)}</td><td>${r.l} m</td><td>${r.a}</td></tr>`)
    .join("");
}

/** Copia texto para a área de transferência (com plano B para navegadores antigos). */
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* cai no plano B abaixo */
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;top:-100px;opacity:0";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

let copyLabelTimer;

function initReports() {
  $("#per").addEventListener("change", renderReport);

  $("#cp").addEventListener("click", async () => {
    const rows = state.reportRows;
    const text =
      `Resumo de ${rows.length} dias\n` +
      rows.map((r) => `${r.d}: ${r.v} visitantes, rio ${r.l} m, ${r.a} alertas`).join("\n");

    const button = $("#cp");
    button.textContent = (await copyText(text)) ? "Resumo copiado" : "Não foi possível copiar";
    clearTimeout(copyLabelTimer);
    copyLabelTimer = setTimeout(() => {
      button.textContent = "Copiar resumo";
    }, 2000);
  });

  renderReport();
}
