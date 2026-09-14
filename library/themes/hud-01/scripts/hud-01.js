// hud-01/scripts/hud-01.js -- Theme entry script for maxi:landscape.
// Evaluated by SvgRenderer as `new Function("root", "context", "hud", <this
// file's text>)` (Contract §16.4, §17.1) -- `root` is this composition's
// mounted element, `hud` is the Theme-internal lazy-resource API
// (`hud.loadExternalResource(name)`, Contract §10.4/§16.2-§16.3).
//
// Migrated (trimmed -- see README.md "Behavioural differences") from
// widgets/sandbox/blogger-hud01-02-wip/blogger-hud01-template.js's
// `createInstance()` factory. The blogger lineage's multi-instance
// bookkeeping (`_ncAladinLoader` page global, unique-id counters) is
// replaced here by SvgRenderer's own per-instance `#runThemeScript` call
// (fresh closure per mount) and `DomExternalResourceLoader`'s page-scoped
// `kind:host` de-duplication (Story #9) -- so this script itself carries no
// cross-instance state; `capabilities.multiInstance: true` still holds
// because every DOM query below is scoped to `root`, matching Contract
// §16.5's requirement for a Theme claiming multi-instance support.
"use strict";

// `new Function("root", "context", "hud", <this file's text>)` treats this
// whole file as ONE function body (SvgRenderer#runThemeScript) -- the IIFE
// below is purely for local `var`/`function` scoping, so its own returned
// handle object must itself be returned from the OUTER function via this
// `return`, or the factory would resolve to `undefined` and the renderer
// would treat this composition as having no teardown handle at all.
return (function () {
  var OTYPE_LABELS = {
    "G": "GALAXY", "GBar": "BARRED SPIRAL GALAXY", "GbS": "BARRED SPIRAL GALAXY",
    "Sy1": "SEYFERT 1 GALAXY", "Sy2": "SEYFERT 2 GALAXY", "AGN": "ACTIVE GALACTIC NUCLEUS",
    "QSO": "QUASAR", "*": "STAR", "**": "DOUBLE STAR", "Cl*": "STAR CLUSTER",
    "GlC": "GLOBULAR CLUSTER", "OpC": "OPEN CLUSTER", "Neb": "NEBULA",
    "SNR": "SUPERNOVA REMNANT", "PN": "PLANETARY NEBULA", "SFR": "STAR-FORMING REGION"
  };

  // Contract §10.6 "MUST still render (empty/placeholder state) ... if the
  // providers are unreachable [Inv §1.8 NGC 1300 fallback]" -- ported
  // verbatim from the real baseline's own designed safety net.
  var NGC1300_FALLBACK = [
    ["OBJECT", "NGC 1300"], ["TYPE", "BARRED SPIRAL GALAXY"],
    ["RA", "03H 19M 41.1S"], ["DEC", "-19° 24' 25\""],
    ["REDSHIFT", "0.005258"], ["RADIAL VEL", "1576 KM/S"],
    ["SIZE", "6.2' × 4.1'"], ["MORPH", "SB(RS)BC"], ["MAGNITUDE", "V ≈ 11.4"]
  ];

  var VIZIER_NGC1300_FALLBACK = [
    { catid: "VII/155", title: "Revised New General Catalogue and Index Catalogue", desc: "Morphological, positional, and bibliographic data for 13 226 NGC and 5 386 IC objects", year: "2022", author: "Steinicke W." },
    { catid: "VII/237", title: "HYPERLEDA — Extragalactic Database", desc: "Redshifts, B-magnitudes, diameters, morphology for ~3 million galaxies", year: "2014", author: "Makarov D. et al." },
    { catid: "J/AJ/146/86", title: "S4G — Spitzer Survey of Stellar Structure in Galaxies", desc: "3.6 and 4.5 μm mosaics and photometry for 2352 nearby galaxies; NGC 1300 included", year: "2013", author: "Sheth K. et al." }
  ];

  var SIMBAD_TAP_URL = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
  var VIZIER_URL = "https://vizier.cds.unistra.fr/viz-bin/votable";
  var FETCH_TIMEOUT_MS = 12000;
  var DEFAULT_TARGET = "NGC 1300";
  var INFO_TABS = ["data", "papers", "catalog"];
  var vizierLimit = 10;

  var buttons = {};
  var listeners = []; // { el, type, fn } -- removed on destroy() (Contract §17.1)
  var timers = [];    // setTimeout ids -- cleared on destroy()
  var controllers = []; // AbortController instances -- aborted on destroy()

  var currentTarget = DEFAULT_TARGET;
  // `simbadPendingTarget`/`papersPendingTarget`: Story #36 fix -- see
  // loadSimbadData()/loadPapers() below ("queue-behind" race fix).
  // `simbadInFlightTarget`/`papersInFlightTarget`: the target the CURRENT
  // in-flight fetch was actually started for (not the latest-requested
  // target). Needed to tell an A->B->A reversion (the pending target
  // reverts to the one already in flight -- nothing new to fetch) apart
  // from a genuine A->B->C supersession (Story #36 follow-up fix).
  // `simbadRequestedTarget`/`papersRequestedTarget`: Story #36 second
  // follow-up fix -- each panel's OWN independently-tracked "last target
  // the consumer actually requested", used for THAT panel's staleness
  // checks instead of the shared `currentTarget`. Both are written
  // together, unconditionally, by every accepted setData({objectName})
  // call below regardless of which tab is active -- so a target requested
  // while (say) the PAPERS tab is active is never invisible to the DATA
  // panel's own bookkeeping, and vice versa. `currentTarget` itself is no
  // longer written by loadSimbadData/loadPapers (only by setData/mount's
  // initial call) -- it was loadSimbadData writing it on every fetch IT
  // started (including drain-fired ones, for a target the DATA panel
  // cared about) that let a same-tick DATA-panel drain silently revert
  // `currentTarget` out from under an in-flight PAPERS fetch for a
  // DIFFERENT, newer target, making that PAPERS fetch's own genuinely
  // current response look "stale" and get dropped when it resolved.
  // `currentTarget` remains the widget's single "what am I conceptually
  // showing" value (title/Aladin/initial-tab-switch reads), but no fetch
  // pipeline's correctness depends on it any more.
  var simbadLoaded = false, simbadBusy = false, simbadPendingTarget = null, simbadInFlightTarget = null, simbadRequestedTarget = DEFAULT_TARGET;
  var vizierCache = {}, vizierBusy = false;
  var papersLoaded = false, papersBusy = false, papersPendingTarget = null, papersInFlightTarget = null, papersRequestedTarget = DEFAULT_TARGET;

  var aladinReady = false, aladinBusy = false, aladinInstance = null;
  var aladinViewerId = "nc-hud01-aladin-" + Math.random().toString(36).slice(2, 10);

  // Story #36 follow-up fix: set true by destroy() so a drain call
  // scheduled by an in-flight fetch that settles AFTER destroy() (aborting
  // its controller does not stop its own .then()/.catch() from running)
  // is a guaranteed no-op instead of starting a brand-new, untracked fetch
  // from a torn-down instance (Contract §17.1).
  var destroyed = false;

  function q(sel) { return root.querySelector(sel); }
  function qa(sel) { return root.querySelectorAll(sel); }
  function on(el, type, fn) { if (!el) return; el.addEventListener(type, fn); listeners.push({ el: el, type: type, fn: fn }); }
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function warn(msg) { if (typeof console !== "undefined") console.warn("[hud-01] " + msg); }

  // ── Toolbar ──────────────────────────────────────────────────────────

  function setReticle(enabled) {
    root.setAttribute("data-reticle", enabled ? "on" : "off");
    if (buttons.reticle) buttons.reticle.setAttribute("aria-pressed", String(!!enabled));
  }

  function setInfoMode(mode) {
    if (INFO_TABS.indexOf(mode) === -1) return;
    var widget = root;
    widget.setAttribute("data-info-mode", mode);
    INFO_TABS.forEach(function (m) {
      if (buttons[m]) buttons[m].setAttribute("aria-pressed", String(m === mode));
    });
    if (mode === "data" && !simbadLoaded && !simbadBusy) loadSimbadData(currentTarget);
    else if (mode === "catalog") loadVizierReferences(currentTarget);
    else if (mode === "papers" && !papersLoaded && !papersBusy) loadPapers(currentTarget);
  }

  function wireToolbar() {
    qa(".nc-ol-tb-btn").forEach(function (btn) {
      var action = btn.getAttribute("data-action");
      if (!action) return;
      buttons[action] = btn;
      on(btn, "click", function () {
        if (action === "reticle") setReticle(btn.getAttribute("aria-pressed") !== "true");
        else setInfoMode(action);
      });
    });
  }

  // ── Aladin Lite (skyViewer capability, lazy via hud.loadExternalResource) ──

  function initAladin() {
    if (aladinReady || aladinBusy) return;
    aladinBusy = true;
    hud.loadExternalResource("skyViewer").then(
      function () {
        aladinBusy = false;
        var A = typeof window !== "undefined" ? window.A : undefined;
        if (!A || typeof A.init === "undefined") {
          // Real degrade-graceful behaviour (Inv "If the CDN fails, the
          // placeholder ALADIN LAYER STANDBY remains visible"): this is the
          // expected path in every test in this repo, since no test ever
          // injects a real Aladin global -- see README "Aladin / SIMBAD /
          // VizieR / ADS in tests".
          return;
        }
        createAladinInstance(A);
      },
      function () {
        aladinBusy = false;
        showAladinFallback("ALADIN LITE UNAVAILABLE");
      }
    );
  }

  function createAladinInstance(A) {
    try {
      A.init.then(function () {
        aladinInstance = A.aladin("#" + aladinViewerId, {
          survey: "P/DSS2/color", fov: 0.5, target: currentTarget, mode: "dark",
          showReticle: false, showZoomControl: false, showFullscreenControl: false,
          showLayersControl: false, showGotoControl: false, showStatusBar: false,
          showFrame: false, showCooGrid: false, showProjectionControl: false,
          backgroundColor: "#000814"
        });
        aladinReady = true;
        var layer = q(".nc-hud-01-aladdin");
        if (layer) layer.classList.add("nc-hud-01-aladdin--ready");
      }, function () {
        showAladinFallback("ALADIN LITE UNAVAILABLE");
      });
    } catch (err) {
      warn("A.aladin() threw: " + err);
      showAladinFallback("ALADIN LITE ERROR");
    }
  }

  // Story #36 fix (Aladin fallback hidden): failure states use a distinct
  // "error" value, NOT "off". `[data-aladdin="off"] .nc-hud-01-aladdin` is
  // a `display:none` rule in hud.css that hides the WHOLE container --
  // including `.nc-hud-01-aladdin__placeholder`/`__label`, the very element
  // this function is about to write the fallback message into. Reusing
  // "off" for an error made the message unconditionally invisible on every
  // failure path. Nothing in this Theme sets "off" any more (reserved for
  // a future explicit hide, should one ever be added) -- hud.css has no
  // `[data-aladdin="error"]` display rule, so the placeholder (and the
  // message written into it) stays visible, which is exactly what an error
  // state needs.
  function showAladinFallback(msg) {
    var widget = root;
    widget.setAttribute("data-aladdin", "error");
    var label = q(".nc-hud-01-aladdin__label");
    if (label) label.textContent = msg;
  }

  // ── SIMBAD (DATA tab) ────────────────────────────────────────────────

  // Story #36 fix (SIMBAD data race): loadSimbadData stays single-flight
  // (the `simbadBusy` guard is kept -- exactly one SIMBAD fetch in flight
  // at a time, so two overlapping requests never both render into the
  // shared DATA panel), but a call that arrives while a fetch is already
  // in flight for a *different* target no longer silently no-ops. It
  // queues its target in `simbadPendingTarget` (overwriting any earlier
  // queued target, so only the LAST-requested target is ever retained),
  // and once the in-flight fetch settles it is drained via
  // drainSimbadQueue(). The in-flight fetch's own resolution also checks
  // `target !== simbadRequestedTarget` before rendering -- if a newer
  // request superseded it while it was in flight, its response is
  // discarded, not painted over the newer target's (already-queued) data.
  // `simbadRequestedTarget` (NOT the shared `currentTarget` -- see the
  // state-var block above for why) is what this staleness check compares
  // against. This is the "queue-behind" choice (vs. cancel-in-flight/
  // AbortController): the stale network call is still allowed to
  // complete, its result is just never rendered, and the queued target's
  // own fetch starts right after.
  function loadSimbadData(target) {
    if (simbadBusy) {
      // A->B->A reversion: if the newly-requested target is the SAME one
      // already in flight, there is nothing new to fetch -- clear any
      // queued target instead of leaving a stale one that would otherwise
      // fire a redundant, UI-clobbering re-fetch once the in-flight
      // request (for this same target) resolves and renders correctly.
      simbadPendingTarget = (target === simbadInFlightTarget) ? null : target;
      return;
    }
    simbadPendingTarget = null;
    simbadBusy = true; simbadLoaded = false; simbadInFlightTarget = target;
    setDataStatus("QUERYING SIMBAD…", "loading");

    var query = [
      "SELECT b.main_id, b.otype, b.ra, b.dec,",
      "       b.rvz_redshift, b.rvz_radvel, b.nbref,",
      "       b.galdim_majaxis, b.galdim_minaxis, b.morph_type",
      "FROM basic b JOIN ident i ON i.oidref = b.oid",
      "WHERE i.id = '" + target.replace(/'/g, "''") + "'"
    ].join(" ");
    var url = SIMBAD_TAP_URL + "?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=" + encodeURIComponent(query);

    hud.loadExternalResource("simbad").then(function () { return simbadFetch(url); }, function () { return simbadFetch(url); })
      .then(function (json) {
        simbadBusy = false;
        // Discard a response for a target that's no longer current -- a
        // newer setData({objectName}) call superseded it while this fetch
        // was in flight (queued above; drained below either way).
        if (target !== simbadRequestedTarget) { drainSimbadQueue(); return; }
        if (!json || !json.data || json.data.length === 0) { renderFallback(); drainSimbadQueue(); return; }
        var row = {};
        json.metadata.forEach(function (col, i) { row[col.name] = json.data[0][i]; });
        renderSimbadData(row, target);
        simbadLoaded = true;
        drainSimbadQueue();
      })
      .catch(function () {
        simbadBusy = false;
        if (target === simbadRequestedTarget) renderFallback();
        drainSimbadQueue();
      });
  }

  function drainSimbadQueue() {
    // Story #36 follow-up fix: an in-flight fetch's .then()/.catch() can
    // still run after destroy() (abort() rejects the fetch, it does not
    // silence its own continuation) -- guard here too, on top of destroy()
    // clearing simbadPendingTarget itself, so a scheduled drain can never
    // start a new, untracked fetch from a torn-down instance.
    if (destroyed) return;
    if (simbadPendingTarget === null) return;
    var next = simbadPendingTarget;
    simbadPendingTarget = null;
    loadSimbadData(next);
  }

  function simbadFetch(url) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (ctrl) controllers.push(ctrl);
    var timer = later(function () { if (ctrl) ctrl.abort(); }, FETCH_TIMEOUT_MS);
    return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function renderSimbadData(row, target) {
    var rows = [];
    rows.push(["OBJECT", row.main_id ? String(row.main_id).trim() : target]);
    if (row.otype) rows.push(["TYPE", OTYPE_LABELS[String(row.otype).trim()] || String(row.otype).trim()]);
    if (row.ra != null) rows.push(["RA", formatRA(row.ra)]);
    if (row.dec != null) rows.push(["DEC", formatDec(row.dec)]);
    if (row.rvz_redshift != null && row.rvz_redshift !== "") rows.push(["REDSHIFT", Number(row.rvz_redshift).toFixed(5)]);
    if (row.rvz_radvel != null && row.rvz_radvel !== "") rows.push(["RADIAL VEL", Math.round(Number(row.rvz_radvel)) + " KM/S"]);
    if (row.morph_type != null && row.morph_type !== "") rows.push(["MORPH", String(row.morph_type).trim().toUpperCase()]);
    if (row.nbref != null && row.nbref !== "") rows.push(["PAPERS", Number(row.nbref).toLocaleString() + " REFS"]);
    injectDataRows(rows, false);
  }

  // Story #36 cleanup: both call sites already gate on `target ===
  // simbadRequestedTarget` (the staleness check) before calling this, so
  // the "not current" half of the old condition here -- and the
  // "SIMBAD DATA UNAVAILABLE" branch it guarded -- could never be reached.
  // Simplified to what's actually reachable: always render the NGC 1300
  // fallback rows for the (guaranteed-current) target.
  function renderFallback() {
    injectDataRows(NGC1300_FALLBACK, true);
  }

  function injectDataRows(pairs, isFallback) {
    var panel = q("#nc-hud01-data-panel");
    if (!panel) return;
    panel.innerHTML = "";
    pairs.forEach(function (pair) {
      var lbl = document.createElement("div"); lbl.className = "nc-ol-label"; lbl.textContent = pair[0] + ":";
      var val = document.createElement("div"); val.className = "nc-ol-value"; val.textContent = pair[1];
      panel.appendChild(lbl); panel.appendChild(val);
    });
    if (isFallback) {
      var note = document.createElement("div");
      note.className = "nc-ol-data-note";
      note.textContent = "— SIMBAD OFFLINE / CACHED DATA —";
      panel.appendChild(note);
    }
  }

  function setDataStatus(text, state) {
    var panel = q("#nc-hud01-data-panel");
    if (!panel) return;
    panel.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "nc-ol-data-status nc-ol-data-status--" + (state || "loading");
    if (state === "loading") { var ring = document.createElement("div"); ring.className = "nc-ol-spinner"; wrap.appendChild(ring); }
    var txt = document.createElement("span"); txt.textContent = text;
    wrap.appendChild(txt); panel.appendChild(wrap);
  }

  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function formatRA(deg) {
    if (deg == null) return "—";
    var h = Math.floor(deg / 15), rm = (deg / 15 - h) * 60, m = Math.floor(rm), s = (rm - m) * 60;
    return pad2(h) + "H " + pad2(m) + "M " + s.toFixed(1) + "S";
  }
  function formatDec(deg) {
    if (deg == null) return "—";
    var sign = deg < 0 ? "-" : "+", abs = Math.abs(deg), d = Math.floor(abs), dm = (abs - d) * 60, m = Math.floor(dm), s = (dm - m) * 60;
    return sign + pad2(d) + "° " + pad2(m) + "' " + s.toFixed(1) + '"';
  }

  // ── VizieR (CATALOGS tab) ────────────────────────────────────────────

  function loadVizierReferences(target) {
    if (vizierCache[target]) { renderVizierRefs(vizierCache[target].refs, vizierCache[target].fallback); return; }
    if (vizierBusy) return;
    vizierBusy = true;
    setPanelStatus(".nc-ol-info-panel--catalog", "LOADING VIZIER REFERENCES…", "loading");

    var params = ["-c=" + encodeURIComponent(target), "-c.rs=2", "-out.max=1", "-source=", "-out.form=mini"].join("&");
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (ctrl) controllers.push(ctrl);
    var timer = later(function () { if (ctrl) ctrl.abort(); }, FETCH_TIMEOUT_MS);

    hud.loadExternalResource("vizier").catch(function () {}).then(function () {
      return fetch(VIZIER_URL + "?" + params, ctrl ? { signal: ctrl.signal } : {});
    }).then(function (r) {
      clearTimeout(timer);
      vizierBusy = false;
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(function (xml) {
      var refs = parseVizierVOTable(xml);
      if (!refs.length) { useVizierFallback(target); return; }
      vizierCache[target] = { refs: refs, fallback: false };
      renderVizierRefs(refs, false);
    }).catch(function () { vizierBusy = false; useVizierFallback(target); });
  }

  function useVizierFallback(target) {
    var refs = VIZIER_NGC1300_FALLBACK.slice(0, vizierLimit);
    vizierCache[target] = { refs: refs, fallback: true };
    renderVizierRefs(refs, true);
  }

  function parseVizierVOTable(xml) {
    var refs = [];
    try {
      var doc = new DOMParser().parseFromString(xml, "application/xml");
      if (doc.querySelector("parsererror")) return refs;
      var resources = doc.getElementsByTagName("RESOURCE");
      for (var i = 0; i < resources.length && refs.length < vizierLimit; i++) {
        var name = resources[i].getAttribute("name") || "";
        if (!name || name === "votable" || name === "results") continue;
        refs.push({ catid: name, title: name, desc: "", year: "", author: "" });
      }
    } catch (e) { warn("VizieR VOTable parse exception: " + e); }
    return refs;
  }

  function renderVizierRefs(refs, isFallback) {
    var panel = q(".nc-ol-info-panel--catalog");
    if (!panel) return;
    panel.innerHTML = "";
    var hdr = document.createElement("div");
    hdr.className = "nc-hud-panel-header";
    hdr.textContent = "TOP " + refs.length + " CATALOGS LINKED TO THE OBJECT";
    panel.appendChild(hdr);
    if (isFallback) {
      var note = document.createElement("div");
      note.className = "nc-ol-data-note";
      note.textContent = "— VIZIER OFFLINE / DEMO DATA —";
      panel.appendChild(note);
    }
    refs.forEach(function (ref) {
      var card = document.createElement("div"); card.className = "nc-ol-paper-card";
      var titleEl = document.createElement("a");
      titleEl.className = "nc-ol-paper-title";
      titleEl.textContent = ref.title || ref.catid;
      titleEl.href = "https://vizier.cds.unistra.fr/viz-bin/VizieR?-source=" + encodeURIComponent(ref.catid);
      titleEl.target = "_blank"; titleEl.rel = "noopener noreferrer";
      card.appendChild(titleEl);
      if (ref.desc) { var desc = document.createElement("div"); desc.className = "nc-ol-paper-abstract"; desc.textContent = ref.desc; card.appendChild(desc); }
      panel.appendChild(card);
    });
  }

  // ── PAPERS tab -- ports widgets/shared/js/hud_papers.js's own SIMBAD
  //    ref/has_ref query (NOT a real ui.adsabs.harvard.edu API call: ADS is
  //    a link target for each row's href only, matching Contract §10.3's
  //    "ads | ui.adsabs.harvard.edu | fetch + link target" row). ──────────

  // Story #36 fix (papersBusy missing reentrancy guard): loadPapers
  // previously set `papersBusy = true` with no `if (papersBusy) return;`
  // guard at all -- unlike loadVizierReferences/loadSimbadData, which are
  // both internally guarded -- so two rapid setData({objectName}) calls
  // while the PAPERS tab was active could fire overlapping SIMBAD TAP
  // queries that both rendered into the same shared panel node. Guarded
  // here the same way loadSimbadData now is (queue-behind + a
  // target-staleness check on resolution), so the panel ends up showing
  // the LAST-requested target's papers regardless of fetch arrival order.
  function loadPapers(target) {
    if (papersBusy) {
      // A->B->A reversion (same fix as loadSimbadData's): nothing new to
      // fetch if the newly-requested target is the one already in flight.
      papersPendingTarget = (target === papersInFlightTarget) ? null : target;
      return;
    }
    papersPendingTarget = null;
    papersBusy = true; papersInFlightTarget = target;
    setPanelStatus(".nc-ol-info-panel--papers", "QUERYING SCIENTIFIC ARCHIVE…", "loading");

    var query = "SELECT TOP " + vizierLimit + ' r.title, r."year", r.bibcode, r.journal ' +
      "FROM ref r JOIN has_ref hr ON hr.oidbibref = r.oidbib JOIN ident i ON i.oidref = hr.oidref " +
      "WHERE i.id = '" + target.replace(/'/g, "''") + "' ORDER BY \"year\" DESC";
    var url = SIMBAD_TAP_URL + "?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=" + encodeURIComponent(query);

    hud.loadExternalResource("simbad").catch(function () {}).then(function () { return simbadFetch(url); })
      .then(function (json) {
        papersBusy = false;
        // Story #36 second follow-up fix: compares against
        // `papersRequestedTarget` (this panel's own tracker), not the
        // shared `currentTarget` -- a target requested while a DIFFERENT
        // tab was active (so this panel's own load wasn't the one that
        // fired) must still count as superseding this response.
        if (target !== papersRequestedTarget) { drainPapersQueue(); return; }
        papersLoaded = true;
        var idx = {};
        (json.metadata || []).forEach(function (col, i) { idx[col.name] = i; });
        var papers = (json.data || []).map(function (row) {
          return { title: row[idx.title] || "", year: row[idx.year] || null, bibcode: row[idx.bibcode] || "", journal: row[idx.journal] || "" };
        });
        renderPapers(papers);
        drainPapersQueue();
      })
      .catch(function () {
        papersBusy = false;
        if (target === papersRequestedTarget) setPanelStatus(".nc-ol-info-panel--papers", "ARCHIVE UNAVAILABLE", "error");
        drainPapersQueue();
      });
  }

  function drainPapersQueue() {
    if (destroyed) return; // Story #36 follow-up fix -- see drainSimbadQueue()
    if (papersPendingTarget === null) return;
    var next = papersPendingTarget;
    papersPendingTarget = null;
    loadPapers(next);
  }

  function renderPapers(papers) {
    var panel = q(".nc-ol-info-panel--papers");
    if (!panel) return;
    panel.innerHTML = "";
    var hdr = document.createElement("div");
    hdr.className = "nc-hud-panel-header";
    hdr.textContent = "TOP " + papers.length + " PAPERS LINKED TO THE OBJECT";
    panel.appendChild(hdr);
    if (!papers.length) { setPanelStatus(".nc-ol-info-panel--papers", "NO PUBLICATIONS FOUND", "error"); return; }
    papers.forEach(function (paper) {
      var row = document.createElement("div"); row.className = "nc-hud-paper-row";
      if (paper.year) { var yr = document.createElement("span"); yr.className = "nc-hud-paper-year"; yr.textContent = "[" + paper.year + "]"; row.appendChild(yr); }
      var titleEl = document.createElement(paper.bibcode ? "a" : "span");
      titleEl.className = "nc-hud-paper-title";
      titleEl.textContent = paper.title || paper.bibcode || "—";
      if (paper.bibcode) { titleEl.href = "https://ui.adsabs.harvard.edu/abs/" + encodeURIComponent(paper.bibcode) + "/abstract"; titleEl.target = "_blank"; titleEl.rel = "noopener noreferrer"; }
      row.appendChild(titleEl);
      if (paper.journal) { var jrn = document.createElement("span"); jrn.className = "nc-hud-paper-journal"; jrn.textContent = paper.journal; row.appendChild(jrn); }
      panel.appendChild(row);
    });
  }

  function setPanelStatus(sel, text, state) {
    var panel = q(sel);
    if (!panel) return;
    panel.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "nc-ol-data-status nc-ol-data-status--" + (state || "loading");
    if (state === "loading") { var ring = document.createElement("div"); ring.className = "nc-ol-spinner"; wrap.appendChild(ring); }
    var txt = document.createElement("span"); txt.textContent = text;
    wrap.appendChild(txt); panel.appendChild(wrap);
  }

  // ── Mode (object / html) -- see README "How mode/objectName reach the
  //    script" for why this is driven by setData rather than a construction
  //    option in this 0.1 Runtime. ──────────────────────────────────────

  function applyMode(mode) {
    var widget = root;
    widget.setAttribute("data-mode", mode);
    var slot = q(".nc-hud-01-html-slot");
    if (slot) slot.setAttribute("aria-hidden", mode === "object" ? "true" : "false");
  }

  // ── Init: assign the Aladin viewer id, wire the toolbar, start object
  //    mode with the default target (matches the real baseline's own
  //    `cfg.target || 'NGC 1300'` default -- Contract §16.3 "network during
  //    mount is permitted", knownDeviations "external-io-on-mount"). ─────
  //
  //    Story #36: this unconditionally starts object-mode network I/O
  //    (loadSimbadData/initAladin) even for a consumer whose intended
  //    starting mode is "html" -- e.g. `hud.setData({ mode: "html", ... })`
  //    queued before mount() resolves (Contract §6.3). The Runtime's
  //    `MountContext` (RendererInterface.ts) carries no `config`/initial-
  //    mode field this script could read synchronously here, so there is
  //    no way for this Theme script to know the intended mode before this
  //    init sequence runs (the whole script body is `mount()`, so it runs
  //    to completion, network calls included, before any queued setData
  //    can be replayed). Not fixable within this Theme's own script
  //    without an out-of-scope Runtime/MountContext change (README "How
  //    mode/objectName reach the script"; tracked honestly as the
  //    `external-io-on-mount` deviation's `html-mode-initial-mount` scope
  //    in manifest.json, not left as an inaccurate "no network in html
  //    mode" claim).

  var aladinDiv = q(".nc-hud-01-aladdin > div:first-child");
  if (aladinDiv && !aladinDiv.id) aladinDiv.id = aladinViewerId;

  wireToolbar();
  applyMode("object");
  loadSimbadData(currentTarget);
  initAladin();

  return {
    setData: function (data) {
      if (Object.prototype.hasOwnProperty.call(data, "mode") && (data.mode === "html" || data.mode === "object")) {
        applyMode(data.mode);
      }
      if (typeof data.objectName === "string" && data.objectName.trim() && data.objectName.trim() !== currentTarget) {
        var target = data.objectName.trim();
        currentTarget = target;
        // Story #36 second follow-up fix: update BOTH panels' own
        // requested-target trackers here, unconditionally, regardless of
        // which tab is active below -- a target requested while the
        // PAPERS tab is active must still be visible to the DATA panel's
        // own staleness check (and vice versa), so a sibling panel's own
        // queue-drain (for a target requested earlier, on a different
        // tab) can never make an unrelated, still-current fetch look
        // stale (or a stale one look current) by surprise.
        simbadRequestedTarget = target;
        papersRequestedTarget = target;
        simbadLoaded = false; papersLoaded = false;
        var mode = root.getAttribute("data-info-mode") || "data";
        if (mode === "data") loadSimbadData(target);
        else if (mode === "catalog") loadVizierReferences(target);
        else if (mode === "papers") loadPapers(target);
        if (aladinReady && aladinInstance) {
          try { aladinInstance.gotoObject(target); } catch (e) { warn("gotoObject failed: " + e); }
        }
      }
    },
    // Contract §17.1: REQUIRED. Removes every listener this script added,
    // cancels timers, aborts in-flight fetches. The real baseline has none
    // of this (Inv §6.5, H10: "no teardown exists anywhere in the
    // baseline") -- 1.0 requires it, so this is new correctness this
    // package adds on top of the migrated behaviour, not a port.
    destroy: function () {
      // Story #36 follow-up fix: aborting an in-flight fetch's controller
      // (below) makes it reject -- it does NOT stop its own .then()/
      // .catch() continuation from running afterward. That continuation
      // unconditionally called drainSimbadQueue()/drainPapersQueue(),
      // which -- if a target was queued -- started a BRAND-NEW fetch from
      // this now-destroyed instance, whose own AbortController lands in
      // the fresh `controllers` array below and can therefore never be
      // aborted (Contract §17.1 violation). Setting `destroyed` (checked
      // by both drain functions) and clearing both pending targets here
      // makes any already-scheduled drain call a guaranteed no-op.
      destroyed = true;
      simbadPendingTarget = null;
      papersPendingTarget = null;
      listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      listeners = [];
      timers.forEach(function (id) { clearTimeout(id); });
      timers = [];
      controllers.forEach(function (c) { try { c.abort(); } catch (e) {} });
      controllers = [];
      if (aladinInstance && typeof aladinInstance.view === "object") {
        // AladinLite v3 exposes no documented destroy(); this Theme has
        // already removed the composition's own listeners/timers above and
        // the mount container itself is emptied by the renderer right
        // after this call returns (SvgRenderer.destroy(), Contract §17.2).
        aladinInstance = null;
      }
    }
  };
})();
