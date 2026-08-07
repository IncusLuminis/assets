/* hud-mini.js — generic mini/expand toggle for HUD panels
   Provides: window.NcHudMini.init(options)

   options = {
     widget       : HTMLElement   required  widget root
     panel        : HTMLElement   required  main panel inside widget
     miniH        : Number        optional  mini height px (default 148)
     panelW       : Number        optional  panel width in mini state (default 901)
     panelH       : Number        optional  panel height in mini state; set when panel base
                                            CSS does not fix height (e.g. html-mode HUD-01)
     scale        : Number|null   optional  scale factor; null = crop (no transform)
     expandedMaxH : Number        optional  max-height in expanded state (default 2000)
     onCollapse   : Function      optional  called immediately on collapse
     onExpand     : Function      optional  called after expand transition completes
   }

   Mini-panel constraints (width, height, transformOrigin, margin, overflow) are ALL
   applied as inline styles by this module — no per-panel CSS rules needed.
   Button transform in mini state is left entirely to per-panel CSS.
*/
'use strict';

(function (global) {

  /* requestAnimationFrame is paused by the browser for backgrounded/hidden
     tabs (and can be throttled in other cases). The FLIP expand/collapse
     below schedules its *entire* completion path — the transitionend
     listener and its own timeout fallback — inside a single rAF callback,
     so if that rAF never fires the panel gets stuck mid-animation forever
     (visually: click does nothing, or the widget stays pinned at its mini
     size). Race rAF against a plain setTimeout so the callback always runs
     promptly either way. */
  function rafOrTimeout(cb) {
    var done = false;
    function run() {
      if (done) return;
      done = true;
      cb();
    }
    requestAnimationFrame(run);
    setTimeout(run, 100);
  }

  function init(opts) {
    var widget       = opts.widget;
    var panel        = opts.panel;
    var miniH        = opts.miniH        || 148;
    var panelW       = opts.panelW       || 901;
    var panelH       = opts.panelH       || null;
    var scale        = opts.scale        || null;
    var expandedMaxH = opts.expandedMaxH || 2000;
    var collapseMode = widget && widget.getAttribute ? widget.getAttribute('data-collapse') : null;

    if (!widget || !panel) {
      console.warn('[NcHudMini] widget or panel not found');
      return;
    }

    /* Release templates may always pass mini opts; force correct micro geometry by attribute. */
    if (collapseMode === 'micro') {
      var cs = (typeof getComputedStyle === 'function') ? getComputedStyle(widget) : null;
      var cssMicroW = cs ? parseFloat(cs.getPropertyValue('--nc-micro-w')) : NaN;
      var cssMicroH = cs ? parseFloat(cs.getPropertyValue('--nc-micro-h')) : NaN;
      panelW = Number.isFinite(cssMicroW) ? cssMicroW : 87;
      panelH = Number.isFinite(cssMicroH) ? cssMicroH : 130;
      miniH  = panelH + 19;
      scale  = null;
    }

    /* Add transition base classes */
    widget.classList.add('nc-mini-widget');
    panel.classList.add('nc-mini-panel');

    /* Resolve micro image geometry after the real widget DOM has been
       inserted. This is intentionally inline + !important: Blogger themes,
       row layout and embed wrappers can all outrank stylesheet selectors.
       The variables stay on the widget root; 0/0 is the panel's top-left. */
    var microImageTarget = null;
    var microImageSlot = null;
    var microTitle = null;
    function applyMicroTitleState(isMini) {
      if (collapseMode !== 'micro') return;
      if (!microTitle) {
        for (var t = 0; t < widget.children.length; t++) {
          if (widget.children[t].classList &&
              (widget.children[t].classList.contains('nc-ol-title-micro') ||
               widget.children[t].classList.contains('nc-or-title-micro'))) {
            microTitle = widget.children[t];
            break;
          }
        }
      }
      if (!microTitle) return;
      if (!isMini) {
        microTitle.style.setProperty('display', 'none', 'important');
        return;
      }
      var titleCss = getComputedStyle(widget);
      var titleTop = titleCss.getPropertyValue('--nc-title-micro-top').trim() || '0px';
      var titleLeft = titleCss.getPropertyValue('--nc-title-micro-left').trim() || '0px';
      microTitle.style.setProperty('display', 'block', 'important');
      microTitle.style.setProperty('position', 'relative', 'important');
      microTitle.style.setProperty('top', '0', 'important');
      microTitle.style.setProperty('left', '0', 'important');
      microTitle.style.setProperty('transform', 'translate(' + titleLeft + ',' + titleTop + ')', 'important');
    }
    function applyMicroImageGeometry() {
      if (collapseMode !== 'micro') return;
      microImageSlot = panel.querySelector('.nc-hud-01-html-slot, .nc-hud-02-html-slot');
      if (!microImageSlot) return;

      var images = microImageSlot.querySelectorAll('img');
      for (var i = 0; i < images.length; i++) {
        if (!images[i].closest('.nc-hud-media')) { microImageTarget = images[i]; break; }
      }
      if (!microImageTarget) {
        microImageTarget = microImageSlot.querySelector('.nc-hud-media, iframe, object, embed');
      }
      if (!microImageTarget) return;

      var rootCss = getComputedStyle(widget);
      function rootVar(primary, fallback, defaultValue) {
        return rootCss.getPropertyValue(primary).trim() ||
          rootCss.getPropertyValue(fallback).trim() || defaultValue;
      }
      microImageSlot.style.setProperty('position', 'absolute', 'important');
      microImageSlot.style.setProperty('inset', '0', 'important');
      microImageSlot.style.setProperty('width', '100%', 'important');
      microImageSlot.style.setProperty('height', panelH + 'px', 'important');
      microImageSlot.style.setProperty('overflow', 'visible', 'important');

      microImageTarget.style.setProperty('position', 'absolute', 'important');
      microImageTarget.style.setProperty('top', rootVar('--nc-image-micro-top', '--nc-image-top', '0px'), 'important');
      microImageTarget.style.setProperty('left', rootVar('--nc-image-micro-left', '--nc-image-left', '0px'), 'important');
      microImageTarget.style.setProperty('right', 'auto', 'important');
      microImageTarget.style.setProperty('bottom', 'auto', 'important');
      microImageTarget.style.setProperty('width', rootVar('--nc-image-micro-width', '--nc-image-width', '100%'), 'important');
      microImageTarget.style.setProperty('height', rootVar('--nc-image-micro-height', '--nc-image-height', '100%'), 'important');
      microImageTarget.style.setProperty('min-width', '0', 'important');
      microImageTarget.style.setProperty('max-width', 'none', 'important');
      microImageTarget.style.setProperty('min-height', '0', 'important');
      microImageTarget.style.setProperty('max-height', 'none', 'important');
      microImageTarget.style.setProperty('transform', 'none', 'important');
      microImageTarget.style.setProperty('z-index', '0', 'important');
    }

    /* ── Toggle button ───────────────────────────────────────────── */
    var btn = document.createElement('button');
    btn.className = 'nc-ol-toggle-btn';
    btn.type      = 'button';
    /* HUD-03 compatibility: wrap button + system label in nc-hp-system-row.
       For all other panels (no .nc-hp-system) falls back to panel.appendChild. */
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
      btn.setAttribute('aria-label',    mini ? 'Expand HUD panel'   : 'Collapse HUD panel');
      btn.setAttribute('aria-expanded', mini ? 'false'              : 'true');
      btn.setAttribute('data-tooltip',  mini ? 'Развернуть панель'  : 'Свернуть панель');
    }

    /* ── Mini-panel constraints ──────────────────────────────────── */
    /* Applied as inline styles — works for any panel type without
       per-type CSS rules.  Button transform is left to CSS.
       IMPORTANT: width/maxWidth/height use setProperty('…','important')
       because CSS animations (e.g. the HUD-02 ncOrOpenHud width animation)
       have higher cascade priority than normal inline styles but are
       overridden by !important inline styles. */
    function applyMiniConstraints() {
      if (scale) panel.style.transform = 'scale(' + scale + ')';
      panel.style.transformOrigin = 'top left';
      panel.style.setProperty('width',     panelW + 'px', 'important');
      panel.style.setProperty('max-width', 'none',        'important');
      if (panelH) panel.style.setProperty('height', panelH + 'px', 'important');
      panel.style.margin   = '0';
      /* micro (scale=null): keep overflow visible so the SVG frame drop-shadow
         can paint beyond the 130px panel edge; mini uses hidden to crop the thumbnail */
      panel.style.overflow = scale ? 'hidden' : 'visible';
      /* The WIDGET (not just the panel) inherits margin:0 auto from its base
         (maxi, width:100%) rule — a no-op there, but once .is-mini gives it a
         fixed flex-basis width, auto absorbs the row's free space and
         centers it instead of leaving it flush left at flex-start. Force it
         off explicitly rather than relying on per-panel-type CSS to do it. */
      widget.style.margin = '0';
      applyMicroTitleState(true);
      applyMicroImageGeometry();
    }

    function clearMiniConstraints() {
      panel.style.transform       = '';
      panel.style.transformOrigin = '';
      panel.style.removeProperty('width');
      panel.style.removeProperty('max-width');
      if (panelH) panel.style.removeProperty('height');
      panel.style.margin   = '';
      panel.style.overflow = '';
      widget.style.margin  = '';
      applyMicroTitleState(false);
      if (collapseMode === 'micro' && microImageTarget) {
        ['position','top','left','right','bottom','width','height','min-width',
         'max-width','min-height','max-height','transform','z-index'].forEach(function (prop) {
          microImageTarget.style.removeProperty(prop);
        });
      }
      /* applyMicroImageGeometry() also pins microImageSlot itself (the
         .nc-hud-0X-html-slot) to position:absolute + a fixed micro height
         — inline !important, so it outranks any expanded/html-mode CSS
         rule regardless of specificity. Only the *target* image/media's
         styles were being cleared above; the slot's own pin never was,
         so the slot (and anything that needs it back in normal flow —
         e.g. a HeyGen video + text row) stayed frozen at the micro height
         after expanding, even though .is-mini was gone. */
      if (collapseMode === 'micro' && microImageSlot) {
        ['position','inset','width','height','overflow'].forEach(function (prop) {
          microImageSlot.style.removeProperty(prop);
        });
      }
    }

    /* ── Expand (FLIP) ───────────────────────────────────────────── */
    /* No opacity trick — the panel stays visible throughout.

       mini (scale≠null) — translate + scale FLIP:
         FIRST  = mini thumbnail rect.
         Switch to expanded layout (keep width constraint so LAST has same
         width as FIRST — only the position delta matters).
         LAST   = expanded position with same width.
         INVERT = translate(dx,dy) scale(miniScale) → panel appears at mini spot.
         PLAY   = animate transform → '' (natural expanded state).

       micro (scale=null) — scale-spread FLIP:
         FIRST  = micro thumbnail rect.
         Clear constraints BEFORE measuring LAST so the panel can reach its
         full natural size.  Scale factor = micro / expanded.
         INVERT = translate(dx,dy) scale(scaleX,scaleY) with origin top-left
                  → panel appears shrunken at micro position.
         PLAY   = animate transform → '' → panel "spreads" outward, no slide. */
    function expand() {
      /* Hide the external micro label before the FIRST FLIP measurement.
         Waiting for class removal/constraint cleanup lets it flash for one
         frame alongside the maxi title during the opening transition. */
      applyMicroTitleState(false);

      /* FIRST — current mini/micro visual bounding box */
      var first = panel.getBoundingClientRect();

      /* Allow panel to extend outside widget slot during animation */
      widget.style.overflow = 'visible';

      /* Switch to expanded layout */
      widget.classList.remove('is-mini');
      widget.style.maxHeight = expandedMaxH + 'px';
      widget.style.cursor    = '';
      btn.style.transform       = '';
      btn.style.transformOrigin = '';
      updateBtn();

      panel.style.transition = 'none';

      if (scale) {
        /* ── mini: translate + scale FLIP ───────────────────────── */
        panel.style.setProperty('width', panelW + 'px', 'important');
        panel.style.margin          = '0';
        panel.style.transformOrigin = 'top left';
        /* Clear the mini scale() BEFORE measuring "last" — otherwise
           getBoundingClientRect() still reports the scaled-down (mini)
           visual size even though width was just set to the full panelW,
           making last ≈ first. dx/dy then come out ≈0 and the FLIP
           invert step re-applies the old mini transform, so the panel
           never visually grows — it gets stuck at the mini scale
           (observed as: click does nothing / layout stays collapsed). */
        panel.style.transform = '';

        var last = panel.getBoundingClientRect();
        var dx   = first.left - last.left;
        var dy   = first.top  - last.top;

        panel.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')';
        panel.offsetHeight;   /* force reflow — commits inverted state */

        rafOrTimeout(function () {
          panel.style.transition = 'transform 600ms cubic-bezier(.2,.9,.2,1)';
          panel.style.transform  = '';   /* animate to natural expanded state */

          var fired = false;
          function onExpanded() {
            if (fired) return;
            if (widget.classList.contains('is-mini')) return;
            fired = true;
            panel.style.transition = '';
            clearMiniConstraints();
            widget.style.overflow  = '';
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
          }, 800);
        });

      } else {
        /* ── micro: scale-spread FLIP ───────────────────────────── */
        /* Clear constraints first so LAST reflects the full expanded size */
        clearMiniConstraints();

        var last = panel.getBoundingClientRect();
        var dx   = first.left - last.left;
        var dy   = first.top  - last.top;

        var scaleX = first.width  / Math.max(last.width,  1);
        var scaleY = first.height / Math.max(last.height, 1);

        /* Origin top-left → panel spreads rightward + downward from the
           micro thumbnail's corner instead of sliding in from off-screen */
        panel.style.transformOrigin = 'top left';
        panel.style.transform =
          'translate(' + dx + 'px,' + dy + 'px) scale(' + scaleX + ',' + scaleY + ')';
        panel.offsetHeight;   /* force reflow */

        rafOrTimeout(function () {
          panel.style.transition = 'transform 600ms cubic-bezier(.2,.9,.2,1)';
          panel.style.transform  = '';   /* animate: spread to natural expanded state */

          var fired = false;
          function onExpanded() {
            if (fired) return;
            if (widget.classList.contains('is-mini')) return;
            fired = true;
            panel.style.transition      = '';
            panel.style.transformOrigin = '';
            widget.style.overflow       = '';
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
          }, 800);
        });
      }
    }

    /* ── Collapse (forward-collapse) ────────────────────────────── */
    /* _instant = true  → sync, no animation (used at init time).
       _instant = false → forward-collapse:
         1. Estimate the mini/micro slot position from row siblings.
         2. Apply panel size constraints (mini only) hidden by opacity:0 — so
            the scale factor produces the correct thumbnail size throughout.
         3. Animate the panel from its current expanded position TOWARD the
            mini/micro slot (translate + scale) while staying in the expanded
            flex slot.  No layout change during animation, no floating panel,
            no Blogger-container clipping.
         4. At transitionend: brief opacity:0 hides the layout snap
            (widget.classList.add('is-mini') + applyMiniConstraints).
            Then restore opacity — panel is now in the correct mini/micro state. */
    function collapse(_instant) {
      if (!_instant && typeof opts.onCollapse === 'function') opts.onCollapse();

      if (_instant) {
        widget.classList.add('is-mini');
        widget.style.maxHeight = miniH + 'px';
        /* micro (scale=null): visible so SVG frame glow isn't clipped */
        widget.style.overflow  = scale ? 'hidden' : 'visible';
        widget.style.cursor    = 'pointer';
        applyMiniConstraints();
        updateBtn();
        return;
      }

      /* ── 1. Estimate mini slot position from flex-row siblings ──── */
      /* Widget is currently order:99 at the bottom.  Mini position =
         sum of widths of all is-mini siblings that come before it in
         DOM order (the row has gap:0 so there is no inter-item gap). */
      var par     = widget.parentElement;
      var parRect = par ? par.getBoundingClientRect() : { left: 0, top: 0 };
      var slotLeft = parRect.left;
      var slotTop  = parRect.top;

      if (par) {
        var ch = par.children;
        /* slotTop: use the first mini sibling's top for pixel accuracy */
        var firstMini = null;
        for (var i = 0; i < ch.length; i++) {
          if (ch[i] !== widget && ch[i].classList.contains('is-mini')) {
            if (!firstMini) firstMini = ch[i];
            if (ch[i] === widget) break;
          }
          if (ch[i] === widget) break;
          if (ch[i].classList.contains('is-mini')) {
            slotLeft += ch[i].getBoundingClientRect().width;
          }
        }
        if (firstMini) slotTop = firstMini.getBoundingClientRect().top;
        /* If no mini siblings exist yet, slotLeft/slotTop are still at their
           pre-loop values (parRect.left/top) — which is correct: .nc-hud-row
           is flex + align-items:flex-start with no justify-content, so a
           lone mini widget ends up flush left, not centered. An earlier
           version of this code re-centered slotLeft here for that case,
           but that doesn't match the real CSS layout — the panel would fly
           toward the row's center, then snap left the instant .is-mini
           landed and the real flex rules took over. Do nothing; the
           defaults already agree with the CSS. */
      }

      /* ── 2. Capture unconstrained expanded rect ────────────────── */
      var firstRaw = panel.getBoundingClientRect();

      /* ── 3. Apply size constraints (mini mode only) ────────────── */
      /* For mini: constrain panel to panelW so scale(miniScale) produces
         the exact thumbnail size.  Hidden by brief opacity:0. */
      widget.style.transition = 'none';
      panel.style.transition  = 'none';
      widget.style.opacity    = '0';
      widget.offsetHeight;                   /* reflow — commits opacity:0 */

      if (scale) {
        panel.style.setProperty('width',     panelW + 'px', 'important');
        panel.style.setProperty('max-width', 'none',        'important');
        if (panelH) panel.style.setProperty('height', panelH + 'px', 'important');
        panel.style.margin = '0';
      }
      panel.style.transformOrigin = 'top left';
      panel.style.overflow        = 'visible';  /* prevent clip during animation */
      panel.offsetHeight;                    /* reflow — commits constraints */

      var first = panel.getBoundingClientRect();  /* post-constraint expanded position */
      var dx    = slotLeft - first.left;
      var dy    = slotTop  - first.top;

      /* Hide expanded-slot background so panel animation is clean */
      widget.style.background = 'transparent';
      /* Raise widget above sibling row panels so the shrinking panel
         is never occluded by the mini-row background during animation */
      widget.style.zIndex     = '9999';

      /* ── 4. Restore opacity — user sees animation start ─────────── */
      widget.style.opacity    = '';
      widget.style.transition = '';
      /* Allow panel to leave widget's bounds as it flies to the mini slot.
         Without this the widget's CSS overflow:hidden clips the panel the
         moment it crosses the widget edge. */
      widget.style.overflow   = 'visible';
      panel.style.transition  = 'transform 600ms cubic-bezier(.42,0,.58,1)';

      rafOrTimeout(function () {
        if (scale) {
          /* mini: translate to slot + scale to mini thumbnail */
          panel.style.transform =
            'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')';
        } else {
          /* micro: translate to slot + scale from expanded size to micro crop */
          var targetW = panelW || firstRaw.width;
          var targetH = panelH || firstRaw.height;
          var sX = targetW / Math.max(firstRaw.width,  1);
          var sY = targetH / Math.max(firstRaw.height, 1);
          panel.style.transform =
            'translate(' + dx + 'px,' + dy + 'px) scale(' + sX + ',' + sY + ')';
        }

        var colHandled = false;

        function doSnap() {
          /* Brief opacity:0 hides the layout snap at animation end */
          widget.style.opacity    = '0';
          widget.style.transition = 'none';
          panel.style.transition  = 'none';
          widget.offsetHeight;

          widget.classList.add('is-mini');
          widget.style.maxHeight  = miniH + 'px';
          widget.style.cursor     = 'pointer';
          /* micro (scale=null): visible so SVG frame glow isn't clipped */
          widget.style.overflow   = scale ? 'hidden' : 'visible';
          widget.style.background = '';         /* restore widget background */
          widget.style.zIndex     = '';         /* restore stacking order */
          applyMiniConstraints();               /* sets correct mini transform */
          updateBtn();
          if (!scale) panel.style.transform = '';  /* micro: clear anim transform */
          panel.offsetHeight;

          widget.style.opacity    = '';
          widget.style.transition = '';
          panel.style.transition  = '';
        }

        function onColEnd(e) {
          if (e.propertyName !== 'transform') return;
          panel.removeEventListener('transitionend', onColEnd);
          colHandled = true;
          doSnap();
        }
        panel.addEventListener('transitionend', onColEnd);
        setTimeout(function () {
          if (!colHandled) {
            panel.removeEventListener('transitionend', onColEnd);
            doSnap();
          }
        }, 800);
      });
    }

    /* ── Event listeners ─────────────────────────────────────────── */
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (widget.classList.contains('is-mini')) expand(); else collapse();
    });

    widget.addEventListener('click', function () {
      if (widget.classList.contains('is-mini')) expand();
    });

    /* Start in mini state — instant, no transition.
       Panels like hud-03/05/06/07 have a scaleX/scaleY opening animation
       running at DOMContentLoaded time. If we let the CSS transition fire
       on the initial collapse(), it interpolates from the animation's
       mid-run scaleX value → produces a visible squish glitch.
       Disabling transitions for the initial snap fixes that. */
    widget.style.transition = 'none';
    panel.style.transition  = 'none';
    collapse(true);                /* instant — no opacity trick, no rAF */
    panel.offsetHeight;            /* force reflow — commits the instant mini state */
    widget.style.transition = '';
    panel.style.transition  = '';
  }

  global.NcHudMini = { init: init };

})(window);
