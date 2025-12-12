//
// Local storage service for the To-Do app.
// Provides safe load/save operations and a simple ID generator.
// All keys are namespaced to avoid collisions with other apps using localStorage.
//
// PUBLIC INTERFACES in this file are preceded with "PUBLIC_INTERFACE" comments.
//

const NAMESPACE = 'todo_app';
const TODOS_KEY = `${NAMESPACE}_todos`;

/**
 * Safely parse JSON with a default fallback.
 * @param {string|null|undefined} raw
 * @param {any} fallback
 * @returns {any}
 */
function safeJsonParse(raw, fallback) {
  if (typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    // Ensure we only accept arrays for todos
    if (Array.isArray(parsed)) return parsed;
    return fallback;
  } catch (_e) {
    return fallback;
  }
}

/**
 * Safely stringify JSON with a default fallback string.
 * @param {any} value
 * @param {string} fallback
 * @returns {string}
 */
function safeJsonStringify(value, fallback = '[]') {
  try {
    return JSON.stringify(value ?? []);
  } catch (_e) {
    return fallback;
  }
}

/**
 * INTERNAL: Whether localStorage is available.
 * @returns {boolean}
 */
function hasLocalStorage() {
  try {
    const testKey = `${NAMESPACE}_ls_test`;
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (_e) {
    return false;
  }
}

// PUBLIC_INTERFACE
export function loadTodos() {
  /**
   * Loads todos array from localStorage.
   * Returns an empty array if nothing stored or on any error.
   * Key used: "todo_app_todos".
   * @returns {Array<Object>}
   */
  try {
    if (!hasLocalStorage()) return [];
    const raw = window.localStorage.getItem(TODOS_KEY);
    return safeJsonParse(raw, []);
  } catch (_e) {
    return [];
  }
}

// PUBLIC_INTERFACE
export function saveTodos(todos) {
  /**
   * Saves the provided todos array into localStorage.
   * Silently no-ops if localStorage is unavailable or on error.
   * Key used: "todo_app_todos".
   * @param {Array<Object>} todos
   */
  try {
    if (!hasLocalStorage()) return;
    const payload = Array.isArray(todos) ? todos : [];
    window.localStorage.setItem(TODOS_KEY, safeJsonStringify(payload, '[]'));
  } catch (_e) {
    // no-op
  }
}

// PUBLIC_INTERFACE
export function generateId() {
  /**
   * Generates a reasonably unique ID for a todo item.
   * Combines timestamp, random, and a small counter scoped to the session.
   * @returns {string}
   */
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  const counter = (++generateId._c % 0xffff).toString(36);
  return `${NAMESPACE}_${ts}_${rand}_${counter}`;
}
// initialize internal counter
generateId._c = 0;
