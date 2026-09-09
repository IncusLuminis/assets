/* blogger-hud01-template.js — NebulaCast HUD-01 Object Lock Panel
   Blogger release: factory pattern for multi-instance support.

   Usage (once per post, in HTML mode of the Blogger post editor):
   ──────────────────────────────────────────────────────────────
   <script>
   (function () {
     var all    = document.querySelectorAll('.nc-hud-01:not([data-hud-init])');
     var widget = all[all.length - 1];
     if (!widget) return;
     widget.setAttribute('data-hud-init', '1');
     NcHud01.init(widget, {
       objectMode : true,       // false → html mode (blog post text)
       target     : 'NGC 1300', // initial target for Aladin / SIMBAD
       vizierLimit: 10          // max catalog entries (1-20)
     });
   })();
   </script>

   Dependencies (loaded ONCE in the Blogger template <head>):
     blogger-hud01-template.css
     hud-mini.js      → window.NcHudMini
     hud_papers.js    → window.HudPapers

   Config object (cfg):
     objectMode  : boolean  true = object mode (Aladin + SIMBAD); false = html mode
     target      : string   initial astronomical target (default "NGC 1300")
     vizierLimit : number   max VizieR / Papers rows returned (1-20, default 10)
     onExpand    : function optional callback fired after panel expands

   Limitations resolved vs. original hud-01.js (C-07):
     • Factory pattern — NcHud01.init() creates isolated state per widget
     • Shared Aladin CDN load — only one <script> tag injected per page
       (cooperative with NcHud02 via global._ncAladinLoader)
     • Unique Aladin viewer IDs per instance (nc-hud01-aladin-1, -2, …)
     • NcHudMini.init() used for expand/collapse (replaces custom code)
     • All DOM queries scoped to the passed widget element
*/
'use strict';

