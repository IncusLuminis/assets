/**
 * hud-core.js — HUD widget core utilities
 * No dependencies. Vanilla JS only.
 */

const HUDCore = (() => {
  'use strict';

  /**
   * Query helper — returns first match or null.
   * @param {string} selector
   * @param {Element} [root=document]
   */
  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  /**
   * Query all helper — returns NodeList.
   * @param {string} selector
   * @param {Element} [root=document]
   */
  function qsa(selector, root = document) {
    return root.querySelectorAll(selector);
  }

  /**
   * Create element with optional class and inner text.
   * @param {string} tag
   * @param {string} [className]
   * @param {string} [text]
   * @returns {HTMLElement}
   */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /**
   * Format a number with zero-padding.
   * @param {number} n
   * @param {number} digits
   * @returns {string}
   */
  function zeroPad(n, digits = 2) {
    return String(n).padStart(digits, '0');
  }

  /**
   * Clamp a value between min and max.
   * @param {number} value
   * @param {number} min
   * @param {number} max
   */
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Simple event emitter for widget state changes.
   */
  class EventBus {
    constructor() {
      this._listeners = {};
    }

    on(event, fn) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    }

    off(event, fn) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(l => l !== fn);
    }

    emit(event, data) {
      (this._listeners[event] || []).forEach(fn => fn(data));
    }
  }

  /**
   * Boot sequence: adds nc-anim-flicker class then resolves.
   * @param {Element} element
   * @returns {Promise<void>}
   */
  function bootFlicker(element) {
    return new Promise(resolve => {
      element.classList.add('nc-anim-flicker');
      element.addEventListener('animationend', () => resolve(), { once: true });
    });
  }

  return { qs, qsa, el, zeroPad, clamp, EventBus, bootFlicker };
})();

/* Make available globally when loaded via <script> tag */
if (typeof window !== 'undefined') {
  window.HUDCore = HUDCore;
}
