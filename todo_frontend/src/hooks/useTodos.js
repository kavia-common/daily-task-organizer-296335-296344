import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDataMode } from "../utils/env";
import * as api from "../services/api";
import { loadTodos as loadLocal, saveTodos as saveLocal, generateId } from "../services/storage";

/**
 * Debounce utility for state setter-like functions.
 * Returns a stable debounced function that delays invoking fn until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
function useDebouncedCallback(fn, wait = 200) {
  const fnRef = useRef(fn);
  const timerRef = useRef(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return useCallback(
    (...args) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, wait);
    },
    [wait]
  );
}

/**
 * Helper to detect if an error is a network/server failure eligible for API mode fallback.
 */
function isNetworkOrServerError(err) {
  return !!(err && (err.isNetworkOrServerError || (typeof err.status === "number" && err.status >= 500)));
}

/**
 * Normalize a todo object to ensure shape consistency.
 */
function normalizeTodo(t) {
  if (!t || typeof t !== "object") return null;
  const id = t.id ?? t._id ?? generateId();
  return {
    id,
    title: String(t.title ?? "").trim(),
    completed: !!t.completed,
    // allow arbitrary additional fields but ensure id/title/completed exist
    ...t,
  };
}

/**
 * Apply filter and search to a list of tasks.
 */
function filterAndSearch(tasks, filter, search) {
  const q = (search || "").trim().toLowerCase();
  return tasks.filter((t) => {
    const matchesFilter =
      filter === "all" ? true : filter === "active" ? !t.completed : filter === "completed" ? !!t.completed : true;
    const matchesSearch = q.length ? String(t.title || "").toLowerCase().includes(q) : true;
    return matchesFilter && matchesSearch;
  });
}

