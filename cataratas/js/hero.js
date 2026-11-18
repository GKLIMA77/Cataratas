"use strict";

/* ==========================================================================
   Hero: vídeo do YouTube (mudo, em loop) por cima da foto das Cataratas.
   A foto é o plano B: aparece enquanto o vídeo carrega ou se ele falhar.
   ========================================================================== */

const HERO_VIDEO_ID = "vr42AB7u-eA";
const YT_ORIGIN = "https://www.youtube-nocookie.com";

let heroFrame = null;
let heroShouldPlay = true;

/** Envia um comando ao player do YouTube (ex.: "pauseVideo"). */
function heroCommand(func) {
  heroFrame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: "" }), YT_ORIGIN);
}

/** Pausa o vídeo quando a tela inicial não está visível, para não gastar bateria e dados. */
function setHeroPlaying(play) {
  heroShouldPlay = play;
  heroCommand(play ? "playVideo" : "pauseVideo");
}

function initHero() {
  const hero = $(".hero");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!hero || reducedMotion) return; // sem animação: fica só a foto

  const label = $("#hn");
  const params = new URLSearchParams({
    autoplay: 1,
    mute: 1,
    loop: 1,
    playlist: HERO_VIDEO_ID, // necessário para o loop funcionar
    controls: 0,
    playsinline: 1,
    modestbranding: 1,
    rel: 0,
    enablejsapi: 1,
  });
  if (location.protocol.startsWith("http")) params.set("origin", location.origin);

  const frame = document.createElement("iframe");
  frame.className = "yt";
  frame.title = "Vídeo das Cataratas do Iguaçu";
  frame.tabIndex = -1;
  frame.setAttribute("aria-hidden", "true");
  frame.allow = "autoplay; encrypted-media";
  frame.src = `${YT_ORIGIN}/embed/${HERO_VIDEO_ID}?${params}`;
  heroFrame = frame;

  let failed = false;
  let readyHandled = false;

  // Pede ao player para nos avisar quando estiver pronto (ou se der erro).
  frame.addEventListener("load", () => {
    frame.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1 }), YT_ORIGIN);
  });

  window.addEventListener("message", (e) => {
    if (e.source !== frame.contentWindow || failed) return;

    let data;
    try {
      data = JSON.parse(e.data);
    } catch {
      return;
    }

    if (data.event === "onError") {
      failed = true;
      frame.classList.remove("on");
      label.textContent = "Foto das Cataratas";
    } else if (["onReady", "initialDelivery", "infoDelivery"].includes(data.event)) {
      frame.classList.add("on");
      label.textContent = "Vídeo do YouTube";
      if (!readyHandled) {
        readyHandled = true;
        if (!heroShouldPlay) heroCommand("pauseVideo"); // o usuário abriu o site em outra tela
      }
    }
  });

  // Ajusta o vídeo (vertical, 9:16) para cobrir todo o hero, como "object-fit: cover".
  const fit = () => {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    if (!w || !h) return; // hero escondido (outra tela aberta)
    const height = Math.max((w * 16) / 9, h);
    frame.style.height = `${Math.round(height)}px`;
    frame.style.width = `${Math.round((height * 9) / 16)}px`;
    frame.style.transform = "translate(-50%, -50%)";
  };
  new ResizeObserver(fit).observe(hero);

  hero.insertBefore(frame, $(".hp", hero).nextSibling);
  fit();
}
