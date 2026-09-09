/* hud-06.js — Vertical Sidebar panel
   Draws the SVG frame and positions the loader/ticker at runtime.
   Media element stays in CSS content flow (not JS-positioned).
   Must run after layout; listens for resize to re-draw.
*/
'use strict';

(function () {
  function drawVerticalSidebarFrame(widget) {
    const panel   = widget.querySelector('.nc-vs-panel');
    const svg     = widget.querySelector('.nc-vs-svg-frame');
    const g       = widget.querySelector('.nc-vs-frame-g');
    const loader  = widget.querySelector('.nc-vs-loader');
    const ticker  = widget.querySelector('.nc-vs-ticker');
    const content = widget.querySelector('.nc-vs-content');

    if (!panel || !svg || !g || !loader || !ticker || !content) return;

    const W = panel.offsetWidth;
    if (!W) return;

    const pad = Math.round(W * 18 / 320);
    const bev = Math.round(W * 50 / 320);

    content.style.paddingTop    = (pad + 22) + 'px';
    content.style.paddingLeft   = (pad + 8)  + 'px';
    content.style.paddingRight  = (pad + 8)  + 'px';
    content.style.paddingBottom = (pad + 36) + 'px';

    const H = panel.offsetHeight;

    /* outer polygon points */
    const x0  = pad;
    const y0  = pad;
    const x1  = W - pad;
    const y1  = pad;
    const x1b = W - pad;
    const y1b = H - pad - bev;
    const x2  = W - pad - bev;
    const y2  = H - pad;
    const x3  = pad;
    const y3  = H - pad;

    const outer = `${x0},${y0} ${x1},${y1} ${x1b},${y1b} ${x2},${y2} ${x3},${y3}`;

    /* inner polygon (inset by ip px) */
    const ip   = 6;
    const ix0  = x0 + ip;
    const iy0  = y0 + ip;
    const ix1  = x1 - ip;
    const iy1  = y1 + ip;
    const ix1b = x1 - ip;
    const iy1b = y1b - ip * (bev / (bev + 50));
    const ix2  = x2 - ip * (50 / (bev + 50)) * 0.5;
    const iy2  = y2 - ip;
    const ix3  = x0 + ip;
    const iy3  = y3 - ip;

    const inner = `${ix0},${iy0} ${ix1},${iy1} ${ix1b},${iy1b} ${ix2},${iy2} ${ix3},${iy3}`;

    /* loader bar */
    const loaderH = Math.round(H * 10 / 480);
    const loaderW = Math.round(W * 180 / 320);
    const loaderX = Math.round((x0 + x2) / 2 - loaderW / 2);
    const loaderY = y3 + Math.round(H * 3 / 480);

    loader.style.left   = loaderX + 'px';
    loader.style.top    = loaderY + 'px';
    loader.style.width  = loaderW + 'px';
    loader.style.height = loaderH + 'px';

    /* strip-line connecting loader to bottom frame edge */
    const lineY    = loaderY + loaderH + 3;
    const lineEndX = x2 - Math.round(W * 14 / 320);
    const stripLine =
      `M ${loaderX},${y3} L ${loaderX},${lineY} ` +
      `L ${lineEndX},${lineY} L ${x2},${y3}`;

    /* ticker */
    ticker.style.left   = (x0 + 36)         + 'px';
    ticker.style.top    = (y0 - 19)          + 'px';
    ticker.style.width  = (x1 - x0 - 80)    + 'px';
    ticker.style.height = '16px';

    /* corner brackets */
    const ltOff = Math.round(W * 6  / 320);
    const ltT   = Math.round(W * 8  / 320);
    const ltHW  = Math.round(W * 36 / 320);
    const ltVH  = Math.round(H * 64 / 480);
    const ltBev = Math.round(H * 14 / 480);

    const lx = x0 - ltOff;
    const lt = y0 - ltOff;

    const cornerTL =
      `${lx},${lt} ${lx + ltHW},${lt} ${lx + ltHW},${lt + ltT} ` +
      `${lx + ltT},${lt + ltT} ${lx + ltT},${lt + ltVH} ${lx},${lt + ltVH + ltBev}`;

    const lb = y3 + ltOff;
    const cornerBL =
      `${lx},${lb} ${lx},${lb - ltVH - ltBev} ${lx + ltT},${lb - ltVH} ` +
      `${lx + ltT},${lb - ltT} ${lx + ltHW},${lb - ltT} ${lx + ltHW},${lb}`;

    const rx   = x1 + ltOff;
    const rt   = y0 - ltOff;
    const rtVH = Math.round(H * 44 / 480);
    const cornerTR =
      `${rx - ltHW},${rt} ${rx},${rt} ${rx},${rt + rtVH} ` +
      `${rx - ltT},${rt + rtVH} ${rx - ltT},${rt + ltT} ${rx - ltHW},${rt + ltT}`;

    const bevOff   = ltT;
    const bLtOff   = 0;    /* bevel bracket sits ON the diagonal (outer edge = x+y=frame diagonal) */
    const cornerBevel =
      `${x1b + bLtOff},${y1b - bevOff} ${x1b + bLtOff + ltT},${y1b - bevOff} ` +
      `${x2 + bLtOff + ltT},${y2 + bLtOff} ${x2 + bLtOff - ltT},${y2 + bLtOff} ` +
      `${x2 + bLtOff - ltT + bevOff},${y2 + bLtOff - bevOff}`;

    g.innerHTML =
      `<polygon points="${outer}"       fill="#000"    stroke="none"/>` +
      `<polygon points="${outer}"       fill="none"    stroke="#1ab8f0" stroke-width="2.5" filter="url(#ncVsGlow)"/>` +
      `<polygon points="${inner}"       fill="none"    stroke="#1ab8f0" stroke-width="1"   opacity="0.7"/>` +
      `<polygon points="${cornerTL}"    fill="#1ab8f0" filter="url(#ncVsGlow)"/>` +
      `<polygon points="${cornerBL}"    fill="#1ab8f0" filter="url(#ncVsGlow)"/>` +
      `<polygon points="${cornerTR}"    fill="#1ab8f0" filter="url(#ncVsGlow)"/>` +
      `<polygon points="${cornerBevel}" fill="#1ab8f0" filter="url(#ncVsGlow)"/>` +
      `<path d="${stripLine}" fill="none" stroke="#1ab8f0" stroke-width="1.5" filter="url(#ncVsGlowS)"/>`;

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }

  function initVerticalSidebarPanels() {
    document.querySelectorAll('.nc-vs-widget').forEach(function (widget) {
      drawVerticalSidebarFrame(widget);
      requestAnimationFrame(function () { drawVerticalSidebarFrame(widget); });
    });
  }

  function initMiniToggles() {
    document.querySelectorAll('.nc-vs-widget').forEach(function (widget) {
      if (widget.dataset.miniInit) return;
      widget.dataset.miniInit = '1';
      var panel      = widget.querySelector('.nc-vs-panel');
      var miniCard   = widget.querySelector('.nc-hp-mini-card');
      var miniIframe = miniCard && miniCard.querySelector('iframe');
      var mainIframe = panel   && panel.querySelector('iframe');
      if (!panel) return;

      var mainSrc      = mainIframe ? mainIframe.src : '';
      var miniSrc      = miniIframe ? miniIframe.src : '';
      var firstCollapse = true;

      /* Prevent mini card from animating during the initial snap to mini state */
      if (miniCard) miniCard.style.transition = 'none';

      NcHudMini.init({
        widget       : widget,
        panel        : panel,
        miniH        : 148,
        scale        : null,   /* mini card overlay used instead of panel scaling */
        expandedMaxH : 1000,

        onCollapse: function () {
          /* Stop main iframe — saves resources while panel is hidden */
          if (mainIframe && mainSrc) mainIframe.src = 'about:blank';

          /* Restart mini iframe on subsequent collapses */
          if (!firstCollapse && miniIframe && miniSrc) miniIframe.src = miniSrc;
          firstCollapse = false;
        },

        onExpand: function () {
          /* Stop mini iframe after panel is fully expanded */
          if (miniIframe) miniIframe.src = 'about:blank';
          drawVerticalSidebarFrame(widget);
        }
      });

      /* Restore main iframe immediately at expand-start so it loads
         during the 700ms height transition */
      if (typeof MutationObserver !== 'undefined') {
        new MutationObserver(function (mutations) {
          mutations.forEach(function (m) {
            if (m.attributeName === 'class' && !widget.classList.contains('is-mini')) {
              if (mainIframe && mainSrc) mainIframe.src = mainSrc;
            }
          });
        }).observe(widget, { attributes: true, attributeFilter: ['class'] });
      }

      /* Commit instant state, then re-enable CSS transition for future toggles */
      if (miniCard) {
        miniCard.offsetHeight;           /* force reflow */
        miniCard.style.transition = '';
      }
    });
  }

  window.addEventListener('resize', initVerticalSidebarPanels);
  window.addEventListener('load',   initVerticalSidebarPanels);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initVerticalSidebarPanels();
      initMiniToggles();
    });
  } else {
    initVerticalSidebarPanels();
    initMiniToggles();
  }
})();
