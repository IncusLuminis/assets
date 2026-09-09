/**
 * hud-loader.js — widget registry and dynamic loader
 * Tracks registered widgets; supports future Blogger/Cloudflare embed.
 * No dependencies. Vanilla JS only.
 */

const HUDLoader = (() => {
  'use strict';

  /* Widget registry: { id: { name, path, element } } */
  const _registry = {};

  /**
   * Register a widget definition.
   * @param {string} id       - unique slug, e.g. 'asymmetric-panel'
   * @param {string} name     - human-readable label
   * @param {string} path     - relative path to widget directory
   */
  function register(id, name, path) {
    if (_registry[id]) {
      console.warn(`[HUDLoader] Widget "${id}" already registered.`);
      return;
    }
    _registry[id] = { id, name, path, element: null };
  }

  /**
   * Get all registered widget definitions.
   * @returns {Object[]}
   */
  function getAll() {
    return Object.values(_registry);
  }

  /**
   * Get one widget definition by id.
   * @param {string} id
   * @returns {Object|undefined}
   */
  function get(id) {
    return _registry[id];
  }

  /**
   * Mount a widget into a host element via an iframe.
   * Designed for playground and future Blogger embed use.
   * @param {string} id       - registered widget id
   * @param {Element} host    - DOM element to mount into
   * @returns {HTMLIFrameElement|null}
   */
  function mount(id, host) {
    const widget = _registry[id];
    if (!widget) {
      console.error(`[HUDLoader] Widget "${id}" not found in registry.`);
      return null;
    }

    const iframe = document.createElement('iframe');
    iframe.src = `${widget.path}/index.html`;
    iframe.title = widget.name;
    iframe.style.cssText = 'border:none; width:100%; height:100%;';
    iframe.setAttribute('loading', 'lazy');

    host.appendChild(iframe);
    widget.element = iframe;
    return iframe;
  }

  /**
   * Unmount a widget from its host element.
   * @param {string} id
   */
  function unmount(id) {
    const widget = _registry[id];
    if (widget && widget.element) {
      widget.element.remove();
      widget.element = null;
    }
  }

  return { register, getAll, get, mount, unmount };
})();

/* Make available globally when loaded via <script> tag */
if (typeof window !== 'undefined') {
  window.HUDLoader = HUDLoader;
}
