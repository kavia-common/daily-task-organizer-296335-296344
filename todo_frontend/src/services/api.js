//
// API service for interacting with a backend To-Do API.
// Reads base URL from env utils and exposes CRUD operations.
//
// Error handling:
// - Network errors and 5xx responses will throw an error with isNetworkOrServerError=true
//   so callers can detect and fallback to local mode.
// - 4xx responses will throw an error with status and details when available.
//
// PUBLIC INTERFACES in this file are preceded with "PUBLIC_INTERFACE" comments.
//

import { getApiBase } from "../utils/env";

// Helper: build full URL with optional query params
function buildUrl(path, params) {
  const base = getApiBase();
  if (!base) {
    // No API base configured; callers may decide to fall back to local immediately if they wish.
    // We still return a relative path to allow dev proxies if configured.
  }
  const baseUrl = (base || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").replace(/^\/+/, "");
  const url = base ? `${baseUrl}/${cleanPath}` : `/${cleanPath}`;

  if (!params || typeof params !== "object") return url;

  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    // Array handling
    if (Array.isArray(v)) {
      v.forEach((item) => usp.append(k, String(item)));
    } else {
      usp.set(k, String(v));
    }
  });
  const qs = usp.toString();
  return qs ? `${url}?${qs}` : url;
}

// Helper: construct default headers for JSON APIs
function defaultJsonHeaders(extra) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(extra || {}),
  };
}

// Helper: read response body safely as JSON if possible, otherwise text, otherwise null
async function readBodySafely(resp) {
  const contentType = resp.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      return await resp.json();
    }
    const text = await resp.text();
    try {
      // Try parse text as JSON regardless of header
      return JSON.parse(text);
    } catch {
      return text || null;
    }
  } catch (_e) {
    return null;
  }
}

// Helper: normalize and throw a rich error with flags to allow fallback decisions
async function throwForResponse(resp) {
  const body = await readBodySafely(resp);
  const message =
    (body && body.message) ||
    (typeof body === "string" ? body : null) ||
    `Request failed with status ${resp.status}`;

  const err = new Error(message);
  err.status = resp.status;
  err.details = body;
  // Mark network/server errors to signal fallback option
  err.isNetworkOrServerError = resp.status >= 500 && resp.status <= 599;
  throw err;
}

// Helper: wrap fetch with consistent error semantics
async function requestJson(path, options = {}) {
  const url = buildUrl(path);
  try {
    const resp = await fetch(url, {
      ...options,
      headers: defaultJsonHeaders(options.headers),
    });

    if (!resp.ok) {
      await throwForResponse(resp);
    }

    // Success: try parse JSON
    const data = await readBodySafely(resp);
    return data;
  } catch (e) {
    // Network or CORS or aborted, etc.
    if (!(e instanceof Error)) {
      const err = new Error("Unknown error during request");
      err.isNetworkOrServerError = true;
      throw err;
    }
    // If it doesn't have status, consider it a network-ish problem
    if (typeof e.status !== "number") {
      e.isNetworkOrServerError = true;
    }
    throw e;
  }
}

// PUBLIC_INTERFACE
export async function listTodos() {
  /** Fetch the list of todos from the backend.
   * GET /todos
   * Returns: Array<Object> (todos)
   * Throws:
   *  - Error with .isNetworkOrServerError = true on network/5xx to enable fallback
   *  - Error with .status and .details for other HTTP errors
   */
  return requestJson("todos", { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createTodo(payload) {
  /** Create a new todo item.
   * POST /todos
   * Body: JSON payload { title: string, completed?: boolean, ... }
   * Returns: Created todo object
   * Throws: Same semantics as listTodos()
   */
  return requestJson("todos", {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

// PUBLIC_INTERFACE
export async function updateTodo(id, payload) {
  /** Update an existing todo item by id.
   * PATCH /todos/:id
   * Body: JSON payload with fields to update
   * Returns: Updated todo object
   * Throws: Same semantics as listTodos()
   */
  if (!id) {
    const err = new Error("Missing id for updateTodo");
    err.status = 400;
    throw err;
  }
  return requestJson(`todos/${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    body: JSON.stringify(payload || {}),
  });
}

// PUBLIC_INTERFACE
export async function deleteTodo(id) {
  /** Delete a todo item by id.
   * DELETE /todos/:id
   * Returns: { success: true } or empty object depending on backend
   * Throws: Same semantics as listTodos()
   */
  if (!id) {
    const err = new Error("Missing id for deleteTodo");
    err.status = 400;
    throw err;
  }
  return requestJson(`todos/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}
