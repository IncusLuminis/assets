/* hud01-frame-adapt.js — dynamic SVG frame for HUD-01 html-mode panels
   =====================================================================
   Problem: the SVG frame is position:absolute inset:0 with preserveAspectRatio="none".
   When .nc-ol-panel grows taller than 420 px (html mode, long content), the entire
   frame stretches — corners and top/bottom decorations distort.

   Solution: ResizeObserver on each .nc-ol-panel.  Whenever the layout height H
   changes, recalculate only the Y coordinates that belong to the vertical
   stanchions and the bottom corners.  Top corners and top decorations are never
   touched.  viewBox height is updated to match H so stroke-width stays 1:1.

   Original frame geometry (viewBox 0 0 1200 420, H₀ = 420):

     Outer frame   M22 42 L112 42 L158 8 L1160 8 L1190 38
                   L1190 380 L1160 410 L42 410 L12 380 L12 86 Z
                         ^^^fixed top^^^      ^^^bottom at H₀-40 / H₀-10^^^

     Inner frame   M36 62 L126 62 L170 26 L1145 26 L1174 54
                   L1174 366 L1145 394 L60 394 L26 364 L26 96 Z
                              ^^^bottom at H₀-54, H₀-26, H₀-56^^^

     Photo-bottom  M62 392 L500 392           (H₀-28)
     Left tab      M0 190 L12 200 L12 250 L0 260 Z   (centre ≈ H₀/2+15)
     Right tab     M1200 178 L1188 190 L1188 250 L1200 262 Z

   For arbitrary H, all bottom/side Y values are replaced by (H - constant),
   and the side tabs are shifted by delta = (H - H₀) / 2 to stay centred.

   Expand animation strategy:
   • While the panel is EXPANDING (transform transition running), keep SVG at
     BASE paths so nothing looks wrong at intermediate scales.
   • When transitionend fires, smoothly interpolate SVG paths from BASE=420 to
     the actual content height over 300 ms — no hard snap.
   • When COLLAPSING (is-mini added), reset SVG to BASE immediately.
*/
'use strict';

