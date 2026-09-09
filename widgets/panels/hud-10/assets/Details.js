/* Details.js — HUD-10 Details panel (Blogger / staging) */
'use strict';

(function (global) {
  if (global.NcHud10) return;

  function init(widget, cfg) {
    if (!widget) return;
    cfg = cfg || {};
    var panel = widget.querySelector('.nc-hud-10-panel');
    if (!panel || cfg.mini === false) return;
    if (global.NcHudMini) {
      /* Portrait panel: 992×1586 aspect ratio at panelW=901 → natural height ≈1441px.
         scale=0.352 (same as HUD-03) → mini thumbnail 317px × 148px, showing top ~28%
         of the portrait frame. overflow:hidden is set by NcHudMini when scale≠null. */
      global.NcHudMini.init({
        widget: widget,
        panel: panel,
        miniH: cfg.miniH || 148,
        panelW: cfg.panelW || 901,
        panelH: cfg.panelH || null,
        scale: cfg.scale != null ? cfg.scale : 0.352
      });
    }
  }

  global.NcHud10 = { init: init };
})(typeof window !== 'undefined' ? window : this);
