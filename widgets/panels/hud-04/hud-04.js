/* hud-04.js — HUD Post with media embed
   Provides mini/expand toggle via shared NcHudMini.
   Iframe lifecycle: mini-iframe plays when collapsed; main-iframe plays when expanded.
*/
'use strict';

(function () {
  function init() {
    var widget     = document.querySelector('.nc-hp-widget');
    var panel      = widget && widget.querySelector('.nc-hp-panel');
    var miniCard   = widget && widget.querySelector('.nc-hp-mini-card');
    var miniIframe = miniCard && miniCard.querySelector('iframe');
    var mainIframe = panel   && panel.querySelector('iframe');
    if (!widget || !panel) return;

    /* Capture original src values before any manipulation */
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
      expandedMaxH : 2000,

      onCollapse: function () {
        /* Stop main iframe — saves resources while panel is hidden */
        if (mainIframe && mainSrc) mainIframe.src = 'about:blank';

        /* Restart mini iframe on subsequent collapses (first collapse: it's
           already loading from HTML, resetting src here would reload it twice) */
        if (!firstCollapse && miniIframe && miniSrc) miniIframe.src = miniSrc;
        firstCollapse = false;
      },

      onExpand: function () {
        /* Stop mini iframe after the panel is fully expanded and visible */
        if (miniIframe) miniIframe.src = 'about:blank';
      }
    });

    /* Restore main iframe immediately at expand-start — fires when is-mini is
       removed, before the 700ms height transition completes, so the video has
       time to load while the animation plays. */
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
