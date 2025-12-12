//
// Environment utilities for the React app.
// Centralizes parsing of environment variables and exposes helpers
// for data mode selection, feature flags, API base URL, logging, etc.
//
// Note: In CRA, only variables prefixed with REACT_APP_ are exposed.
//
// PUBLIC INTERFACES in this file are preceded with "PUBLIC_INTERFACE" comments.
//


/**
 * Safely reads a string env var from process.env with a default.
 * Trims the value to avoid accidental whitespace issues.
 * @param {string} key
 * @param {string|undefined} defaultValue
 * @returns {string|undefined}
 */
function readEnv(key, defaultValue = undefined) {
  try {
    const v = process.env[key];
    if (typeof v === "string") {
      const trimmed = v.trim();
      return trimmed.length ? trimmed : defaultValue;
    }
    return defaultValue;
  } catch (_e) {
    return defaultValue;
  }
}

/**
 * Parses a comma-separated list into a Set of normalized (lowercased, trimmed) flags.
 * Empty items are ignored.
 * @param {string|undefined} value
 * @returns {Set<string>}
 */
function parseCSVFlagsToSet(value) {
  const set = new Set();
  if (!value) return set;
  value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .forEach((s) => set.add(s.toLowerCase()));
  return set;
}

/**
 * Converts a Set of flags into an object map { [flag]: true } for convenient spreading.
 * @param {Set<string>} set
 * @returns {Record<string, boolean>}
 */
function setToMap(set) {
  const map = {};
  set.forEach((k) => {
    map[k] = true;
  });
  return map;
}

/**
 * INTERNAL: Get the raw API base env var (prefers REACT_APP_API_BASE, falls back to REACT_APP_BACKEND_URL).
 * @returns {string|undefined}
 */
function internalGetRawApiBase() {
  const apiBase = readEnv("REACT_APP_API_BASE");
  if (apiBase) return apiBase;
  const backendUrl = readEnv("REACT_APP_BACKEND_URL");
  if (backendUrl) return backendUrl;
  return undefined;
}

// PUBLIC_INTERFACE
export function getApiBase() {
  /** Returns the API base URL string if provided via env, else undefined. */
  return internalGetRawApiBase();
}

// PUBLIC_INTERFACE
export function getDataMode() {
  /**
   * Returns 'api' if an API base is configured (REACT_APP_API_BASE or REACT_APP_BACKEND_URL),
   * otherwise 'local'.
   */
  const base = internalGetRawApiBase();
  return base ? "api" : "local";
}

// PUBLIC_INTERFACE
export function getFeatureFlags() {
  /**
   * Parses REACT_APP_FEATURE_FLAGS which is a comma-separated list of flags.
   * Returns an object with:
   *  - set: Set<string> of normalized (lowercase) flags
   *  - map: Record<string, boolean> map for convenience
   *  - raw: original string value (or empty string)
   */
  const raw = readEnv("REACT_APP_FEATURE_FLAGS", "") || "";
  const set = parseCSVFlagsToSet(raw);
  const map = setToMap(set);
  return { set, map, raw };
}

// PUBLIC_INTERFACE
export function isFeatureEnabled(flag) {
  /**
   * Checks whether a feature flag is enabled.
   * Matching is case-insensitive and trims whitespace.
   * Returns boolean.
   */
  if (!flag || typeof flag !== "string") return false;
  const normalized = flag.trim().toLowerCase();
  if (!normalized) return false;
  const { set } = getFeatureFlags();
  return set.has(normalized);
}

// PUBLIC_INTERFACE
export function getLogLevel() {
  /**
   * Returns the configured log level string from REACT_APP_LOG_LEVEL, or a sensible default.
   * Common values: 'debug','info','warn','error','silent'.
   * Defaults to 'info' if not set.
   */
  return readEnv("REACT_APP_LOG_LEVEL", "info") || "info";
}

// PUBLIC_INTERFACE
export function getNodeEnv() {
  /**
   * Returns the node environment string.
   * Prefers REACT_APP_NODE_ENV, falls back to NODE_ENV provided by CRA.
   * Possible values typically: 'development', 'production', 'test'.
   */
  return readEnv("REACT_APP_NODE_ENV") || readEnv("NODE_ENV") || "development";
}

// PUBLIC_INTERFACE
export function getFrontendUrl() {
  /** Returns the frontend public URL if configured (REACT_APP_FRONTEND_URL). */
  return readEnv("REACT_APP_FRONTEND_URL");
}

// PUBLIC_INTERFACE
export function getWebsocketUrl() {
  /** Returns the websocket URL if configured (REACT_APP_WS_URL). */
  return readEnv("REACT_APP_WS_URL");
}
