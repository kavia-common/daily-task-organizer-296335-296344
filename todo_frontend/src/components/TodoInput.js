import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import PropTypes from "prop-types";
import { isFeatureEnabled } from "../utils/env";

/**
 * Input component to add a new todo item.
 * - Controlled input
 * - Add button
 * - Optional due date input gated by feature flag "due_date"
 * - Keyboard: Enter to submit, Ctrl/Cmd+Enter also works
 */

// PUBLIC_INTERFACE
export default function TodoInput({ onAdd }) {
  /** Controlled input with optional due date (feature flag "due_date") */
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const inputRef = useRef(null);
  const idTitle = useId();
  const idDate = useId();

  const dueEnabled = isFeatureEnabled("due_date") || isFeatureEnabled("due-date");

  const canAdd = title.trim().length > 0;

  const handleSubmit = useCallback(() => {
    const t = title.trim();
    if (!t) return;
    const payload = { title: t };
    if (dueEnabled && due) {
      payload.dueDate = due;
    }
    onAdd(payload.title); // currently hook accepts only title; future: support dueDate
    setTitle("");
    setDue("");
    // move focus back to input for quick entry
    if (inputRef.current) inputRef.current.focus();
  }, [title, dueEnabled, due, onAdd]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        e.preventDefault();
        if (canAdd) handleSubmit();
      }
    },
    [canAdd, handleSubmit]
  );

  useEffect(() => {
    // autofocus on mount for convenience
    if (inputRef.current) inputRef.current.focus();
  }, []);

  return (
    <div className="todo-input-panel" role="form" aria-labelledby={`${idTitle}-label`}>
      <div className="field-group">
        <label id={`${idTitle}-label`} htmlFor={idTitle} className="field-label">
          Add a task
        </label>
        <div className="field-row">
          <input
            id={idTitle}
            ref={inputRef}
            type="text"
            className="input control-lg"
            placeholder="e.g., Plan team meeting agenda"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={onKeyDown}
            aria-required="true"
          />
          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={handleSubmit}
            disabled={!canAdd}
            aria-disabled={!canAdd}
            aria-label="Add task"
            title="Add task"
          >
            Add
          </button>
        </div>
      </div>
      {dueEnabled && (
        <div className="field-group">
          <label htmlFor={idDate} className="field-label">
            Due date (optional)
          </label>
          <input
            id={idDate}
            type="date"
            className="input"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-describedby={`${idDate}-help`}
          />
          <div id={`${idDate}-help`} className="help-text">
            Feature flag: due_date
          </div>
        </div>
      )}
    </div>
  );
}

TodoInput.propTypes = {
  onAdd: PropTypes.func.isRequired,
};
