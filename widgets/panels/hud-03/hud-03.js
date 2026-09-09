/* hud-03.js — HUD Post panel
   Provides mini/expand toggle via shared NcHudMini.
*/
'use strict';

(function () {
  function init() {
    var widget   = document.querySelector('.nc-hp-widget');
    var panel    = widget && widget.querySelector('.nc-hp-panel');
    var miniCard = widget && widget.querySelector('.nc-hp-mini-card');
    if (!widget || !panel) return;

    /* Prevent mini card from animating during the initial snap to mini state */
    if (miniCard) miniCard.style.transition = 'none';

    NcHudMini.init({
      widget       : widget,
      panel        : panel,
      miniH        : 148,
      scale        : null,   /* mini card overlay used instead of panel scaling */
      expandedMaxH : 2000
    });

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
