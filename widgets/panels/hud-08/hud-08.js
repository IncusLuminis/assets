/* hud-08.js — Expandable inline HUD panel behaviour
   Implements: initHudPanels / expandHudPanel / collapseHudPanel / chooseExpandedLayout
   Spec: widgets/specs/Animations.md §11–12
   No dependencies. Safe with multiple panels per page.
*/
'use strict';

(function () {

  var HORIZ_THRESHOLD = 400; /* px — switch point between H/V layout */

  /* ── Layout selector ─────────────────────────────────────────── */

  function chooseExpandedLayout(panel) {
    var host = panel.closest('.nc-hud-host') || panel.parentElement;
    var w = host ? host.getBoundingClientRect().width : window.innerWidth;
    var isH = w >= HORIZ_THRESHOLD;
    panel.classList.toggle('is-horizontal', isH);
    panel.classList.toggle('is-vertical', !isH);
  }

  /* ── Expand ──────────────────────────────────────────────────── */

  function expandHudPanel(panel) {
    var mini     = panel.querySelector('.nc-hud-mini');
    var expanded = panel.querySelector('.nc-hud-expanded');

    chooseExpandedLayout(panel);

    panel.classList.remove('is-mini');
    panel.classList.add('is-expanded');

    if (mini)     mini.setAttribute('aria-expanded', 'true');
    if (expanded) expanded.removeAttribute('aria-hidden');

    /* Focus collapse button for keyboard users */
    var collapseBtn = panel.querySelector('.nc-hud-collapse');
    if (collapseBtn) {
      /* slight delay so the expand transition starts first */
      setTimeout(function () { collapseBtn.focus(); }, 80);
    }
  }

  /* ── Collapse ────────────────────────────────────────────────── */

  function collapseHudPanel(panel) {
    var mini     = panel.querySelector('.nc-hud-mini');
    var expanded = panel.querySelector('.nc-hud-expanded');

    panel.classList.remove('is-expanded', 'is-horizontal', 'is-vertical');
    panel.classList.add('is-mini');

    if (mini)     mini.setAttribute('aria-expanded', 'false');
    if (expanded) expanded.setAttribute('aria-hidden', 'true');

    if (mini) mini.focus();
  }

  /* ── Resize handling ─────────────────────────────────────────── */

  function onResize(panel) {
    if (panel.classList.contains('is-expanded')) {
      chooseExpandedLayout(panel);
    }
  }

  /* ── Per-panel init ──────────────────────────────────────────── */

  function initHudPanel(panel) {
    var mini       = panel.querySelector('.nc-hud-mini');
    var expanded   = panel.querySelector('.nc-hud-expanded');
    var collapseBtn = panel.querySelector('.nc-hud-collapse');

    /* Ensure correct initial state */
    if (!panel.classList.contains('is-expanded')) {
      panel.classList.add('is-mini');
    }
    if (expanded && panel.classList.contains('is-mini')) {
      expanded.setAttribute('aria-hidden', 'true');
    }
    if (mini) {
      mini.setAttribute('aria-expanded', panel.classList.contains('is-expanded') ? 'true' : 'false');
    }

    /* Mini → expand */
    if (mini) {
      mini.addEventListener('click', function () { expandHudPanel(panel); });
    }

    /* Collapse button */
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () { collapseHudPanel(panel); });
    }

    /* Escape key collapses */
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-expanded')) {
        collapseHudPanel(panel);
      }
    });

    /* Resize: switch H/V while expanded */
    var host = panel.closest('.nc-hud-host') || panel.parentElement;

    if (typeof ResizeObserver !== 'undefined' && host) {
      var ro = new ResizeObserver(function () { onResize(panel); });
      ro.observe(host);
    } else {
      window.addEventListener('resize', function () { onResize(panel); });
    }
  }

  /* ── Global init ─────────────────────────────────────────────── */

  function initHudPanels() {
    document.querySelectorAll('[data-hud-panel]').forEach(initHudPanel);
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHudPanels);
  } else {
    initHudPanels();
  }

})();
