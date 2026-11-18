# Cataratas – Monitoramento Inteligente

Abra `index.html` no navegador (não precisa de servidor nem de instalação).

```
index.html        estrutura das telas
css/style.css     todo o visual (temas claro/escuro, responsivo)
assets/img/       fotos das câmeras e do hero (antes embutidas em base64)
js/
  utils.js        funções auxiliares, armazenamento e estado
  dados.js        câmeras, alertas, pontos do mapa, rotas
  cenas.js        ilustrações SVG (câmera C7)
  inicio.js       clima, visitantes e indicadores
  cameras.js      grade, janela ampliada e fotos do usuário
  alertas.js      alertas, dias, ocorrências e nível do rio
  mapa.js · relatorios.js · contato.js · busca.js
  hero.js         vídeo do YouTube de fundo
  tema.js · rotas.js · main.js
```
Os scripts são carregados em ordem pelo `index.html`; `main.js` liga tudo.