(function (global) {

  /* ── Shared Aladin CDN loader state (cooperative with NcHud02) ────
     Both NcHud01 and NcHud02 share global._ncAladinLoader so only ONE
     Aladin <script> tag is injected per page regardless of load order. ── */
  var _loader = global._ncAladinLoader;
  if (!_loader) {
    _loader = global._ncAladinLoader = {
      loaded   : false,
      loading  : false,
      callbacks: []
    };
  }

  var ALADIN_JS_URL    = 'https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js';
  var ALADIN_CSS_URL   = 'https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.min.css';
  var ALADIN_LOAD_TIMEOUT_MS = 15000;

  var _instanceCount = 0;

  /* ── Static data ──────────────────────────────────────────────────── */

  var OTYPE_LABELS = {
    'G'   : 'GALAXY',
    'GBar': 'BARRED SPIRAL GALAXY',
    'GbS' : 'BARRED SPIRAL GALAXY',
    'Sy1' : 'SEYFERT 1 GALAXY',
    'Sy2' : 'SEYFERT 2 GALAXY',
    'AGN' : 'ACTIVE GALACTIC NUCLEUS',
    'QSO' : 'QUASAR',
    '*'   : 'STAR',
    '**'  : 'DOUBLE STAR',
    'Cl*' : 'STAR CLUSTER',
    'GlC' : 'GLOBULAR CLUSTER',
    'OpC' : 'OPEN CLUSTER',
    'Neb' : 'NEBULA',
    'SNR' : 'SUPERNOVA REMNANT',
    'PN'  : 'PLANETARY NEBULA',
    'SFR' : 'STAR-FORMING REGION'
  };

  var NGC1300_FALLBACK = [
    ['OBJECT',     'NGC 1300'],
    ['TYPE',       'BARRED SPIRAL GALAXY'],
    ['RA',         '03H 19M 41.1S'],
    ['DEC',        '-19° 24\' 25"'],
    ['REDSHIFT',   '0.005258'],
    ['RADIAL VEL', '1576 KM/S'],
    ['SIZE',       "6.2' \xd7 4.1'"],
    ['MORPH',      'SB(RS)BC'],
    ['MAGNITUDE',  'V ≈ 11.4']
  ];

  var VIZIER_NGC1300_FALLBACK = [
    {
      catid: 'VII/155',
      title: 'Revised New General Catalogue and Index Catalogue',
      desc:  'Morphological, positional, and bibliographic data for 13 226 NGC and 5 386 IC objects',
      year: '2022', author: 'Steinicke W.'
    },
    {
      catid: 'VII/237',
      title: 'HYPERLEDA — Extragalactic Database',
      desc:  'Redshifts, B-magnitudes, diameters, morphology for ~3 million galaxies',
      year: '2014', author: 'Makarov D. et al.'
    },
    {
      catid: 'J/AJ/146/86',
      title: 'S4G — Spitzer Survey of Stellar Structure in Galaxies',
      desc:  '3.6 and 4.5 μm mosaics and photometry for 2352 nearby galaxies; NGC 1300 included',
      year: '2013', author: 'Sheth K. et al.'
    },
    {
      catid: 'J/ApJS/197/21',
      title: 'NIRS0S — Near-IR Atlas of S0–Sa Galaxies',
      desc:  'K-band photometry, ellipse fits, and bar/bulge decompositions for early-type spirals',
      year: '2011', author: 'Laurikainen E. et al.'
    },
    {
      catid: 'J/AJ/143/138',
      title: 'Galaxy Zoo 2 — Detailed Morphological Classifications',
      desc:  'Bar presence, spiral structure, clumpiness from 300 000+ volunteer classifiers',
      year: '2013', author: 'Willett K.W. et al.'
    },
    {
      catid: 'J/ApJS/190/147',
      title: 'SINGG — Survey for Ionization in Neutral Gas Galaxies',
      desc:  'Hα and R-band photometry for HI-selected nearby star-forming galaxies',
      year: '2010', author: 'Meurer G.R. et al.'
    },
    {
      catid: 'J/MNRAS/444/527',
      title: 'Photometric decomposition of barred galaxies',
      desc:  'Bulge, disk, and bar structural parameters from 2D photometric fits',
      year: '2014', author: 'Salo H. et al.'
    },
    {
      catid: 'J/A+A/532/A74',
      title: 'CALIFA — Calar Alto Legacy Integral Field Survey',
      desc:  'Resolved spectroscopy (3745–7300 Å) for 600+ nearby galaxies',
      year: '2011', author: 'Sánchez S.F. et al.'
    }
  ];

  /* ══════════════════════════════════════════════════════════════════
     Shared Aladin CDN loader (cooperative with NcHud02 via _ncAladinLoader)
     Ensures only ONE Aladin <script> tag is injected per page even when
     both NcHud01 and NcHud02 panels appear together.
  ══════════════════════════════════════════════════════════════════ */
  function loadAladinScript(onLoad, onError) {
    if (_loader.loaded) { onLoad(); return; }

    /* Queue callback; first caller starts the actual load */
    _loader.callbacks.push({ onLoad: onLoad, onError: onError });

    if (_loader.loading) return;   /* already in flight — just queued */
    _loader.loading = true;

    /* Aladin CSS — idempotent */
    if (!document.querySelector('link[href*="aladin.min.css"]')) {
      var link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = ALADIN_CSS_URL;
      document.head.appendChild(link);
    }

    var settled = false;
    function settle(ok) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      _loader.loading = false;
      if (ok) {
        _loader.loaded = true;
        _loader.callbacks.forEach(function (cb) { try { cb.onLoad(); } catch (e) {} });
      } else {
        _loader.callbacks.forEach(function (cb) { try { cb.onError(); } catch (e) {} });
      }
      _loader.callbacks = [];
    }

    var timer = setTimeout(function () {
      warn('[NcHud01] Aladin CDN script load timed out after ' + ALADIN_LOAD_TIMEOUT_MS + 'ms');
      settle(false);
    }, ALADIN_LOAD_TIMEOUT_MS);

    var script     = document.createElement('script');
    script.src     = ALADIN_JS_URL;
    script.charset = 'utf-8';
    script.onload  = function () { settle(true); };
    script.onerror = function () {
      warn('[NcHud01] Aladin CDN script failed to load');
      settle(false);
    };
    document.head.appendChild(script);
  }

  /* ══════════════════════════════════════════════════════════════════
     Instance factory
  ══════════════════════════════════════════════════════════════════ */
  function createInstance(widgetEl, cfg) {
    cfg = cfg || {};

    var instanceN = ++_instanceCount;
    var widget    = widgetEl;
    var buttons   = {};   /* keyed by data-action */

    /* ── Instance-level Aladin state ─────────────────────────────── */
    var aladinInstance        = null;
    var aladinReady           = false;
    var aladinBusy            = false;
    var aladinInstancePending = false;
    var aladinInitRetries     = 0;
    var pendingTarget         = null;
    var savedAladinState      = null;

    var NGC1300_RA     = 49.9213;
    var NGC1300_DEC    = -19.4069;
    var DEFAULT_FOV    = 0.5;
    var DEFAULT_SURVEY = 'P/DSS2/color';

    /* Unique DOM id for Aladin viewer div — avoids collision on multi-post pages */
    var aladinViewerId = 'nc-hud01-aladin-' + instanceN;

    /* ── Instance-level SIMBAD state ─────────────────────────────── */
    var SIMBAD_TAP_URL    = 'https://simbad.cds.unistra.fr/simbad/sim-tap/sync';
    var SIMBAD_TIMEOUT_MS = 12000;
    var simbadLoaded  = false;
    var simbadBusy    = false;
    var currentTarget = (typeof cfg.target === 'string' && cfg.target.trim())
                        ? cfg.target.trim() : 'NGC 1300';

    /* ── Instance-level Papers / VizieR state ─────────────────────── */
    var papersLoaded = false;
    var papersBusy   = false;

    var VIZIER_URL        = 'https://vizier.cds.unistra.fr/viz-bin/votable';
    var VIZIER_TIMEOUT_MS = 10000;
    var vizierCache          = {};
    var vizierBusy           = false;
    var vizierAbortCtrl      = null;
    var vizierTargetInFlight = null;
    var vizierLimit = (typeof cfg.vizierLimit === 'number' && cfg.vizierLimit > 0)
                      ? Math.min(cfg.vizierLimit, 20) : 10;

    /* ── Mode ────────────────────────────────────────────────────── */
    var objectMode = (cfg.objectMode !== false);

    /* Group B tabs */
    var INFO_TABS   = ['data', 'papers', 'catalog'];
    var TOGGLE_ATTRS = { reticle: 'data-reticle' };

    /* ── DOM helpers ─────────────────────────────────────────────── */

    function q(sel)  { return widget.querySelector(sel); }
    function qa(sel) { return widget.querySelectorAll(sel); }

    /* ── Init ────────────────────────────────────────────────────── */

    function init() {
      widget.setAttribute('data-mode', objectMode ? 'object' : 'html');
      var slot = q('.nc-hud-01-html-slot');
      if (slot) slot.setAttribute('aria-hidden', objectMode ? 'true' : 'false');

      /* Assign unique id to the Aladin viewer container inside this widget */
      var aladinViewer = q('.nc-hud-01-aladdin > div');
      if (aladinViewer && !aladinViewer.id) aladinViewer.id = aladinViewerId;

      if (objectMode) {
        initObjectMode();
      } else {
        initHtmlMode();
      }
    }

    /* ── Object mode ─────────────────────────────────────────────── */

    function initObjectMode() {
      setDefault('data-target-lock', 'on');
      setDefault('data-reticle',     'on');
      widget.setAttribute('data-aladdin', 'on');
      setDefault('data-info-mode',   'data');

      qa('.nc-ol-tb-btn').forEach(function (btn) {
        var action = btn.getAttribute('data-action');
        if (!action) return;
        buttons[action] = btn;
        syncButton(btn, action);
        btn.addEventListener('click', function () { handleToggle(action, btn); });
      });

      /* Clear width set by opening animation so panel stays fluid */
      var panel = q('.nc-ol-panel');
      if (panel) {
        panel.addEventListener('animationend', function (e) {
          if (e.animationName === 'ncOlOpenHud') panel.style.width = '';
        }, { once: true });
      }

      loadSimbadData(currentTarget);
      initAladin();

      /* Expand/collapse via shared NcHudMini */
      NcHudMini.init({
        widget      : widget,
        panel       : q('.nc-ol-panel'),
        miniH       : 148,
        scale       : 0.352,
        expandedMaxH: 2000,
        onCollapse  : function () {
          /* Pause Aladin while mini so the photo fallback is visible */
          savedAladinState = widget.getAttribute('data-aladdin') || 'off';
          widget.setAttribute('data-aladdin', 'off');
        },
        onExpand    : function () {
          /* Restore Aladin toggle state */
          if (savedAladinState !== null) {
            widget.setAttribute('data-aladdin', savedAladinState);
            savedAladinState = null;
          }
          if (aladinInstancePending) {
            /* CDN loaded while panel was mini — create instance now at scale(1) */
            createAladinInstance();
          } else if (aladinReady && aladinInstance) {
            /* Re-expand after collapse — nudge Aladin to repaint */
            try { global.dispatchEvent(new Event('resize')); } catch (e) {}
          }
          if (typeof cfg.onExpand === 'function') cfg.onExpand();
        }
      });
    }

    /* ── HTML mode ───────────────────────────────────────────────── */

    function initHtmlMode() {
      widget.setAttribute('data-reticle', 'off');
      widget.setAttribute('data-aladdin',  'off');

      var panel = q('.nc-ol-panel');
      if (panel) {
        panel.addEventListener('animationend', function (e) {
          if (e.animationName === 'ncOlOpenHud') panel.style.width = '';
        }, { once: true });
      }

      /* Expand/collapse via shared NcHudMini (same chrome, just content differs) */
      NcHudMini.init({
        widget      : widget,
        panel       : q('.nc-ol-panel'),
        miniH       : 148,
        scale       : 0.352,
        expandedMaxH: 2000,
        onExpand    : function () {
          if (typeof cfg.onExpand === 'function') cfg.onExpand();
        }
      });
    }

    /* ── Toolbar helpers ─────────────────────────────────────────── */

    function setDefault(attr, value) {
      if (!widget.hasAttribute(attr)) widget.setAttribute(attr, value);
    }

    function dataVal(attr) {
      return widget.getAttribute(attr) === 'on';
    }

    function syncButton(btn, action) {
      if (TOGGLE_ATTRS[action]) {
        btn.setAttribute('aria-pressed', String(dataVal(TOGGLE_ATTRS[action])));
      } else if (INFO_TABS.indexOf(action) !== -1) {
        btn.setAttribute('aria-pressed',
          String(widget.getAttribute('data-info-mode') === action));
      }
    }

    function handleToggle(action, btn) {
      if (action === 'reticle') {
        setReticle(btn.getAttribute('aria-pressed') !== 'true');
      } else if (INFO_TABS.indexOf(action) !== -1) {
        setInfoMode(action);
      }
    }

    /* ── Aladin Lite ─────────────────────────────────────────────── */

    function initAladin() {
      if (aladinReady || aladinBusy || aladinInstancePending) return;
      aladinBusy = true;

      loadAladinScript(
        function () {                              /* onLoad */
          if (typeof A === 'undefined' || typeof A.init === 'undefined') {
            warn('window.A not found after script load');
            showAladinFallback('ALADIN LITE UNAVAILABLE');
            aladinBusy = false;
            return;
          }

          /* Panel is mini while CDN was loading — defer instance creation */
          if (widget.classList.contains('is-mini')) {
            aladinInstancePending = true;
            aladinBusy = false;
            return;
          }

          createAladinInstance();
        },
        function () {                              /* onError */
          showAladinFallback('ALADIN LITE UNAVAILABLE');
          aladinBusy = false;
        }
      );
    }

    function createAladinInstance() {
      aladinInstancePending = false;

      /* Size guard — A.aladin() reads getBoundingClientRect() for canvas dimensions.
         A CSS transform(scale) on an ancestor produces a wrong measurement.
         Retry until the panel is at full size (scale=1). */
      var container = document.getElementById(aladinViewerId);
      if (container) {
        var rect      = container.getBoundingClientRect();
        var expectedW = 445, expectedH = 352;
        if (Math.abs(rect.width  - expectedW) > 8 ||
            Math.abs(rect.height - expectedH) > 8) {
          aladinInitRetries++;
          if (aladinInitRetries <= 10) {
            warn('[NcHud01-' + instanceN + '] Aladin container ' +
                 Math.round(rect.width) + '\xd7' + Math.round(rect.height) +
                 ' (expected ' + expectedW + '\xd7' + expectedH +
                 ') — panel still scaled, retry #' + aladinInitRetries);
            aladinInstancePending = true;
            setTimeout(createAladinInstance, 300);
            return;
          }
          warn('[NcHud01-' + instanceN + '] Aladin size check gave up — proceeding');
        }
      }
      aladinInitRetries = 0;

      requestAnimationFrame(function () {
        A.init.then(function () {
          try {
            aladinInstance = A.aladin('#' + aladinViewerId, {
              survey               : DEFAULT_SURVEY,
              fov                  : DEFAULT_FOV,
              target               : currentTarget,
              mode                 : 'dark',
              showReticle          : false,
              showZoomControl      : false,
              showFullscreenControl: false,
              showLayersControl    : false,
              showGotoControl      : false,
              showStatusBar        : false,
              showFrame            : false,
              showCooGrid          : false,
              showProjectionControl: false,
              backgroundColor      : '#000814'
            });

            aladinReady = true;
            aladinBusy  = false;
            markAladinReady();

            if (pendingTarget) {
              var pt = pendingTarget;
              pendingTarget = null;
              applyTarget(pt.target, pt.fov);
            }

          } catch (err) {
            warn('[NcHud01-' + instanceN + '] A.aladin() threw: ' + err);
            showAladinFallback('ALADIN LITE ERROR');
            aladinBusy = false;
          }
        }).catch(function (err) {
          warn('[NcHud01-' + instanceN + '] A.init rejected: ' + err);
          showAladinFallback('ALADIN LITE UNAVAILABLE');
          aladinBusy = false;
        });
      });
    }

    function markAladinReady() {
      var layer = q('.nc-hud-01-aladdin');
      if (layer) layer.classList.add('nc-hud-01-aladdin--ready');
    }

    function showAladinFallback(msg) {
      widget.setAttribute('data-aladdin', 'off');
      var label = q('.nc-hud-01-aladdin__label');
      if (label) label.textContent = msg;
      var sub = q('.nc-hud-01-aladdin__sub');
      if (sub) sub.textContent = '';
    }

    function applyTarget(target, fov) {
      if (!aladinInstance) return;
      try {
        aladinInstance.gotoObject(target);
      } catch (err) {
        warn('gotoObject("' + target + '") failed — falling back to RA/Dec: ' + err);
        try {
          aladinInstance.gotoRaDec(NGC1300_RA, NGC1300_DEC);
        } catch (e2) {
          warn('gotoRaDec fallback also failed: ' + e2);
        }
      }
      if (fov !== undefined && fov !== null) {
        try { aladinInstance.setFoV(fov); } catch (e) { warn('setFoV failed: ' + e); }
      }
    }

    /* ── SIMBAD data fetch ───────────────────────────────────────── */

    function loadSimbadData(target) {
      if (simbadBusy) return;
      simbadBusy   = true;
      simbadLoaded = false;
      currentTarget = target;

      setDataStatus('QUERYING SIMBAD…', 'loading');

      var query = [
        'SELECT b.main_id, b.otype, b.ra, b.dec,',
        '       b.rvz_redshift, b.rvz_radvel, b.nbref,',
        '       b.galdim_majaxis, b.galdim_minaxis, b.morph_type',
        'FROM basic b',
        'JOIN ident i ON i.oidref = b.oid',
        "WHERE i.id = '" + target.replace(/'/g, "''") + "'"
      ].join(' ');

      var url = SIMBAD_TAP_URL +
        '?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=' +
        encodeURIComponent(query);

      var aborted = false;
      var ctrl  = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function () {
        aborted = true;
        if (ctrl) ctrl.abort();
        simbadBusy = false;
        warn('[NcHud01-' + instanceN + '] SIMBAD fetch timed out');
        renderFallback(target);
      }, SIMBAD_TIMEOUT_MS);

      fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (json) {
          if (aborted) return;
          clearTimeout(timer);
          simbadBusy = false;

          if (!json.data || json.data.length === 0) {
            warn('[NcHud01-' + instanceN + '] SIMBAD: no results for "' + target + '"');
            renderFallback(target);
            return;
          }

          var row = {};
          json.metadata.forEach(function (col, i) { row[col.name] = json.data[0][i]; });
          renderSimbadData(row, target);
          simbadLoaded = true;
        })
        .catch(function (err) {
          if (aborted) return;
          clearTimeout(timer);
          simbadBusy = false;
          warn('[NcHud01-' + instanceN + '] SIMBAD fetch failed: ' + err);
          renderFallback(target);
        });
    }

    function renderSimbadData(row, target) {
      var rows = [];
      rows.push(['OBJECT', row.main_id ? String(row.main_id).trim() : target]);
      if (row.otype) {
        var label = OTYPE_LABELS[String(row.otype).trim()] || String(row.otype).trim();
        rows.push(['TYPE', label]);
      }
      if (row.ra  != null) rows.push(['RA',  formatRA(row.ra)]);
      if (row.dec != null) rows.push(['DEC', formatDec(row.dec)]);
      if (row.rvz_redshift != null && row.rvz_redshift !== '')
        rows.push(['REDSHIFT', Number(row.rvz_redshift).toFixed(5)]);
      if (row.rvz_radvel != null && row.rvz_radvel !== '')
        rows.push(['RADIAL VEL', Math.round(Number(row.rvz_radvel)) + ' KM/S']);
      if (row.galdim_majaxis != null && row.galdim_majaxis !== '') {
        var maj = Number(row.galdim_majaxis).toFixed(1);
        var min = (row.galdim_minaxis != null && row.galdim_minaxis !== '')
                  ? Number(row.galdim_minaxis).toFixed(1) : '—';
        rows.push(['SIZE', maj + "' \xd7 " + min + "'"]);
      }
      if (row.morph_type != null && row.morph_type !== '')
        rows.push(['MORPH', String(row.morph_type).trim().toUpperCase()]);
      if (row.nbref != null && row.nbref !== '')
        rows.push(['PAPERS', Number(row.nbref).toLocaleString() + ' REFS']);
      injectDataRows(rows, false);
    }

    function renderFallback(target) {
      if (target === 'NGC 1300' || target === currentTarget) {
        injectDataRows(NGC1300_FALLBACK, true);
      } else {
        setDataStatus('SIMBAD DATA UNAVAILABLE', 'error');
      }
    }

    function injectDataRows(pairs, isFallback) {
      var panel = q('#nc-hud01-data-panel');
      if (!panel) return;
      panel.innerHTML = '';
      pairs.forEach(function (pair) {
        var lbl = document.createElement('div');
        lbl.className   = 'nc-ol-label';
        lbl.textContent = pair[0] + ':';
        var val = document.createElement('div');
        val.className   = 'nc-ol-value';
        val.textContent = pair[1];
        panel.appendChild(lbl);
        panel.appendChild(val);
      });
      if (isFallback) {
        var note = document.createElement('div');
        note.className   = 'nc-ol-data-note';
        note.textContent = '— SIMBAD OFFLINE / CACHED DATA —';
        panel.appendChild(note);
      }
    }

    function setDataStatus(text, state) {
      var panel = q('#nc-hud01-data-panel');
      if (!panel) return;
      panel.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.className = 'nc-ol-data-status nc-ol-data-status--' + (state || 'loading');
      if (state === 'loading') {
        var ring = document.createElement('div');
        ring.className = 'nc-ol-spinner';
        wrap.appendChild(ring);
      }
      var txt = document.createElement('span');
      txt.textContent = text;
      wrap.appendChild(txt);
      panel.appendChild(wrap);
    }

    /* ── Coordinate formatters ───────────────────────────────────── */

    function pad2(n) { return n < 10 ? '0' + n : String(n); }

    function formatRA(deg) {
      if (deg == null) return '—';
      var h  = Math.floor(deg / 15);
      var rm = (deg / 15 - h) * 60;
      var m  = Math.floor(rm);
      var s  = (rm - m) * 60;
      return pad2(h) + 'H ' + pad2(m) + 'M ' + s.toFixed(1) + 'S';
    }

    function formatDec(deg) {
      if (deg == null) return '—';
      var sign = deg < 0 ? '-' : '+';
      var abs  = Math.abs(deg);
      var d    = Math.floor(abs);
      var dm   = (abs - d) * 60;
      var m    = Math.floor(dm);
      var s    = (dm - m) * 60;
      return sign + pad2(d) + '\xb0 ' + pad2(m) + "' " + s.toFixed(1) + '"';
    }

    /* ── VizieR catalog references ───────────────────────────────── */

    function loadVizierReferences(target) {
      if (vizierCache[target]) {
        renderVizierRefs(vizierCache[target].refs, vizierCache[target].fallback);
        return;
      }

      if (vizierBusy && vizierTargetInFlight !== target) {
        if (vizierAbortCtrl) vizierAbortCtrl.abort();
        vizierBusy = false;
      }
      if (vizierBusy) return;

      vizierBusy           = true;
      vizierTargetInFlight = target;

      setPapersStatus('LOADING VIZIER REFERENCES…', 'loading');

      var params = [
        '-c=' + encodeURIComponent(target),
        '-c.rs=2',
        '-out.max=1',
        '-source=',
        '-out.form=mini'
      ].join('&');

      var aborted = false;
      vizierAbortCtrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;

      var timer = setTimeout(function () {
        aborted = true;
        if (vizierAbortCtrl) vizierAbortCtrl.abort();
        vizierBusy = vizierTargetInFlight = vizierAbortCtrl = null;
        warn('[NcHud01-' + instanceN + '] VizieR fetch timed out');
        useVizierFallback(target);
      }, VIZIER_TIMEOUT_MS);

      fetch(VIZIER_URL + '?' + params, {
        signal: vizierAbortCtrl ? vizierAbortCtrl.signal : undefined
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        })
        .then(function (xml) {
          if (aborted) return;
          clearTimeout(timer);
          vizierBusy = vizierTargetInFlight = vizierAbortCtrl = null;

          var refs = parseVizierVOTable(xml);
          if (!refs || refs.length === 0) { useVizierFallback(target); return; }

          vizierCache[target] = { refs: refs, fallback: false };
          renderVizierRefs(refs, false);
        })
        .catch(function (err) {
          if (aborted) return;
          clearTimeout(timer);
          vizierBusy = vizierTargetInFlight = vizierAbortCtrl = null;
          warn('[NcHud01-' + instanceN + '] VizieR fetch failed: ' + err);
          useVizierFallback(target);
        });
    }

    function useVizierFallback(target) {
      if (target === 'NGC 1300' || target === currentTarget) {
        var refs = VIZIER_NGC1300_FALLBACK.slice(0, vizierLimit);
        vizierCache[target] = { refs: refs, fallback: true };
        renderVizierRefs(refs, true);
      } else {
        setPapersStatus('VIZIER REFERENCES UNAVAILABLE', 'error');
      }
    }

    function parseVizierVOTable(xml) {
      var refs = [];
      try {
        var doc = (new DOMParser()).parseFromString(xml, 'application/xml');
        if (doc.querySelector('parsererror')) { warn('VizieR VOTable XML parse error'); return refs; }
        var resources = doc.getElementsByTagName('RESOURCE');
        for (var i = 0; i < resources.length && refs.length < vizierLimit; i++) {
          var res  = resources[i];
          var name = res.getAttribute('name') || '';
          if (!name || name === 'votable' || name === 'results') continue;
          var parts = name.split('/');
          var catid = parts.length > 3 ? parts.slice(0, parts.length - 1).join('/') : name;
          var desc  = '';
          var infoEls = res.getElementsByTagName('INFO');
          for (var j = 0; j < infoEls.length; j++) {
            var infoName = infoEls[j].getAttribute('name') || '';
            if (infoName === 'Description' || infoName === 'description') {
              desc = (infoEls[j].getAttribute('value') || infoEls[j].textContent || '').trim();
              break;
            }
          }
          refs.push({ catid: catid, title: name, desc: desc, year: '', author: '' });
        }
      } catch (e) { warn('VizieR VOTable parse exception: ' + e); }
      return refs;
    }

    /* ── Papers tab (HudPapers shared module) ────────────────────── */

    function loadPapers(target) {
      if (!target) return;
      papersBusy   = true;
      papersLoaded = false;

      HudPapers.load(target, {
        limit   : vizierLimit,
        onStatus: function (text, state) {
          papersBusy = (state === 'loading');
          setPapersInfoStatus(text, state);
        },
        onData  : function (papers) {
          papersBusy   = false;
          papersLoaded = true;
          var panel = q('.nc-ol-info-panel--papers');
          if (!panel) return;
          panel.classList.add('nc-hud-papers-list');
          HudPapers.render(panel, papers, {
            header: 'TOP ' + papers.length + ' PAPERS LINKED TO THE OBJECT'
          });
        }
      });
    }

    function setPapersInfoStatus(text, state) {
      var panel = q('.nc-ol-info-panel--papers');
      if (!panel) return;
      panel.innerHTML = '';
      panel.classList.remove('nc-hud-papers-list');
      appendStatus(panel, text, state);
    }

    function setPapersStatus(text, state) {
      var panel = q('.nc-ol-info-panel--catalog');
      if (!panel) return;
      panel.innerHTML = '';
      panel.classList.remove('nc-ol-papers-list');
      appendStatus(panel, text, state);
    }

    function appendStatus(container, text, state) {
      var wrap = document.createElement('div');
      wrap.className = 'nc-ol-data-status nc-ol-data-status--' + (state || 'loading');
      if (state === 'loading') {
        var ring = document.createElement('div');
        ring.className = 'nc-ol-spinner';
        wrap.appendChild(ring);
      }
      var txt = document.createElement('span');
      txt.textContent = text;
      wrap.appendChild(txt);
      container.appendChild(wrap);
    }

    function renderVizierRefs(refs, isFallback) {
      var panel = q('.nc-ol-info-panel--catalog');
      if (!panel) return;
      panel.innerHTML = '';
      panel.classList.add('nc-ol-papers-list');

      var hdr = document.createElement('div');
      hdr.className   = 'nc-hud-panel-header';
      hdr.textContent = 'TOP ' + refs.length + ' CATALOGS LINKED TO THE OBJECT';
      panel.appendChild(hdr);

      if (isFallback) {
        var note = document.createElement('div');
        note.className   = 'nc-ol-data-note';
        note.textContent = '— VIZIER OFFLINE / DEMO DATA —';
        panel.appendChild(note);
      }

      refs.forEach(function (ref) {
        var card = document.createElement('div');
        card.className = 'nc-ol-paper-card';

        var vizUrl  = 'https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=' +
                      encodeURIComponent(ref.catid);
        var titleEl = document.createElement('a');
        titleEl.className   = 'nc-ol-paper-title';
        titleEl.textContent = ref.title || ref.catid;
        titleEl.href   = ref.url || vizUrl;
        titleEl.target = '_blank';
        titleEl.rel    = 'noopener noreferrer';
        card.appendChild(titleEl);

        var metaParts = [ref.catid];
        if (ref.year)   metaParts.push(ref.year);
        if (ref.author) metaParts.push(ref.author);
        if (metaParts.length) {
          var meta = document.createElement('div');
          meta.className   = 'nc-ol-paper-meta';
          meta.textContent = metaParts.join(' \xb7 ');
          card.appendChild(meta);
        }

        if (ref.desc) {
          var desc = document.createElement('div');
          desc.className   = 'nc-ol-paper-abstract';
          desc.textContent = ref.desc;
          card.appendChild(desc);
        }

        panel.appendChild(card);
      });
    }

    /* ── Public API ──────────────────────────────────────────────── */

    function setTargetLock(enabled) {
      widget.setAttribute('data-target-lock', enabled ? 'on' : 'off');
    }

    function setReticle(enabled) {
      widget.setAttribute('data-reticle', enabled ? 'on' : 'off');
      if (buttons.reticle) buttons.reticle.setAttribute('aria-pressed', String(!!enabled));
    }

    function setAladdin(enabled) {
      widget.setAttribute('data-aladdin', enabled ? 'on' : 'off');
      if (enabled && !aladinReady && !aladinBusy) initAladin();
    }

    function setInfoMode(mode) {
      if (INFO_TABS.indexOf(mode) === -1) { warn('unknown info mode: ' + mode); return; }
      widget.setAttribute('data-info-mode', mode);
      INFO_TABS.forEach(function (m) {
        if (buttons[m]) buttons[m].setAttribute('aria-pressed', String(m === mode));
      });
      if (mode === 'data' && !simbadLoaded && !simbadBusy) {
        loadSimbadData(currentTarget);
      } else if (mode === 'catalog') {
        loadVizierReferences(currentTarget);
      } else if (mode === 'papers' && !papersLoaded && !papersBusy) {
        loadPapers(currentTarget);
      }
    }

    function setAladinTarget(target, fov) {
      if (aladinReady) { applyTarget(target, fov); return; }
      pendingTarget = { target: target, fov: fov };
      if (!aladinBusy) initAladin();
    }

    function setTarget(target) {
      if (!target || typeof target !== 'string') { warn('setTarget: invalid target'); return; }
      currentTarget = target;
      simbadLoaded  = false;
      papersLoaded  = false;
      HudPapers.invalidate(target);

      var mode = widget.getAttribute('data-info-mode') || 'data';
      if (mode === 'data') loadSimbadData(currentTarget);
      else if (mode === 'catalog') loadVizierReferences(currentTarget);
      else if (mode === 'papers') loadPapers(currentTarget);

      if (aladinReady) applyTarget(target);
      else if (!aladinBusy) pendingTarget = { target: target, fov: DEFAULT_FOV };
    }

    function setMode(mode) {
      if (mode !== 'object' && mode !== 'html') {
        warn('setMode: unknown mode "' + mode + '"'); return;
      }
      widget.setAttribute('data-mode', mode);
      var slot = q('.nc-hud-01-html-slot');
      if (mode === 'html') {
        widget.setAttribute('data-reticle', 'off');
        widget.setAttribute('data-aladdin',  'off');
        if (buttons.reticle) buttons.reticle.setAttribute('aria-pressed', 'false');
        if (slot) slot.setAttribute('aria-hidden', 'false');
      } else {
        widget.setAttribute('data-reticle',   'on');
        widget.setAttribute('data-aladdin',   'on');
        widget.setAttribute('data-info-mode', 'data');
        if (buttons.reticle) buttons.reticle.setAttribute('aria-pressed', 'true');
        INFO_TABS.forEach(function (m) {
          if (buttons[m]) buttons[m].setAttribute('aria-pressed', String(m === 'data'));
        });
        if (slot) slot.setAttribute('aria-hidden', 'true');
        if (!simbadLoaded && !simbadBusy) loadSimbadData(currentTarget);
        if (!aladinReady && !aladinBusy) initAladin();
      }
      objectMode = (mode === 'object');
    }

    function getMode() {
      return widget.getAttribute('data-mode') || 'object';
    }

    /* ── Start ───────────────────────────────────────────────────── */
    init();

    /* Return public API for this instance */
    return {
      setTargetLock       : setTargetLock,
      setReticle          : setReticle,
      setAladdin          : setAladdin,
      initAladin          : initAladin,
      setAladinTarget     : setAladinTarget,
      setInfoMode         : setInfoMode,
      loadSimbadData      : loadSimbadData,
      loadVizierReferences: loadVizierReferences,
      loadPapers          : loadPapers,
      setTarget           : setTarget,
      setMode             : setMode,
      getMode             : getMode
    };
  }

  /* ── Shared helper ───────────────────────────────────────────── */
  function warn(msg) {
    if (typeof console !== 'undefined') console.warn(msg);
  }

  /* ══════════════════════════════════════════════════════════════════
     Public namespace
  ══════════════════════════════════════════════════════════════════ */
  global.NcHud01 = {
    /**
     * NcHud01.init(widgetElement, cfg) → instance API
     * Call once per .nc-hud-01 element.
     *
     * cfg = {
     *   objectMode  : boolean  default true
     *   target      : string   default "NGC 1300"
     *   vizierLimit : number   default 10, max 20
     *   onExpand    : function optional, called after expand transition
     * }
     */
    init: function (el, cfg) {
      if (!el) { warn('[NcHud01] init: element not found'); return null; }
      return createInstance(el, cfg);
    }
  };

})(window);
