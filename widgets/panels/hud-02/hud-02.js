/* hud-02.js — Object Report panel
   HUD02-1: toolbar toggles, target-lock mode, progress bar
   HUD02-2: Aladin Lite v3 CDN — lazy init, fallback, public API
   HUD02-3: two-group toolbar, SIMBAD DATA mode, PAPERS/CATALOG tabs
   HUD02-4: object / html mode switch via window.NC_HUD_02_CONFIG
   HUD02-5b: VizieR references in CATALOG tab (no API key required)
   HUD02-6: PAPERS tab — live publications from SIMBAD TAP via HudPapers

   Data attributes on .nc-or-widget (.nc-hud-02):
     data-mode         = "object"|"html"               panel mode
     data-target-lock  = "on" | "off"                  programmatic lock mode
     data-reticle      = "on" | "off"                  toolbar reticle toggle
     data-aladdin      = "on" | "off"                  Aladin layer
     data-info-mode    = "data"|"papers"|"catalog"      active info tab

   Config flag (read once at init, top of index.html):
     window.NC_HUD_02_CONFIG = { objectMode: true, vizierLimit: 8 }

   Object mode defaults: reticle ON, aladin ON (auto-init), info=data
   HTML mode:            reticle OFF, aladin OFF, toolbar hidden, html-slot visible

   Group A toggles (independent): reticle
   Group B tabs (mutually exclusive): data, catalog, papers

   Aladin is initialised automatically on object-mode init.
   On failure data-aladdin is set to "off" so the photo fallback is revealed.

   SIMBAD data is fetched via TAP on init (DATA mode is default, OBJECT mode only).
   Falls back to NGC 1300 mock if the request fails or times out.
*/
'use strict';