// PUBLIC_INTERFACE
export default function useTodos() {
  /**
   * Hook to manage todos and related UI state.
   * Exposes:
   *  - tasks: filtered+searched list of todos
   *  - filter: 'all' | 'active' | 'completed'
   *  - search: search string
   *  - addTodo(title)
   *  - toggleTodo(id)
   *  - updateTodo(id, updates)
   *  - deleteTodo(id)
   *  - clearCompleted()
   *  - setFilter(nextFilter)
   *  - setSearch(nextSearch) -> debounced internal update
   *
   * Behavior:
   *  - Selects data provider based on utils/env.getDataMode(): 'local' or 'api'
   *  - Initializes tasks from provider on mount.
   *  - In local mode, persists to localStorage on changes.
   *  - In api mode, performs optimistic updates with rollback on failure.
   *  - Debounces search input updates slightly.
   */
  const [provider, setProvider] = useState(() => getDataMode() === "api" ? "api" : "local");
  const [allTasks, setAllTasks] = useState(() => {
    if (provider === "local") return (loadLocal() || []).map(normalizeTodo).filter(Boolean);
    return [];
  });
  const [filter, setFilter] = useState("all");
  const [searchImmediate, setSearchImmediate] = useState("");

  // Debounced external setter for search text
  const [search, setSearchRaw] = useState("");
  const debouncedSetSearch = useDebouncedCallback((val) => {
    setSearchRaw(val);
  }, 250);

  const setSearch = useCallback(
    (val) => {
      setSearchImmediate(val);
      debouncedSetSearch(val);
    },
    [debouncedSetSearch]
  );

  // Initialize from provider on mount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const mode = getDataMode() === "api" ? "api" : "local";
      setProvider(mode);

      if (mode === "local") {
        const local = (loadLocal() || []).map(normalizeTodo).filter(Boolean);
        if (isMounted) setAllTasks(local);
        return;
      }

      // api mode
      try {
        const list = await api.listTodos();
        const normalized = Array.isArray(list) ? list.map(normalizeTodo).filter(Boolean) : [];
        if (isMounted) setAllTasks(normalized);
      } catch (err) {
        // Fallback to local mode if network/server problem
        if (isNetworkOrServerError(err)) {
          const local = (loadLocal() || []).map(normalizeTodo).filter(Boolean);
          if (isMounted) {
            setProvider("local");
            setAllTasks(local);
          }
        } else {
          // keep api mode but show empty/previous state
          // no rethrow: UI should continue functioning
          // Optionally could log
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist in local mode
  useEffect(() => {
    if (provider === "local") {
      saveLocal(allTasks);
    }
  }, [provider, allTasks]);

  // Derived tasks according to filter + search
  const tasks = useMemo(() => filterAndSearch(allTasks, filter, search), [allTasks, filter, search]);

  // Helper for optimistic updates with rollback in API mode
  const withOptimistic = useCallback(
    async (applyLocalChange, apiCall, rollbackOnError) => {
      if (provider === "local") {
        // Just apply and persist
        setAllTasks((prev) => {
          const next = applyLocalChange(prev);
          return next;
        });
        return;
      }

      // API mode: optimistic update then call API
      let snapshot;
      setAllTasks((prev) => {
        snapshot = prev;
        const next = applyLocalChange(prev);
        return next;
      });

      try {
        await apiCall();
      } catch (err) {
        // rollback on failure
        setAllTasks((prev) => {
          // If a specialized rollback is provided, use it; else restore snapshot
          return typeof rollbackOnError === "function" ? rollbackOnError(prev, snapshot) : snapshot;
        });

        // Fallback to local if network/server is down
        if (isNetworkOrServerError(err)) {
          setProvider("local");
        }
      }
    },
    [provider]
  );

  // PUBLIC_INTERFACE
  const addTodo = useCallback(
    async (title) => {
      const trimmed = String(title || "").trim();
      if (!trimmed) return;

      const newItem = normalizeTodo({ id: generateId(), title: trimmed, completed: false });

      await withOptimistic(
        (prev) => [newItem, ...prev],
        async () => {
          if (provider === "api") {
            const created = await api.createTodo({ title: trimmed, completed: false });
            const normalized = normalizeTodo(created);
            if (normalized) {
              // replace temp item by server version using id match rules
              setAllTasks((prev) =>
                prev.map((t) => (t.id === newItem.id ? { ...normalized } : t))
              );
            }
          }
        },
        (prev, snapshot) => snapshot
      );
    },
    [provider, withOptimistic]
  );

  // PUBLIC_INTERFACE
  const toggleTodo = useCallback(
    async (id) => {
      if (!id) return;
      const target = allTasks.find((t) => t.id === id);
      if (!target) return;
      const nextCompleted = !target.completed;

      await withOptimistic(
        (prev) => prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)),
        async () => {
          if (provider === "api") {
            await api.updateTodo(id, { completed: nextCompleted });
          }
        },
        (prev, snapshot) => snapshot
      );
    },
    [allTasks, provider, withOptimistic]
  );

  // PUBLIC_INTERFACE
  const updateTodo = useCallback(
    async (id, updates) => {
      if (!id || !updates || typeof updates !== "object") return;
      const safeUpdates = { ...updates };
      if (typeof safeUpdates.title === "string") {
        safeUpdates.title = safeUpdates.title.trim();
      }

      await withOptimistic(
        (prev) => prev.map((t) => (t.id === id ? { ...t, ...safeUpdates } : t)),
        async () => {
          if (provider === "api") {
            await api.updateTodo(id, safeUpdates);
          }
        },
        (prev, snapshot) => snapshot
      );
    },
    [provider, withOptimistic]
  );

  // PUBLIC_INTERFACE
  const deleteTodo = useCallback(
    async (id) => {
      if (!id) return;

      await withOptimistic(
        (prev) => prev.filter((t) => t.id !== id),
        async () => {
          if (provider === "api") {
            await api.deleteTodo(id);
          }
        },
        (prev, snapshot) => snapshot
      );
    },
    [provider, withOptimistic]
  );

  // PUBLIC_INTERFACE
  const clearCompleted = useCallback(async () => {
    const completedIds = allTasks.filter((t) => t.completed).map((t) => t.id);
    if (!completedIds.length) return;

    await withOptimistic(
      (prev) => prev.filter((t) => !t.completed),
      async () => {
        if (provider === "api") {
          // If backend lacks a batch clear endpoint, we serially delete.
          await Promise.allSettled(completedIds.map((id) => api.deleteTodo(id)));
        }
      },
      (prev, snapshot) => snapshot
    );
  }, [allTasks, provider, withOptimistic]);

  return {
    tasks,
    filter,
    search: searchImmediate,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    clearCompleted,
    setFilter,
    setSearch,
  };
}
