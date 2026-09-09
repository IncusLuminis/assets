/* hud-07.js — Wide HTML panel
   Handles accordion click-to-toggle and mini/expand toggle.
   Manages aria-expanded and the .sa-open class used by CSS transitions.
*/
'use strict';

(function () {
  function initAccordions() {
    document.querySelectorAll('.sa-accordion').forEach(function (accordion) {
      var button = accordion.querySelector('.sa-toggle');
      if (!button) return;

      button.addEventListener('click', function () {
        var isOpen = accordion.classList.toggle('sa-open');
        button.setAttribute('aria-expanded', String(isOpen));
      });
    });
  }

  function initMiniToggle() {
    var widget = document.querySelector('.nc-hw-widget');
    var panel  = widget && widget.querySelector('.nc-hw-panel');
    if (!widget || !panel) return;

    NcHudMini.init({
      widget       : widget,
      panel        : panel,
      miniH        : 148,
      scale        : 0.35,
      expandedMaxH : 2000
    });
  }

  function init() {
    initAccordions();
    initMiniToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
