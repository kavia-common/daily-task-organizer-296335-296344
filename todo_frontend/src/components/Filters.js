import React, { useId } from "react";
import PropTypes from "prop-types";
import { isFeatureEnabled } from "../utils/env";

/**
 * Filters toolbar containing status filters and optional search field.
 */

// PUBLIC_INTERFACE
export default function Filters({ filter, onChangeFilter, search, onChangeSearch }) {
  /** Filter toolbar. Search input visibility controlled by feature flag "search" */
  const idSearch = useId();
  const searchEnabled = isFeatureEnabled("search") || isFeatureEnabled("search_bar");

  return (
    <div className="filters-toolbar" role="toolbar" aria-label="Filters">
      <div className="segmented" role="tablist" aria-label="Task status filter">
        <button
          role="tab"
          aria-selected={filter === "all"}
          className={`seg-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => onChangeFilter("all")}
        >
          All
        </button>
        <button
          role="tab"
          aria-selected={filter === "active"}
          className={`seg-btn ${filter === "active" ? "active" : ""}`}
          onClick={() => onChangeFilter("active")}
        >
          Active
        </button>
        <button
          role="tab"
          aria-selected={filter === "completed"}
          className={`seg-btn ${filter === "completed" ? "active" : ""}`}
          onClick={() => onChangeFilter("completed")}
        >
          Completed
        </button>
      </div>

      {searchEnabled && (
        <div className="search-wrap">
          <label className="sr-only" htmlFor={idSearch}>
            Search tasks
          </label>
          <input
            id={idSearch}
            type="search"
            className="input search"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            aria-label="Search tasks"
          />
        </div>
      )}
    </div>
  );
}

Filters.propTypes = {
  filter: PropTypes.oneOf(["all", "active", "completed"]).isRequired,
  onChangeFilter: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  onChangeSearch: PropTypes.func.isRequired,
};
