"use strict";

/* ==========================================================================
   Ilustrações SVG das câmeras (usadas quando a câmera não tem foto)
   Cada cena desenha dentro de um quadro de 160 x 90.
   ========================================================================== */

/* Cores do céu de cada cena: [topo, base] */
const CEU = [["#355c9a","#9fd0e8"],["#2c4f8a","#8ec5df"],["#27406f","#f0b98a"],["#223a66","#6f86b3"],["#2f5c8f","#a8d8ee"],["#2a4a7a","#bfe0ef"],["#2b4f86","#a5cbe6"],["#2a2038","#2a2038"]];

/* Elementos reutilizáveis: árvores, quedas d'água e neblina. */
const arvores=(n,c,y,sp)=>Array.from({length:n},(_,j)=>{const x=8+j*sp+(j%2)*4,h=18+(j*7)%12;return`<path d="M${x} ${y+h}h-7l7-${h}l7 ${h}z" fill="${c}"/>`}).join("");
const queda=(x,w,y1,y2,o=.9)=>`<rect x="${x}" y="${y1}" width="${w}" height="${y2-y1}" fill="#eaf6ff" opacity="${o}"/>`;
const neblina=(x,y,r)=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="6" fill="#fff" opacity=".35"/>`;

/* Uma função por câmera (na mesma ordem de CAMS). */
const CENAS = [
  // C1 Trilha
 () => `<path d="M0 50L30 35l30 13 40-18 60 16v29H0z" fill="#0f3b2a"/>${arvores(9,"#0b2a1e",42,18)}<path d="M62 90L74 46h12l14 44z" fill="#8a6f4f"/>${arvores(4,"#07190f",56,44)}`,
  // C2 Salto Floriano
 () => `<path d="M0 0h70L60 90H0z" fill="#17402f"/><path d="M120 0h40v90h-48z" fill="#17402f"/>${queda(78,28,8,72)}${neblina(92,72,32)}${neblina(90,66,22)}<rect y="76" width="160" height="14" fill="#0e2f27"/>`,
  // C3 Vista Panorâmica
 () => `<path d="M0 40L40 30l50 8 70-10v40H0z" fill="#12402f"/>${queda(10,14,38,66,.85)}${queda(34,26,34,66)}${queda(70,10,40,66,.8)}${queda(88,34,32,66)}${queda(130,20,36,66,.85)}${neblina(30,68,30)}${neblina(100,68,40)}${neblina(140,68,24)}<rect y="72" width="160" height="18" fill="#1e5aa8"/>`,
  // C4 Estacionamento
 () => `<rect y="28" width="160" height="30" fill="#1a3b3a"/>${arvores(10,"#0d2a22",34,16)}<rect y="58" width="160" height="32" fill="#2b3040"/><path d="M0 62h160M0 82h160" stroke="#ffffff55"/>${[[14,"#c0392b"],[44,"#2f6bff"],[74,"#d7dbe6"],[104,"#f5b324"],[134,"#22d3a0"]].map(([x,c])=>`<rect x="${x}" y="66" width="22" height="11" rx="3" fill="${c}"/><rect x="${x+4}" y="62" width="14" height="6" rx="2" fill="${c}"/>`).join("")}`,
  // C5 Passarela Inferior
 () => `<path d="M0 36h160V60H0z" fill="#12402f"/>${queda(20,120,14,62,.8)}${neblina(40,62,40)}${neblina(110,62,46)}<rect y="64" width="160" height="5" fill="#6b5a45"/><path d="M0 58h160" stroke="#3a2f22" stroke-width="1.5"/>${Array.from({length:14},(_,j)=>`<path d="M${6+j*12} 58v6" stroke="#3a2f22"/>`).join("")}<rect y="69" width="160" height="21" fill="#1b3a2e"/>`,
  // C6 Ilha das Aves
 () => `<path d="M0 40h160v14H0z" fill="#12402f"/>${arvores(12,"#0d2a22",32,14)}<rect y="52" width="160" height="38" fill="#1e5aa8"/><path d="M0 62h160M0 74h160" stroke="#6fb0ee" stroke-width="2" opacity=".5"/><ellipse cx="62" cy="56" rx="36" ry="8" fill="#13422f"/>${arvores(4,"#0a2a1c",42,18)}<path d="M104 20q4-4 8 0q4-4 8 0M126 28q3-3 6 0q3-3 6 0M90 30q3-3 6 0q3-3 6 0" stroke="#fff" fill="none"/>`,
  // C7 Centro de Visitantes
 () => `<rect x="26" y="30" width="108" height="38" fill="#d9dfef"/><path d="M20 30h120l-8-9H28z" fill="#30406e"/>${[0,1,2,3,4,5].map(j=>`<rect x="${34+j*17}" y="38" width="11" height="14" fill="#2f6bff" opacity=".8"/>`).join("")}<rect x="74" y="54" width="12" height="14" fill="#30406e"/><rect y="68" width="160" height="22" fill="#7d8aa8"/>${[[40,76],[58,80],[100,77],[118,82],[84,84]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.2" fill="#f2c9a0"/><rect x="${x-1.5}" y="${y+2}" width="3" height="6" fill="#30406e"/>`).join("")}`,
  // C8 Restaurante
 () => `<rect x="18" y="10" width="124" height="36" fill="#143f2e"/>${queda(76,10,10,46,.7)}<path d="M18 46h124" stroke="#c9b27c" stroke-width="3"/>${[34,80,126].map(x=>`<ellipse cx="${x}" cy="64" rx="15" ry="5" fill="#c9b27c"/><path d="M${x} 66v14" stroke="#c9b27c" stroke-width="2"/><rect x="${x-20}" y="68" width="6" height="8" fill="#6b4a2f"/><rect x="${x+14}" y="68" width="6" height="8" fill="#6b4a2f"/>`).join("")}`
];

/**
 * Devolve o SVG da cena da câmera `i`, ou "" se ela não tiver ilustração.
 * `uid` deixa o id do gradiente único, já que a mesma cena pode aparecer na
 * grade e na janela ampliada ao mesmo tempo.
 */
const scene = (i, uid) =>
  !CENAS[i]
    ? ""
    : `<svg class="sc" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CEU[i][0]}"/><stop offset="1" stop-color="${CEU[i][1]}"/></linearGradient></defs><rect width="160" height="90" fill="url(#${uid})"/>${CENAS[i]()}</svg>`;
