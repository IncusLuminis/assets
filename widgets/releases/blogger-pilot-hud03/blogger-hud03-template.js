/* ================================================================
   NebulaCast HUD Panel — Blogger Template JS
   Version : 1.0  (2026-05-24)

   WHERE TO PUT THIS:
   Blogger → Theme → Edit HTML
   Paste the <script> block from optional/blogger-template-snippet.txt
   just before the closing </body> tag.

   This file must load ONCE per page.
   Each post's HTML block calls NcHudMini.init() in its own <script>.
   ================================================================ */

'use strict';

/* ── NcHudMini — collapse / expand toggle module ─────────────── */

(function (global) {

  function init(opts) {
    var widget       = opts.widget;
    var panel        = opts.panel;
    var miniH        = opts.miniH        || 148;
    var scale        = opts.scale        || null;
    var expandedMaxH = opts.expandedMaxH || 2000;

    if (!widget || !panel) {
      console.warn('[NcHudMini] widget or panel not found');
      return;
    }

    widget.classList.add('nc-mini-widget');
    panel.classList.add('nc-mini-panel');

    /* ── Toggle button ──────────────────────────────────────── */
    var btn = document.createElement('button');
    btn.className = 'nc-ol-toggle-btn';
    btn.type = 'button';
    /* Wrap button + system label in a positioned row above inner frame */
    var sysEl = panel.querySelector('.nc-hp-system');
    if (sysEl && sysEl.parentNode) {
      var sysRow = document.createElement('div');
      sysRow.className = 'nc-hp-system-row';
      sysEl.parentNode.insertBefore(sysRow, sysEl);
      sysRow.appendChild(btn);
      sysRow.appendChild(sysEl);
    } else {
      panel.appendChild(btn);
    }

    function updateBtn() {
      var mini = widget.classList.contains('is-mini');
      btn.textContent = mini ? '▼' : '▲';
      btn.setAttribute('aria-label',    mini ? 'Expand panel'       : 'Collapse panel');
      btn.setAttribute('aria-expanded', mini ? 'false'              : 'true');
      btn.setAttribute('data-tooltip',  mini ? 'Развернуть панель'  : 'Свернуть панель');
    }

    /* ── Expand ─────────────────────────────────────────────── */
    function expand() {
      widget.classList.remove('is-mini');
      widget.style.maxHeight = expandedMaxH + 'px';
      widget.style.cursor    = '';
      if (scale) {
        panel.style.transform     = '';
        btn.style.transform       = '';
        btn.style.transformOrigin = '';
      }
      updateBtn();

      var fired = false;
      function onExpanded() {
        if (fired) return;
        if (widget.classList.contains('is-mini')) return;
        fired = true;
        widget.style.overflow = '';
        if (typeof opts.onExpand === 'function') opts.onExpand();
      }
      var handled = false;
      function onTransitionEnd(e) {
        if (e.propertyName !== 'transform') return;
        panel.removeEventListener('transitionend', onTransitionEnd);
        handled = true;
        onExpanded();
      }
      panel.addEventListener('transitionend', onTransitionEnd);
      setTimeout(function () {
        if (!handled) {
          panel.removeEventListener('transitionend', onTransitionEnd);
          onExpanded();
        }
      }, 900);
    }

    /* ── Collapse ───────────────────────────────────────────── */
    function collapse() {
      if (typeof opts.onCollapse === 'function') opts.onCollapse();
      widget.classList.add('is-mini');
      widget.style.maxHeight = miniH + 'px';
      widget.style.overflow  = 'hidden';
      widget.style.cursor    = 'pointer';
      if (scale) {
        panel.style.transform     = 'scale(' + scale + ')';
        btn.style.transform       = 'scale(' + (1 / scale).toFixed(4) + ')';
        btn.style.transformOrigin = 'top right';
      }
      updateBtn();
    }

    /* ── Events ─────────────────────────────────────────────── */
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (widget.classList.contains('is-mini')) expand(); else collapse();
    });
    widget.addEventListener('click', function () {
      if (widget.classList.contains('is-mini')) expand();
    });

    /* Snap to mini instantly on init (skip CSS transition) */
    widget.style.transition = 'none';
    panel.style.transition  = 'none';
    collapse();
    panel.offsetHeight;           /* force reflow */
    widget.style.transition = '';
    panel.style.transition  = '';
  }

  global.NcHudMini = { init: init };

})(window);
