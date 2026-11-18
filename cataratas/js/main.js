"use strict";

/* ==========================================================================
   Ponto de entrada: liga os módulos na ordem certa.
   ========================================================================== */

function init() {
  initTheme();
  initHome();     // clima, visitantes e indicadores (precisa vir antes dos alertas)
  initCameras();
  initAlerts();   // usa o clima e define o dia exibido
  initMap();
  initReports();
  initContact();
  initSearch();
  initHero();
  initRouter();   // por último: mostra a tela pedida pela URL
}

init();
