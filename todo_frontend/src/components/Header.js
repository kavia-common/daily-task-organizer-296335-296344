import React from "react";
import PropTypes from "prop-types";
import { isFeatureEnabled } from "../utils/env";

/**
 * Header component showing app title, theme toggle, and task counter.
 * Provides accessible controls and ARIA labels.
 */

// PUBLIC_INTERFACE
export default function Header({ theme, onToggleTheme, total, active }) {
  /** Header area with:
   *  - Title
   *  - Optional experiments badge (via feature flag 'experiments')
   *  - Theme toggle button
   *  - Task counter (active/total)
   */
  const experiments = isFeatureEnabled("experiments") || isFeatureEnabled("experiments_enabled");
  return (
    <header className="app-header-bar" role="banner">
      <div className="app-header-left">
        <h1 className="app-title" aria-label="Daily Task Organizer">Daily Task Organizer</h1>
        {experiments && (
          <span className="badge badge-amber" aria-label="Experiments enabled" title="Experiments enabled">
            Beta
          </span>
        )}
      </div>
      <div className="app-header-right">
        <div
          className="task-counter"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          title={`${active} active out of ${total} tasks`}
        >
          <span className="counter-dot" aria-hidden="true">•</span>
          <span className="counter-text">
            {active} active / {total} total
          </span>
        </div>
        <button
          type="button"
          className="btn theme-toggle-compact"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙" : "☀️"}
          <span className="sr-only">Toggle theme</span>
        </button>
      </div>
    </header>
  );
}

Header.propTypes = {
  theme: PropTypes.oneOf(["light", "dark"]).isRequired,
  onToggleTheme: PropTypes.func.isRequired,
  total: PropTypes.number.isRequired,
  active: PropTypes.number.isRequired,
};