(function () {

  var widget  = null;
  var buttons = {};  /* keyed by data-action value */

  /* ── Aladin state ────────────────────────────────────────────────── */

  var aladinInstance        = null;   /* return value of A.aladin() */
  var aladinReady           = false;  /* instance created and healthy */
  var aladinBusy            = false;  /* init Promise in flight */
  var pendingTarget         = null;   /* {target, fov} queued before init */
  var aladinInstancePending = false;  /* CDN loaded but instance deferred (panel was mini) */
  var aladinInitRetries     = 0;      /* retry counter for size-check */

  /* NGC 1300 defaults — used at init and as coordinate fallback */
  var NGC1300_RA     = 49.9213;
  var NGC1300_DEC    = -19.4069;
  var DEFAULT_FOV    = 0.5;            /* degrees */
  var DEFAULT_SURVEY = 'P/DSS2/color';

  var ALADIN_JS_URL  = 'https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js';
  var ALADIN_CSS_URL = 'https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.min.css';
  var aladinScriptLoaded = false;

  /* ── SIMBAD state ────────────────────────────────────────────────── */

  var SIMBAD_TAP_URL    = 'https://simbad.cds.unistra.fr/simbad/sim-tap/sync';
  var SIMBAD_TIMEOUT_MS = 12000;

  var simbadLoaded  = false;  /* data successfully rendered */
  var simbadBusy    = false;  /* fetch in flight */
  var currentTarget = 'NGC 1300';

  /* Fallback data for NGC 1300 shown when SIMBAD is unreachable */
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

  /* Human-readable labels for SIMBAD otype codes (partial list) */
  var OTYPE_LABELS = {
    'G':    'GALAXY',
    'GBar': 'BARRED SPIRAL GALAXY',
    'GbS':  'BARRED SPIRAL GALAXY',
    'Sy1':  'SEYFERT 1 GALAXY',
    'Sy2':  'SEYFERT 2 GALAXY',
    'AGN':  'ACTIVE GALACTIC NUCLEUS',
    'QSO':  'QUASAR',
    '*':    'STAR',
    '**':   'DOUBLE STAR',
    'Cl*':  'STAR CLUSTER',
    'GlC':  'GLOBULAR CLUSTER',
    'OpC':  'OPEN CLUSTER',
    'Neb':  'NEBULA',
    'SNR':  'SUPERNOVA REMNANT',
    'PN':   'PLANETARY NEBULA',
    'SFR':  'STAR-FORMING REGION'
  };

  /* ── PAPERS state (HUD02-6: SIMBAD TAP via HudPapers shared module) ── */

  var papersLoaded = false;   /* successfully rendered at least once */
  var papersBusy   = false;   /* fetch in flight */

  /* ── VizieR references state (HUD02-5b) ──────────────────────────── */

  var VIZIER_URL        = 'https://vizier.cds.unistra.fr/viz-bin/votable';
  var VIZIER_TIMEOUT_MS = 10000;

  var vizierCache          = {};    /* keyed by target string */
  var vizierBusy           = false;
  var vizierAbortCtrl      = null;
  var vizierTargetInFlight = null;
  var vizierLimit          = 10;    /* overridden by cfg.vizierLimit */

  /* Fallback catalog list for NGC 1300 — shown on CORS block / timeout / parse error. */
  var VIZIER_NGC1300_FALLBACK = [
    {
      catid: 'VII/155',
      title: 'Revised New General Catalogue and Index Catalogue',
      desc:  'Morphological, positional, and bibliographic data for 13 226 NGC and 5 386 IC objects',
      year:  '2022', author: 'Steinicke W.'
    },
    {
      catid: 'VII/237',
      title: 'HYPERLEDA — Extragalactic Database',
      desc:  'Redshifts, B-magnitudes, diameters, morphology for ~3 million galaxies',
      year:  '2014', author: 'Makarov D. et al.'
    },
    {
      catid: 'J/AJ/146/86',
      title: 'S4G — Spitzer Survey of Stellar Structure in Galaxies',
      desc:  '3.6 and 4.5 μm mosaics and photometry for 2352 nearby galaxies; NGC 1300 included',
      year:  '2013', author: 'Sheth K. et al.'
    },
    {
      catid: 'J/ApJS/197/21',
      title: 'NIRS0S — Near-IR Atlas of S0–Sa Galaxies',
      desc:  'K-band photometry, ellipse fits, and bar/bulge decompositions for early-type spirals',
      year:  '2011', author: 'Laurikainen E. et al.'
    },
    {
      catid: 'J/AJ/143/138',
      title: 'Galaxy Zoo 2 — Detailed Morphological Classifications',
      desc:  'Bar presence, spiral structure, clumpiness from 300 000+ volunteer classifiers',
      year:  '2013', author: 'Willett K.W. et al.'
    },
    {
      catid: 'J/ApJS/190/147',
      title: 'SINGG — Survey for Ionization in Neutral Gas Galaxies',
      desc:  'Hα and R-band photometry for HI-selected nearby star-forming galaxies',
      year:  '2010', author: 'Meurer G.R. et al.'
    },
    {
      catid: 'J/MNRAS/444/527',
      title: 'Photometric decomposition of barred galaxies',
      desc:  'Bulge, disk, and bar structural parameters from 2D photometric fits',
      year:  '2014', author: 'Salo H. et al.'
    },
    {
      catid: 'J/A+A/532/A74',
      title: 'CALIFA — Calar Alto Legacy Integral Field Survey',
      desc:  'Resolved spectroscopy (3745–7300 Å) for 600+ nearby galaxies',
      year:  '2011', author: 'Sanchez S.F. et al.'
    }
  ];

  /* ── Mode ────────────────────────────────────────────────────────── */

  var cfg        = (typeof window.NC_HUD_02_CONFIG === 'object' && window.NC_HUD_02_CONFIG) || {};
  var objectMode = (cfg.objectMode !== false);   /* default true */
  vizierLimit    = (typeof cfg.vizierLimit === 'number' && cfg.vizierLimit > 0)
                   ? Math.min(cfg.vizierLimit, 20) : 10;

  /* ── Init ────────────────────────────────────────────────────────── */

  function init() {
    widget = document.querySelector('.nc-hud-02');
    if (!widget) widget = document.querySelector('.nc-or-widget'); /* fallback */
    if (!widget) return;

    /* Apply mode from config */
    widget.setAttribute('data-mode', objectMode ? 'object' : 'html');

    /* html-slot aria-hidden mirrors mode */
    var slot = widget.querySelector('.nc-hud-02-html-slot');
    if (slot) slot.setAttribute('aria-hidden', objectMode ? 'true' : 'false');

    if (objectMode) {
      initObjectMode();
    } else {
      initHtmlMode();
    }
  }

  /* ── Object mode init ────────────────────────────────────────────── */

  function initObjectMode() {
    setDefault('data-target-lock', 'on');
    setDefault('data-reticle',     'on');
    widget.setAttribute('data-aladdin', 'on');   /* always on — auto-init below */
    setDefault('data-info-mode',   'data');

    /* Wire toolbar buttons */
    widget.querySelectorAll('.nc-or-tb-btn').forEach(function (btn) {
      var action = btn.getAttribute('data-action');
      if (!action) return;
      buttons[action] = btn;
      syncButton(btn, action);
      btn.addEventListener('click', function () { handleToggle(action, btn); });
    });

    /* Clear animation-frozen width after ncOrOpenHud completes */
    var panel = widget.querySelector('.nc-or-panel');
    if (panel) {
      panel.addEventListener('animationend', function (e) {
        if (e.animationName === 'ncOrOpenHud') panel.style.width = '';
      }, { once: true });
    }

    /* Kick off SIMBAD fetch for default target */
    loadSimbadData(currentTarget);

    /* Auto-init Aladin — photo is the fallback shown on failure */
    initAladin();

    /* Mini/expand toggle */
    initMiniToggle();
  }

  /* ── HTML mode init ──────────────────────────────────────────────── */

  function initHtmlMode() {
    widget.setAttribute('data-reticle', 'off');
    widget.setAttribute('data-aladdin', 'off');

    var panel = widget.querySelector('.nc-or-panel');
    if (panel) {
      panel.addEventListener('animationend', function (e) {
        if (e.animationName === 'ncOrOpenHud') panel.style.width = '';
      }, { once: true });
    }
  }

  /* ── Toolbar helpers ─────────────────────────────────────────────── */

  function setDefault(attr, value) {
    if (!widget.hasAttribute(attr)) widget.setAttribute(attr, value);
  }

  function dataVal(attr) {
    return widget.getAttribute(attr) === 'on';
  }

  var TOGGLE_ATTRS = { reticle: 'data-reticle' };
  var INFO_TABS    = ['data', 'papers', 'catalog'];

  function syncButton(btn, action) {
    if (TOGGLE_ATTRS[action]) {
      btn.setAttribute('aria-pressed', String(dataVal(TOGGLE_ATTRS[action])));
    } else if (INFO_TABS.indexOf(action) !== -1) {
      var active = widget.getAttribute('data-info-mode') === action;
      btn.setAttribute('aria-pressed', String(active));
    }
  }

  function handleToggle(action, btn) {
    if (action === 'reticle') {
      setReticle(btn.getAttribute('aria-pressed') !== 'true');
    } else if (INFO_TABS.indexOf(action) !== -1) {
      setInfoMode(action);
    }
  }

  /* ── Aladin Lite ─────────────────────────────────────────────────── */

  var ALADIN_LOAD_TIMEOUT_MS = 15000;

  function loadAladinScript(onLoad, onError) {
    if (aladinScriptLoaded) { onLoad(); return; }

    if (!document.querySelector('link[href*="aladin.min.css"]')) {
      var link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = ALADIN_CSS_URL;
      document.head.appendChild(link);
    }

    var settled = false;
    function settle(fn) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    }

    var timer = setTimeout(function () {
      settle(function () {
        warn('Aladin CDN script load timed out after ' + ALADIN_LOAD_TIMEOUT_MS + 'ms');
        onError();
      });
    }, ALADIN_LOAD_TIMEOUT_MS);

    var script     = document.createElement('script');
    script.src     = ALADIN_JS_URL;
    script.charset = 'utf-8';
    script.onload  = function () { settle(function () { aladinScriptLoaded = true; onLoad(); }); };
    script.onerror = function () {
      settle(function () {
        warn('Aladin Lite CDN script failed to load: ' + ALADIN_JS_URL);
        onError();
      });
    };
    document.head.appendChild(script);
  }

  function initAladin() {
    if (aladinReady || aladinBusy || aladinInstancePending) return;
    aladinBusy = true;

    loadAladinScript(
      function () {
        if (typeof A === 'undefined' || typeof A.init === 'undefined') {
          warn('window.A not found after script load');
          showAladinFallback('ALADIN LITE UNAVAILABLE');
          aladinBusy = false;
          return;
        }
        /* CDN ready — if panel is mini, defer instance creation */
        if (widget.classList.contains('is-mini')) {
          aladinInstancePending = true;
          aladinBusy = false;
          return;
        }
        createAladinInstance();
      },
      function () {
        showAladinFallback('ALADIN LITE UNAVAILABLE');
        aladinBusy = false;
      }
    );
  }

  function createAladinInstance() {
    aladinInstancePending = false;

    /* Size guard: getBoundingClientRect() is affected by ancestor CSS transforms.
       If the panel is still at scale(0.352), Aladin creates a tiny canvas.
       Retry up to 10 × 300ms if the container isn't at full size yet. */
    var container = document.getElementById('nc-hud-02-aladin-viewer');
    if (container) {
      var rect = container.getBoundingClientRect();
      var expectedW = 445, expectedH = 352;
      if (Math.abs(rect.width - expectedW) > 8 || Math.abs(rect.height - expectedH) > 8) {
        aladinInitRetries++;
        if (aladinInitRetries <= 10) {
          aladinInstancePending = true;
          setTimeout(createAladinInstance, 300);
          return;
        }
      }
    }
    aladinInitRetries = 0;

    requestAnimationFrame(function () {
      A.init.then(function () {
        try {
          aladinInstance = A.aladin('#nc-hud-02-aladin-viewer', {
            survey               : DEFAULT_SURVEY,
            fov                  : DEFAULT_FOV,
            target               : 'NGC 1300',
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
          markReady();
          if (pendingTarget) {
            var pt = pendingTarget;
            pendingTarget = null;
            applyTarget(pt.target, pt.fov);
          }
        } catch (err) {
          warn('A.aladin() threw: ' + err);
          showAladinFallback('ALADIN LITE ERROR');
          aladinBusy = false;
        }
      }).catch(function (err) {
        warn('A.init rejected: ' + err);
        showAladinFallback('ALADIN LITE UNAVAILABLE');
        aladinBusy = false;
      });
    });
  }

  function markReady() {
    var layer = widget.querySelector('.nc-hud-02-aladdin');
    if (layer) layer.classList.add('nc-hud-02-aladdin--ready');
  }

  function showAladinFallback(msg) {
    if (widget) widget.setAttribute('data-aladdin', 'off');
    var label = widget.querySelector('.nc-hud-02-aladdin__label');
    if (label) label.textContent = msg;
    var sub = widget.querySelector('.nc-hud-02-aladdin__sub');
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

  /* ── SIMBAD data fetch ───────────────────────────────────────────── */

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
      'WHERE i.id = \'' + target.replace(/'/g, "''") + '\''
    ].join(' ');

    var url = SIMBAD_TAP_URL +
      '?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=' +
      encodeURIComponent(query);

    var aborted = false;
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () {
      aborted = true;
      if (ctrl) ctrl.abort();
      simbadBusy = false;
      warn('SIMBAD fetch timed out after ' + SIMBAD_TIMEOUT_MS + 'ms');
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
          warn('SIMBAD: no results for "' + target + '"');
          renderFallback(target);
          return;
        }

        var row = {};
        json.metadata.forEach(function (col, i) {
          row[col.name] = json.data[0][i];
        });

        renderSimbadData(row, target);
        simbadLoaded = true;
      })
      .catch(function (err) {
        if (aborted) return;
        clearTimeout(timer);
        simbadBusy = false;
        warn('SIMBAD fetch failed: ' + err);
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

    if (row.rvz_redshift != null && row.rvz_redshift !== '') {
      rows.push(['REDSHIFT', Number(row.rvz_redshift).toFixed(5)]);
    }

    if (row.rvz_radvel != null && row.rvz_radvel !== '') {
      rows.push(['RADIAL VEL', Math.round(Number(row.rvz_radvel)) + ' KM/S']);
    }

    if (row.galdim_majaxis != null && row.galdim_majaxis !== '') {
      var maj = Number(row.galdim_majaxis).toFixed(1);
      var min = (row.galdim_minaxis != null && row.galdim_minaxis !== '')
                ? Number(row.galdim_minaxis).toFixed(1) : '—';
      rows.push(['SIZE', maj + "' \xd7 " + min + "'"]);
    }

    if (row.morph_type != null && row.morph_type !== '') {
      rows.push(['MORPH', String(row.morph_type).trim().toUpperCase()]);
    }

    if (row.nbref != null && row.nbref !== '') {
      rows.push(['PAPERS', Number(row.nbref).toLocaleString() + ' REFS']);
    }

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
    var panel = widget.querySelector('#nc-hud02-data-panel');
    if (!panel) return;

    panel.innerHTML = '';

    pairs.forEach(function (pair) {
      var lbl = document.createElement('div');
      lbl.className   = 'nc-or-label';
      lbl.textContent = pair[0] + ':';

      var val = document.createElement('div');
      val.className   = 'nc-or-value';
      val.textContent = pair[1];

      panel.appendChild(lbl);
      panel.appendChild(val);
    });

    if (isFallback) {
      var note = document.createElement('div');
      note.className   = 'nc-or-data-note';
      note.textContent = '— SIMBAD OFFLINE / CACHED DATA —';
      panel.appendChild(note);
    }
  }

  function setDataStatus(text, state) {
    var panel = widget.querySelector('#nc-hud02-data-panel');
    if (!panel) return;
    panel.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.className = 'nc-or-data-status nc-or-data-status--' + (state || 'loading');

    if (state === 'loading') {
      var ring = document.createElement('div');
      ring.className = 'nc-or-spinner';
      wrap.appendChild(ring);
    }

    var txt = document.createElement('span');
    txt.textContent = text;
    wrap.appendChild(txt);

    panel.appendChild(wrap);
  }

  /* ── Coordinate formatters ───────────────────────────────────────── */

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
    return sign + pad2(d) + '° ' + pad2(m) + "' " + s.toFixed(1) + '"';
  }

  /* ── VizieR references fetch (HUD02-5b) ──────────────────────────── */

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

    setCatalogStatus('LOADING VIZIER REFERENCES…', 'loading');

    var params = [
      '-c=' + encodeURIComponent(target),
      '-c.rs=2',
      '-out.max=1',
      '-source=',
      '-out.form=mini'
    ].join('&');

    var url = VIZIER_URL + '?' + params;

    var aborted = false;
    vizierAbortCtrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;

    var timer = setTimeout(function () {
      aborted = true;
      if (vizierAbortCtrl) vizierAbortCtrl.abort();
      vizierBusy           = false;
      vizierTargetInFlight = null;
      vizierAbortCtrl      = null;
      warn('VizieR fetch timed out after ' + VIZIER_TIMEOUT_MS + 'ms');
      useFallback(target);
    }, VIZIER_TIMEOUT_MS);

    fetch(url, {
      signal: vizierAbortCtrl ? vizierAbortCtrl.signal : undefined
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (xml) {
        if (aborted) return;
        clearTimeout(timer);
        vizierBusy           = false;
        vizierTargetInFlight = null;
        vizierAbortCtrl      = null;

        var refs = parseVizierVOTable(xml);
        if (!refs || refs.length === 0) {
          useFallback(target);
          return;
        }

        vizierCache[target] = { refs: refs, fallback: false };
        renderVizierRefs(refs, false);
      })
      .catch(function (err) {
        if (aborted) return;
        clearTimeout(timer);
        vizierBusy           = false;
        vizierTargetInFlight = null;
        vizierAbortCtrl      = null;
        warn('VizieR fetch failed: ' + err);
        useFallback(target);
      });
  }

  function useFallback(target) {
    if (target === 'NGC 1300' || target === currentTarget) {
      var refs = VIZIER_NGC1300_FALLBACK.slice(0, vizierLimit);
      vizierCache[target] = { refs: refs, fallback: true };
      renderVizierRefs(refs, true);
    } else {
      setCatalogStatus('VIZIER REFERENCES UNAVAILABLE', 'error');
    }
  }

  function parseVizierVOTable(xml) {
    var refs = [];
    try {
      var doc = (new DOMParser()).parseFromString(xml, 'application/xml');

      if (doc.querySelector('parsererror')) {
        warn('VizieR VOTable XML parse error');
        return refs;
      }

      var resources = doc.getElementsByTagName('RESOURCE');
      for (var i = 0; i < resources.length && refs.length < vizierLimit; i++) {
        var res  = resources[i];
        var name = res.getAttribute('name') || '';

        if (!name || name === 'votable' || name === 'results') continue;

        var parts = name.split('/');
        var catid = parts.length > 3
          ? parts.slice(0, parts.length - 1).join('/')
          : name;

        var desc = '';
        var infoEls = res.getElementsByTagName('INFO');
        for (var j = 0; j < infoEls.length; j++) {
          var infoName = infoEls[j].getAttribute('name') || '';
          if (infoName === 'Description' || infoName === 'description') {
            desc = (infoEls[j].getAttribute('value') || infoEls[j].textContent || '').trim();
            break;
          }
        }

        refs.push({
          catid: catid,
          title: name,
          desc:  desc,
          year:  '',
          author: ''
        });
      }
    } catch (e) {
      warn('VizieR VOTable parse exception: ' + e);
    }
    return refs;
  }

  /* ── PAPERS tab (HUD02-6) ───────────────────────────────────────────── */

  function loadPapers(target) {
    if (!widget) { return; }
    if (!target)  { return; }

    papersBusy   = true;
    papersLoaded = false;

    HudPapers.load(target, {
      limit: vizierLimit,
      onStatus: function (text, state) {
        papersBusy = (state === 'loading');
        setPapersInfoStatus(text, state);
      },
      onData: function (papers) {
        papersBusy   = false;
        papersLoaded = true;
        var panel = widget.querySelector('.nc-or-info-panel--papers');
        if (!panel) { return; }
        panel.classList.add('nc-hud-papers-list');
        HudPapers.render(panel, papers, {
          header: 'TOP ' + papers.length + ' PAPERS LINKED TO THE OBJECT'
        });
      }
    });
  }

  /* Status message inside the PAPERS panel */
  function setPapersInfoStatus(text, state) {
    var panel = widget.querySelector('.nc-or-info-panel--papers');
    if (!panel) { return; }
    panel.innerHTML = '';
    panel.classList.remove('nc-hud-papers-list');

    var wrap = document.createElement('div');
    wrap.className = 'nc-or-data-status nc-or-data-status--' + (state || 'loading');
    if (state === 'loading') {
      var ring = document.createElement('div');
      ring.className = 'nc-or-spinner';
      wrap.appendChild(ring);
    }
    var txt = document.createElement('span');
    txt.textContent = text;
    wrap.appendChild(txt);
    panel.appendChild(wrap);
  }

  /* Status message inside the CATALOG panel */
  function setCatalogStatus(text, state) {
    var panel = widget.querySelector('.nc-or-info-panel--catalog');
    if (!panel) return;
    panel.innerHTML = '';
    panel.classList.remove('nc-or-papers-list');

    var wrap = document.createElement('div');
    wrap.className = 'nc-or-data-status nc-or-data-status--' + (state || 'loading');

    if (state === 'loading') {
      var ring = document.createElement('div');
      ring.className = 'nc-or-spinner';
      wrap.appendChild(ring);
    }

    var txt = document.createElement('span');
    txt.textContent = text;
    wrap.appendChild(txt);

    panel.appendChild(wrap);
  }

  /* Render VizieR catalog reference cards into the CATALOG panel */
  function renderVizierRefs(refs, isFallback) {
    var panel = widget.querySelector('.nc-or-info-panel--catalog');
    if (!panel) return;
    panel.innerHTML = '';
    panel.classList.add('nc-or-papers-list');

    /* Section header */
    var hdr = document.createElement('div');
    hdr.className   = 'nc-hud-panel-header';
    hdr.textContent = 'TOP ' + refs.length + ' CATALOGS LINKED TO THE OBJECT';
    panel.appendChild(hdr);

    if (isFallback) {
      var note = document.createElement('div');
      note.className   = 'nc-or-data-note';
      note.textContent = '— VIZIER OFFLINE / DEMO DATA —';
      panel.appendChild(note);
    }

    refs.forEach(function (ref) {
      var card = document.createElement('div');
      card.className = 'nc-or-paper-card';

      var vizUrl = 'https://vizier.cds.unistra.fr/viz-bin/VizieR?-source='
                   + encodeURIComponent(ref.catid);
      var titleEl = document.createElement('a');
      titleEl.className   = 'nc-or-paper-title';
      titleEl.textContent = ref.title || ref.catid;
      titleEl.href   = ref.url || vizUrl;
      titleEl.target = '_blank';
      titleEl.rel    = 'noopener noreferrer';
      card.appendChild(titleEl);

      var metaParts = [ref.catid];
      if (ref.year)   metaParts.push(ref.year);
      if (ref.author) metaParts.push(ref.author);
      if (metaParts.length > 0) {
        var meta = document.createElement('div');
        meta.className   = 'nc-or-paper-meta';
        meta.textContent = metaParts.join(' · ');
        card.appendChild(meta);
      }

      if (ref.desc) {
        var desc = document.createElement('div');
        desc.className   = 'nc-or-paper-abstract';
        desc.textContent = ref.desc;
        card.appendChild(desc);
      }

      panel.appendChild(card);
    });
  }

  /* ── Public API ──────────────────────────────────────────────────── */

  function setTargetLock(enabled) {
    if (!widget) { warn('widget not ready'); return; }
    widget.setAttribute('data-target-lock', enabled ? 'on' : 'off');
  }

  function setReticle(enabled) {
    if (!widget) { warn('widget not ready'); return; }
    widget.setAttribute('data-reticle', enabled ? 'on' : 'off');
    if (buttons.reticle) buttons.reticle.setAttribute('aria-pressed', String(enabled));
  }

  function setAladdin(enabled) {
    if (!widget) { warn('widget not ready'); return; }
    widget.setAttribute('data-aladdin', enabled ? 'on' : 'off');
    if (enabled && !aladinReady && !aladinBusy) {
      initAladin();
    }
  }

  function setInfoMode(mode) {
    if (!widget) { warn('widget not ready'); return; }
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
    if (!widget) { warn('widget not ready'); return; }

    if (aladinReady) {
      applyTarget(target, fov);
      return;
    }

    pendingTarget = { target: target, fov: fov };

    if (!aladinBusy) initAladin();
  }

  function setTarget(target) {
    if (!widget) { warn('widget not ready'); return; }
    if (!target || typeof target !== 'string') { warn('setTarget: invalid target'); return; }

    currentTarget = target;
    simbadLoaded  = false;
    papersLoaded  = false;
    HudPapers.invalidate(target);

    var mode = widget.getAttribute('data-info-mode') || 'data';
    if (mode === 'data') {
      loadSimbadData(currentTarget);
    } else if (mode === 'catalog') {
      loadVizierReferences(currentTarget);
    } else if (mode === 'papers') {
      loadPapers(currentTarget);
    }

    if (aladinReady) {
      applyTarget(target);
    } else if (!aladinBusy) {
      pendingTarget = { target: target, fov: DEFAULT_FOV };
    }
  }

  function setMode(mode) {
    if (!widget) { warn('widget not ready'); return; }
    if (mode !== 'object' && mode !== 'html') {
      warn('setMode: unknown mode "' + mode + '"');
      return;
    }

    widget.setAttribute('data-mode', mode);

    var slot = widget.querySelector('.nc-hud-02-html-slot');

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

      if (!simbadLoaded && !simbadBusy) {
        loadSimbadData(currentTarget);
      }
      if (!aladinReady && !aladinBusy) {
        initAladin();
      }
    }

    objectMode = (mode === 'object');
  }

  function getMode() {
    if (!widget) return null;
    return widget.getAttribute('data-mode') || 'object';
  }

  function warn(msg) {
    if (typeof console !== 'undefined') console.warn('[NcHud02]', msg);
  }

  /* ── Mini/expand toggle ──────────────────────────────────────────── */

  function initMiniToggle() {
    var panel = widget.querySelector('.nc-or-panel');
    if (!panel) return;

    var savedAladinState = null;

    NcHudMini.init({
      widget : widget,
      panel  : panel,
      miniH  : 148,
      scale  : 0.352,
      onCollapse: function () {
        savedAladinState = widget.getAttribute('data-aladdin') || 'off';
        widget.setAttribute('data-aladdin', 'off');
      },
      onExpand: function () {
        if (savedAladinState !== null) {
          widget.setAttribute('data-aladdin', savedAladinState);
          savedAladinState = null;
        }
        if (aladinInstancePending) {
          createAladinInstance();
        } else if (aladinReady && aladinInstance) {
          try { window.dispatchEvent(new Event('resize')); } catch (e) {}
        }
      }
    });
  }

  /* Expose API */
  window.NcHud02 = {
    setTargetLock        : setTargetLock,
    setReticle           : setReticle,
    setAladdin           : setAladdin,
    initAladin           : initAladin,
    setAladinTarget      : setAladinTarget,
    setInfoMode          : setInfoMode,
    loadSimbadData       : loadSimbadData,
    loadVizierReferences : loadVizierReferences,
    loadPapers           : loadPapers,
    setTarget            : setTarget,
    setMode              : setMode,
    getMode              : getMode
  };

  /* ── Boot ────────────────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
