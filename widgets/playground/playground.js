/* playground/playground.js — widget registry bootstrap */
'use strict';

(function () {
  HUDLoader.register('asymmetric-panel', 'Asymmetric Panel', '../panels/asymmetric-panel');
  HUDLoader.register('targeting-reticle', 'Targeting Reticle', '../panels/targeting-reticle');
  HUDLoader.register('status-card', 'Status Card', '../panels/status-card');

  /* Log registry to console for dev inspection */
  console.log('[HUDLoader] Registered widgets:', HUDLoader.getAll().map(w => w.id));
})();