(function (global) {

  var BASE = 420;   /* original viewBox height */

  /* ── Path builders ────────────────────────────────────────────── */

  function outerD(H) {
    return 'M22 42 L112 42 L158 8 L1160 8 L1190 38' +
           ' L1190 ' + (H - 40)  + ' L1160 ' + (H - 10) +
           ' L42 '   + (H - 10)  + ' L12 '   + (H - 40) + ' L12 86 Z';
  }

  function innerD(H) {
    return 'M36 62 L126 62 L170 26 L1145 26 L1174 54' +
           ' L1174 ' + (H - 54)  + ' L1145 ' + (H - 26) +
           ' L60 '   + (H - 26)  + ' L26 '   + (H - 56) + ' L26 96 Z';
  }

  /* innerD()'s leftmost/rightmost X (viewBox units, from the L170 26
     L1145 26 run — the long flat stretch of the inner bevel). The frame
     SVG stretches non-uniformly onto the panel's real width
     (preserveAspectRatio="none"), so the inner line's true px distance
     from the panel edge moves with panel width — not a fixed CSS
     constant. Recomputed on every adapt() call, written as
     --nc-inner-left/right on the widget so the html-slot's own padding
     (blogger-hud01-template.css) can reference the frame's true position
     instead of an approximate constant. */
  var INNER_X = [26, 1174];
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

  /* Image content type: see the equivalent function in
     blogger-hud02-template.css's hud02-frame-adapt.js for the full
     explanation — .nc-hud-text is position:absolute, so the panel's
     height:auto can't see it and overflow:hidden clips it. Grow the
     panel's min-height to match. Not folding in .nc-hud-slot-image on
     purpose: its height is itself a % of the panel, which would make
     panel height depend on a value that depends on panel height. */
  function growPanelForAbsoluteText(panel) {
    var text = panel.querySelector('.nc-hud-text');
    if (!text || getComputedStyle(text).position !== 'absolute') {
      panel.style.minHeight = '';
      return;
    }
    /* 48px, not a round guess: matches blogger-hud01-template.css's
       html-slot padding-bottom (26px inner-frame inset + ~22px cushion —
       see the HUD-02 version of this file for the full explanation). */
    panel.style.minHeight = (text.offsetTop + text.offsetHeight + 48) + 'px';
  }

  /* ── Core update ──────────────────────────────────────────────── */

  function adapt(panel, overrideH) {
    setInnerInsetVars(panel);

    var svg = panel.querySelector('.nc-ol-frame-svg');
    if (!svg) return;

    var H = (overrideH !== undefined)
          ? overrideH
          : Math.round(panel.offsetHeight);
    if (!H || H < BASE) H = BASE;

    /* shift for side tabs so they stay vertically centred */
    var dlt = (H - BASE) / 2;

    svg.setAttribute('viewBox', '0 0 1200 ' + H);

    var od = outerD(H);
    var id = innerD(H);

    svg.querySelectorAll('path').forEach(function (p) {
      var c = p.classList;

      /* outer frame outline + all four runner paths share the same shape */
      if (c.contains('nc-ol-runner-tail') ||
          c.contains('nc-ol-runner-body') ||
          c.contains('nc-ol-runner-head') ||
          c.contains('nc-ol-runner-spark') ||
          (c.contains('nc-ol-frame-line') &&
           !c.contains('nc-ol-frame-inner') &&
           !c.contains('nc-ol-frame-photo-top') &&
           !c.contains('nc-ol-frame-photo-bottom'))) {
        p.setAttribute('d', od);
        return;
      }

      /* inner bevel frame */
      if (c.contains('nc-ol-frame-inner')) {
        p.setAttribute('d', id);
        return;
      }

      /* bottom photo accent line — floats just above the bottom corner */
      if (c.contains('nc-ol-frame-photo-bottom')) {
        p.setAttribute('d', 'M62 ' + (H - 28) + ' L500 ' + (H - 28));
        return;
      }

      /* side accent tabs — keep vertically centred as panel grows */
      if (c.contains('nc-ol-frame-tab') && !c.contains('nc-ol-frame-tab-top')) {
        var d = p.getAttribute('d') || '';
        if (d.charAt(1) === '0') {
          /* left tab: original M0 190 … */
          p.setAttribute('d',
            'M0 '   + (190 + dlt) + ' L12 ' + (200 + dlt) +
            ' L12 ' + (250 + dlt) + ' L0 '  + (260 + dlt) + ' Z');
        } else {
          /* right tab: original M1200 178 … */
          p.setAttribute('d',
            'M1200 '  + (178 + dlt) + ' L1188 ' + (190 + dlt) +
            ' L1188 ' + (250 + dlt) + ' L1200 ' + (262 + dlt) + ' Z');
        }
      }
    });
  }

  /* ── Smooth path interpolation ────────────────────────────────── */
  /* Called after the expand transition ends: slides stanchions from  */
  /* BASE=420 to actual content height over `duration` ms.            */
  /* Uses ease-out-quad so the motion decelerates naturally.          */

  function adaptSmooth(panel, duration) {
    var svg = panel.querySelector('.nc-ol-frame-svg');
    if (!svg) return;

    /* Read current viewBox height as the starting point */
    var vb    = svg.getAttribute('viewBox') || '';
    var fromH = parseInt(vb.split(' ')[3] || '', 10);
    if (!fromH || fromH < BASE) fromH = BASE;

    var toH = Math.round(panel.offsetHeight);
    if (!toH || toH < BASE) toH = BASE;

    if (fromH === toH) return;   /* nothing to animate */

    var startTime = null;

    function frame(now) {
      if (!startTime) startTime = now;
      var p = (now - startTime) / duration;
      if (p >= 1) { adapt(panel, toH); return; }
      /* ease-out quad: fast start, gentle finish */
      var ep = 1 - (1 - p) * (1 - p);
      adapt(panel, Math.round(fromH + (toH - fromH) * ep));
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  /* ── Per-panel watcher ────────────────────────────────────────── */

  function watch(panel) {
    var widget = panel.parentElement;   /* .nc-hud-01.nc-ol-widget */
    var ro     = null;
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
      adaptSmooth(panel, 500);   /* smooth stanchion growth, no snap */
      startRO();
    }

    /* Watch is-mini class toggling on the widget */
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(function () {
        if (widget.classList.contains('is-mini')) {
          /* ── Collapsing ── */
          stopRO();
          clearTimeout(fbTimer);
          panel.removeEventListener('transitionend', onTransitionEnd);
          adapt(panel);   /* H = 420 (locked by CSS) → resets paths instantly */
        } else {
          /* ── Expanding ── keep BASE paths during transform transition so the
             SVG scales correctly, then smooth-animate to actual height. */
          panel.addEventListener('transitionend', onTransitionEnd);
          /* Fallback: if transitionend never fires (reduced-motion etc.) */
          fbTimer = setTimeout(function () {
            panel.removeEventListener('transitionend', onTransitionEnd);
            adaptSmooth(panel, 500);
            startRO();
          }, 1200);
        }
      }).observe(widget, { attributes: true, attributeFilter: ['class'] });
    } else {
      /* No MutationObserver — fall back to always-on ResizeObserver */
      startRO();
    }

    adapt(panel);   /* initial pass */

    /* Image content type only: keep the panel tall enough for the
       absolutely-positioned .nc-hud-text — see growPanelForAbsoluteText()
       above. Its own observer, since the text's height tracks its own
       content/width, not the panel's. */
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
    document.querySelectorAll('.nc-hud-01').forEach(function (widget) {
      var panel = widget.querySelector('.nc-ol-panel');
      if (panel) watch(panel);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* expose for manual re-trigger if needed */
  global.NcHud01FrameAdapt = { adapt: adapt, init: init };

}(window));
