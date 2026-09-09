/* asymmetric-panel/panel.js — stub with live data simulation */
'use strict';

(function () {
  const { qs, zeroPad } = HUDCore;

  const vectorEl = qs('#vectorVal');
  const altEl    = qs('#altVal');
  const velEl    = qs('#velVal');
  const pwrEl    = qs('#pwrVal');

  /* Simulate slowly drifting telemetry values */
  let vector = 247.8;
  let alt    = 3210;
  let vel    = 412;
  let pwr    = 88;

  function tick() {
    vector = (vector + (Math.random() - 0.5) * 0.4 + 360) % 360;
    alt    = Math.max(0,   alt + Math.round((Math.random() - 0.5) * 10));
    vel    = Math.max(0,   vel + Math.round((Math.random() - 0.5) * 4));
    pwr    = HUDCore.clamp(pwr + (Math.random() - 0.5) * 0.5, 0, 100);

    if (vectorEl) vectorEl.textContent = vector.toFixed(1) + '°';
    if (altEl)    altEl.textContent    = alt.toLocaleString() + ' m';
    if (velEl)    velEl.textContent    = vel + ' m/s';
    if (pwrEl)    pwrEl.textContent    = Math.round(pwr) + '%';
  }

  setInterval(tick, 800);
})();
