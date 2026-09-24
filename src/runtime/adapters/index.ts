// Story #46 (Track B / Story B1): the `<nebula-hud>` Web Component adapter.
// Importing this module self-registers the custom element (guarded,
// idempotent) as a side effect -- see `nebula-hud.ts`'s docstring for why:
// the whole point is a copy-pasted `<script type="module">` snippet with no
// further JS required from the consumer.
export { NebulaHud, DEFAULT_CDN_BASE_URL } from "./nebula-hud.js";
