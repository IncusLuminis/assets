/* targeting-reticle/reticle.js — stub with live targeting data simulation */
'use strict';

(function () {
  const { qs, clamp } = HUDCore;

  const azimuthEl = qs('#azimuthVal');
  const rangeEl   = qs('#rangeVal');
  const elevEl    = qs('#elevVal');
  const lockEl    = qs('#lockVal');

  let az    = 247.8;
  let range = 1842;
  let elev  = 12;
  let locked = true;
  let lockTimer = 0;

  function tick() {
    az    = (az + (Math.random() - 0.5) * 0.6 + 360) % 360;
    range = clamp(range + Math.round((Math.random() - 0.5) * 30), 100, 9999);
    elev  = clamp(elev  + (Math.random() - 0.5) * 0.5, -90, 90);

    /* Occasionally lose and reacquire lock */
    lockTimer++;
    if (lockTimer > 20 && Math.random() < 0.05) {
      locked = !locked;
      lockTimer = 0;
    }

    if (azimuthEl) azimuthEl.textContent = 'AZ ' + az.toFixed(1) + '°';
    if (rangeEl)   rangeEl.textContent   = 'RNG ' + range.toLocaleString() + ' m';
    if (elevEl)    elevEl.textContent    = 'EL ' + (elev >= 0 ? '+' : '') + elev.toFixed(1) + '°';
    if (lockEl) {
      lockEl.textContent = locked ? 'LOCK' : 'SCAN';
      lockEl.style.color = locked
        ? 'var(--hud-text-accent)'
        : 'rgba(200, 240, 255, 0.45)';
    }
  }

  setInterval(tick, 600);
})();
