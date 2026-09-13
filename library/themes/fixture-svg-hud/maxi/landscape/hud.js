// Fixture composition script (Story #9). Evaluated by SvgRenderer as a
// function body: `new Function("root", "context", "hud", <this file's text>)`
// -- NOT a real HUD-01/HUD-02 wrapper (#11/#12's job), just enough
// controlled JS (Contract §16.4, §17.1, Arch §18) to prove:
//   1. a Theme entry script can wire up its own event listeners and expose
//      a teardown handle (`destroy`) the renderer calls from `destroy()`;
//   2. a Theme-owned control (never consumer content, Contract §9.2) can
//      request a capability-declared external resource LAZILY, on demand,
//      through `hud.loadExternalResource(name)` -- not at mount
//      (Contract §10.4, §16.2-§16.3). This fixture never actually reaches
//      a real Aladin/SIMBAD endpoint; see manifest.json's `skyViewer` /
//      `dataSource` declaration and SvgRenderer's `ExternalResourceLoader`.
"use strict";

var button = root.querySelector('[data-hud-control="load-sky-viewer"]');

function onClick() {
  // Contract §20.3: a Theme script must never let a rejection escape into
  // the host -- swallow it here the same way the renderer itself never
  // rethrows into Hud.
  hud.loadExternalResource("skyViewer").catch(function () {});
}

if (button) {
  button.addEventListener("click", onClick);
}

return {
  destroy: function () {
    if (button) {
      button.removeEventListener("click", onClick);
    }
  }
};
