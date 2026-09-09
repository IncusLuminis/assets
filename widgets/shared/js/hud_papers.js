/**
 * hud_papers.js — Shared publications module for NebulaCast HUD widgets
 *
 * Queries SIMBAD TAP directly from the browser (CORS-open, no API key).
 * Single ADQL query via has_ref join:
 *   ref ← has_ref → ident  (object name → papers with titles)
 *
 * Public API:
 *   HudPapers.load(objectName, opts)
 *     opts.onStatus(text, state)  — 'loading' | 'error'
 *     opts.onData(papers)         — array of { title, year, bibcode, journal }
 *     opts.limit                  — max papers returned (default 10)
 *
 *   HudPapers.render(container, papers)
 *     Inserts .nc-hud-paper-row elements; handles empty case.
 *
 *   HudPapers.invalidate([objectName])
 *     Clear cache for one object (or all).
 *
 * Used by HUD-01, HUD-02, HUD-03, HUD-05.
 */
(function (global) {
  'use strict';

  var SIMBAD_TAP   = 'https://simbad.cds.unistra.fr/simbad/sim-tap/sync';
  var TIMEOUT_MS   = 15000;
  var DEFAULT_LIMIT = 10;

  var _cache     = {};   /* key: lower-cased object name → papers[] */
  var _inFlight  = {};   /* key: lower-cased object name → AbortController */

  /* ── ADQL builder ────────────────────────────────────────────────────── */

  function buildQuery(objectName, limit) {
    /* Escape single quotes for ADQL string literals */
    var safe = objectName.replace(/'/g, "''");
    return (
      'SELECT TOP ' + limit + ' r.title, r."year", r.bibcode, r.journal ' +
      'FROM ref r ' +
      'JOIN has_ref hr ON hr.oidbibref = r.oidbib ' +
      'JOIN ident i ON i.oidref = hr.oidref ' +
      "WHERE i.id = '" + safe + "' " +
      'ORDER BY "year" DESC'
    );
  }

  /* ── fetch helper ────────────────────────────────────────────────────── */

  function tapFetch(adql, signal) {
    var body = 'REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=' +
               encodeURIComponent(adql);
    return fetch(SIMBAD_TAP, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body,
      signal:  signal || undefined
    });
  }

  /* ── load ────────────────────────────────────────────────────────────── */

  function load(objectName, opts) {
    if (!objectName || typeof objectName !== 'string') { return; }
    opts = opts || {};

    var onStatus = typeof opts.onStatus === 'function' ? opts.onStatus : function () {};
    var onData   = typeof opts.onData   === 'function' ? opts.onData   : function () {};
    var limit    = (typeof opts.limit === 'number' && opts.limit > 0)
                   ? Math.min(opts.limit, 20) : DEFAULT_LIMIT;

    var key = objectName.toLowerCase();

    /* Serve from cache */
    if (_cache[key]) {
      onData(_cache[key]);
      return;
    }

    /* Abort any previous in-flight request for this object */
    if (_inFlight[key]) {
      try { _inFlight[key].abort(); } catch (e) { /* ignore */ }
    }

    var ctrl   = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var signal = ctrl ? ctrl.signal : null;
    _inFlight[key] = ctrl;

    var timer = ctrl
      ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS)
      : null;

    onStatus('QUERYING SCIENTIFIC ARCHIVE...', 'loading');

    tapFetch(buildQuery(objectName, limit), signal)
      .then(function (resp) {
        if (timer) { clearTimeout(timer); }
        delete _inFlight[key];
        if (!resp.ok) { throw new Error('HTTP ' + resp.status); }
        return resp.json();
      })
      .then(function (json) {
        var meta = json.metadata || [];
        /* Build column-name → index map for robustness */
        var idx = {};
        meta.forEach(function (col, i) { idx[col.name] = i; });

        var papers = (json.data || []).map(function (row) {
          return {
            title:   (row[idx.title]   || '').replace(/\{\\em ([^}]+)\}/g, '$1').trim(),
            year:    row[idx.year]   || null,
            bibcode: row[idx.bibcode] || '',
            journal: row[idx.journal] || ''
          };
        });

        _cache[key] = papers;
        onData(papers);
      })
      .catch(function (err) {
        if (timer) { clearTimeout(timer); }
        delete _inFlight[key];

        var isTimeout = err && (err.name === 'AbortError');
        onStatus(isTimeout ? 'REQUEST TIMED OUT' : 'ARCHIVE UNAVAILABLE', 'error');
      });
  }

  /* ── render ──────────────────────────────────────────────────────────── */

  /**
   * render(container, papers, opts)
   *   opts.header  — optional header text shown above the list
   */
  function render(container, papers, opts) {
    if (!container) { return; }
    opts = opts || {};
    container.innerHTML = '';

    /* Optional section header */
    if (opts.header) {
      var hdr = document.createElement('div');
      hdr.className   = 'nc-hud-panel-header';
      hdr.textContent = opts.header;
      container.appendChild(hdr);
    }

    if (!papers || papers.length === 0) {
      var wrap = document.createElement('div');
      wrap.className = 'nc-ol-data-status nc-ol-data-status--error';
      var span = document.createElement('span');
      span.textContent = 'NO PUBLICATIONS FOUND';
      wrap.appendChild(span);
      container.appendChild(wrap);
      return;
    }

    papers.forEach(function (paper) {
      var row = document.createElement('div');
      row.className = 'nc-hud-paper-row';

      /* [YEAR] */
      if (paper.year) {
        var yr = document.createElement('span');
        yr.className   = 'nc-hud-paper-year';
        yr.textContent = '[' + paper.year + ']';
        row.appendChild(yr);
      }

      /* Title — <a> when bibcode available, plain span otherwise */
      var titleEl;
      if (paper.bibcode) {
        titleEl          = document.createElement('a');
        titleEl.href     = 'https://ui.adsabs.harvard.edu/abs/' +
                           encodeURIComponent(paper.bibcode) + '/abstract';
        titleEl.target   = '_blank';
        titleEl.rel      = 'noopener noreferrer';
      } else {
        titleEl = document.createElement('span');
      }
      titleEl.className   = 'nc-hud-paper-title';
      titleEl.textContent = paper.title || paper.bibcode || '—';
      row.appendChild(titleEl);

      /* Journal tag */
      if (paper.journal) {
        var jrn = document.createElement('span');
        jrn.className   = 'nc-hud-paper-journal';
        jrn.textContent = paper.journal;
        row.appendChild(jrn);
      }

      container.appendChild(row);
    });
  }

  /* ── invalidate ──────────────────────────────────────────────────────── */

  function invalidate(objectName) {
    if (objectName) {
      delete _cache[objectName.toLowerCase()];
    } else {
      _cache = {};
    }
  }

  /* ── export ──────────────────────────────────────────────────────────── */

  global.HudPapers = { load: load, render: render, invalidate: invalidate };

}(typeof window !== 'undefined' ? window : this));
