/* hud02-frame-adapt.js — dynamic SVG frame for HUD-02 html-mode panels
   =====================================================================
   Problem: the SVG frame is position:absolute inset:0 with preserveAspectRatio="none".
   When .nc-or-panel grows taller than 420px (html mode, long content), the entire
   frame stretches — corners and teeth distort.

   Solution: ResizeObserver on each .nc-or-panel.  Whenever the layout height H
   changes, recalculate only the Y coordinates that belong to the bottom corners,
   right stanchion, and teeth.  Top section and left notch are never touched.
   viewBox height is updated to match H so stroke-width stays 1:1.

   Original frame geometry (viewBox 0 0 1200 420, H₀ = 420):

     Main frame   M36 38 L270 38 L298 62 L1160 62
                  L1160 326 L1106 382 L70 382 L70 160 L36 132 Z
                       ^^^fixed top+left^^^   ^^^bottom at H₀-94 / H₀-38^^^

     Inner frame  M58 76 L1140 76 L1140 316 L1092 366 L58 366 Z
                               ^^^bottom at H₀-104 / H₀-54^^^

     Teeth rects  y=382 (H₀-38), height=28 → bottom at H₀-10
     Teeth box    M98 382 L304 382 L304 412 L98 412 Z
                              ^^^H₀-38 / H₀-8^^^

   For arbitrary H, all bottom Y values are replaced by (H - constant).
   Top section (y=38…62), left notch (y=132…160), and runner paths use main frame.
*/
'use strict';

