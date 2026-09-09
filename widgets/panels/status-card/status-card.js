/* status-card/status-card.js — stub with live stat simulation */
'use strict';

(function () {
  const { qs, clamp } = HUDCore;

  const shieldsBar = qs('#shieldsBar');
  const shieldsVal = qs('#shieldsVal');
  const hullBar    = qs('#hullBar');
  const hullVal    = qs('#hullVal');
  const powerBar   = qs('#powerBar');
  const powerVal   = qs('#powerVal');
  const statusDot  = qs('#statusDot');
  const statusLabel= qs('#statusLabel');

  let shields = 78;
  let hull    = 94;
  let power   = 61;

  function getStatus(s, h, p) {
    const min = Math.min(s, h, p);
    if (min < 25) return { text: 'CRITICAL DAMAGE', level: 'critical' };
    if (min < 50) return { text: 'SYSTEMS DEGRADED', level: 'warning' };
    return { text: 'SYSTEMS NOMINAL', level: 'ok' };
  }

  function setBar(barEl, valEl, value) {
    barEl.style.width = value + '%';
    valEl.textContent = Math.round(value) + '%';

    barEl.classList.remove('nc-status-card__bar-fill--warning', 'nc-status-card__bar-fill--critical');
    if (value < 25) barEl.classList.add('nc-status-card__bar-fill--critical');
    else if (value < 50) barEl.classList.add('nc-status-card__bar-fill--warning');
  }

  function tick() {
    shields = clamp(shields + (Math.random() - 0.48) * 1.2, 0, 100);
    hull    = clamp(hull    + (Math.random() - 0.49) * 0.4, 0, 100);
    power   = clamp(power   + (Math.random() - 0.5)  * 1.8, 0, 100);

    setBar(shieldsBar, shieldsVal, shields);
    setBar(hullBar,    hullVal,    hull);
    setBar(powerBar,   powerVal,   power);

    const status = getStatus(shields, hull, power);
    if (statusLabel) statusLabel.textContent = status.text;

    if (statusDot) {
      statusDot.className = 'nc-status-card__indicator nc-anim-blink';
      if (status.level !== 'ok') {
        statusDot.classList.add('nc-status-card__indicator--' + status.level);
      }
    }
  }

  setInterval(tick, 1000);
})();