(function (global) {

  var BASE = 420;   /* original viewBox height */

  /* ── Path builders ────────────────────────────────────────────── */

  function mainD(H) {
    return 'M36 38 L270 38 L298 62 L1160 62' +
           ' L1160 ' + (H - 94)  +
           ' L1106 ' + (H - 38)  +
           ' L70 '   + (H - 38)  +
           ' L70 160 L36 132 Z';
  }

  function innerD(H) {
    return 'M58 76 L1140 76' +
           ' L1140 ' + (H - 104) +
           ' L1092 ' + (H - 54)  +
           ' L58 '   + (H - 54)  + ' Z';
  }

  function teethBoxD(H) {
    return 'M98 '  + (H - 38) +
           ' L304 ' + (H - 38) +
           ' L304 ' + (H - 8)  +
           ' L98 '  + (H - 8)  + ' Z';
  }

  /* innerD()'s leftmost/rightmost X (viewBox units). The frame SVG is
     stretched non-uniformly onto the panel's real width
     (preserveAspectRatio="none"), so the inner line's true px distance
     from the panel edge moves with panel width — it can't be a fixed CSS
     constant. Recomputed on every adapt() call and written as
     --nc-inner-left/right on the widget so the html-slot's own padding
     (blogger-hud02-template.css) — and anything positioned relative to
     it, e.g. --nc-text-left — can reference the frame's true position. */
  var INNER_X = [58, 1140];
  function setInnerInsetVars(panel) {
    var widget = panel.parentElement;
    if (!widget || !widget.style) return;
    var w = panel.offsetWidth || 1;
    var scaleX = w / 1200;
    var left  = INNER_X[0] * scaleX;
    var right = w - INNER_X[1] * scaleX;
    widget.style.setProperty('--nc-inner-left',  left.toFixed(1)  + 'px');
    widget.style.setProperty('--nc-inner-right', right.toFixed(1) + 'px');
  }

  /* Image content type: .nc-hud-text is position:absolute (the only way to
     place text at an exact px offset from the portrait image), so it's out
     of normal flow and panel height:auto has no idea how tall it really is
     — the panel sizes to the title (the only in-flow content) and
     overflow:hidden then clips everything below that. Measure the text
     directly and grow the panel's own min-height to match.
     Deliberately NOT folding .nc-hud-slot-image into this: its own height
     is itself a % of the panel (--nc-image-micro-height etc), so using it
     here would make panel height depend on a value that depends on panel
     height — growing forever instead of settling. */
  function growPanelForAbsoluteText(panel) {
    var text = panel.querySelector('.nc-hud-text');
    if (!text || getComputedStyle(text).position !== 'absolute') {
      panel.style.minHeight = '';
      return;
    }
    /* 76px, not a round guess: matches blogger-hud02-template.css's
       html-slot padding-bottom, which clears the inner-frame line (54px
       above the panel's real bottom edge — vertical scale is always 1:1,
       unlike the horizontal preserveAspectRatio="none" stretch) plus a
       ~22px cushion. Anything less and the text lands flush on the frame
       line instead of sitting inside it, same bug already fixed for the
       HeyGen row's bottom padding. */
    panel.style.minHeight = (text.offsetTop + text.offsetHeight + 76) + 'px';
  }

  /* ── Core update ──────────────────────────────────────────────── */

  function adapt(panel, overrideH) {
    setInnerInsetVars(panel);

    /* Try both SVG elements used in HUD-02 (frame + runner) */
    var svgs = panel.querySelectorAll('.nc-or-frame-svg, .nc-or-runner-svg');
    if (!svgs.length) return;

    var H = (overrideH !== undefined)
          ? overrideH
          : Math.round(panel.offsetHeight);
    if (!H || H < BASE) H = BASE;

    var md = mainD(H);
    var id = innerD(H);
    var td = teethBoxD(H);

    svgs.forEach(function (svg) {
      svg.setAttribute('viewBox', '0 0 1200 ' + H);

      svg.querySelectorAll('path, rect').forEach(function (el) {
        var c = el.classList;

        /* Main frame + all runner layers share the same outer path */
        if (c.contains('nc-or-frame-main')    ||
            c.contains('nc-or-runner-tail')   ||
            c.contains('nc-or-runner-body')   ||
            c.contains('nc-or-runner-head')   ||
            c.contains('nc-or-runner-spark')) {
          el.setAttribute('d', md);
          return;
        }

        /* Inner bevel */
        if (c.contains('nc-or-frame-inner')) {
          el.setAttribute('d', id);
          return;
        }

        /* Teeth bounding box */
        if (c.contains('nc-or-frame-teeth-box')) {
          el.setAttribute('d', td);
          return;
        }

        /* Individual tooth rects — shift y to follow bottom edge */
        if (el.tagName.toLowerCase() === 'rect' &&
            el.closest('.nc-or-frame-teeth')) {
          el.setAttribute('y',      H - 38);
          el.setAttribute('height', 28);
          return;
        }
      });
    });
  }

  /* ── Smooth path interpolation ────────────────────────────────── */

  function adaptSmooth(panel, duration) {
    var svgs = panel.querySelectorAll('.nc-or-frame-svg');
    if (!svgs.length) return;

    var vb    = svgs[0].getAttribute('viewBox') || '';
    var fromH = parseInt(vb.split(' ')[3] || '', 10);
    if (!fromH || fromH < BASE) fromH = BASE;

    var toH = Math.round(panel.offsetHeight);
    if (!toH || toH < BASE) toH = BASE;

    if (fromH === toH) return;

    var startTime = null;

    function frame(now) {
      if (!startTime) startTime = now;
      var p = (now - startTime) / duration;
      if (p >= 1) { adapt(panel, toH); return; }
      var ep = 1 - (1 - p) * (1 - p);   /* ease-out quad */
      adapt(panel, Math.round(fromH + (toH - fromH) * ep));
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  /* ── Per-panel watcher ────────────────────────────────────────── */

  function watch(panel) {
    var widget  = panel.parentElement;
    var ro      = null;
    var fbTimer = null;

    function startRO() {
      if (ro || typeof ResizeObserver === 'undefined') return;
      ro = new ResizeObserver(function () { adapt(panel); });
      ro.observe(panel);
    }
    function stopRO() {
      if (!ro) return;
      ro.disconnect();
      ro = null;
    }

    function onTransitionEnd(e) {
      if (e.propertyName !== 'transform') return;
      panel.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fbTimer);
      adaptSmooth(panel, 500);
      startRO();
    }

    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(function () {
        if (widget.classList.contains('is-mini')) {
          stopRO();
          clearTimeout(fbTimer);
          panel.removeEventListener('transitionend', onTransitionEnd);
          adapt(panel);   /* reset to BASE */
        } else {
          panel.addEventListener('transitionend', onTransitionEnd);
          fbTimer = setTimeout(function () {
            panel.removeEventListener('transitionend', onTransitionEnd);
            adaptSmooth(panel, 500);
            startRO();
          }, 1200);
        }
      }).observe(widget, { attributes: true, attributeFilter: ['class'] });
    } else {
      startRO();
    }

    adapt(panel);

    /* Image content type only: keep the panel tall enough for the
       absolutely-positioned .nc-hud-text — see growPanelForAbsoluteText()
       above. Independent of the is-mini/RO machinery above (that's purely
       about the decorative SVG); this needs its own observer because the
       text's height changes with its own content/width, not the panel's. */
    var textEl = panel.querySelector('.nc-hud-text');
    if (textEl) {
      growPanelForAbsoluteText(panel);
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(function () { growPanelForAbsoluteText(panel); }).observe(textEl);
      }
    }
  }

  /* ── Entry point ──────────────────────────────────────────────── */

  function init() {
    document.querySelectorAll('.nc-hud-02').forEach(function (widget) {
      var panel = widget.querySelector('.nc-or-panel');
      if (panel) watch(panel);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.NcHud02FrameAdapt = { adapt: adapt, init: init };

}(window));
