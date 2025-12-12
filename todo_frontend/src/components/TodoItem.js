import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import PropTypes from "prop-types";

/**
 * Individual todo item row.
 * - Toggle complete
 * - Inline edit title (Enter to save, Esc to cancel)
 * - Delete
 * - Accessible labels and keyboard interactions
 */

// PUBLIC_INTERFACE
export default function TodoItem({ item, onToggle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title || "");
  const inputRef = useRef(null);
  const checkboxId = useId();
  const inputId = useId();

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = useCallback(() => {
    const next = draft.trim();
    if (!next || next === item.title) {
      setEditing(false);
      setDraft(item.title || "");
      return;
    }
    onUpdate(item.id, { title: next });
    setEditing(false);
  }, [draft, item, onUpdate]);

  const cancel = useCallback(() => {
    setDraft(item.title || "");
    setEditing(false);
  }, [item]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    },
    [save, cancel]
  );

  return (
    <li className={`todo-item ${item.completed ? "completed" : ""}`} role="listitem">
      <div className="todo-card">
        <div className="left">
          <input
            id={checkboxId}
            type="checkbox"
            className="checkbox"
            checked={!!item.completed}
            onChange={() => onToggle(item.id)}
            aria-label={item.completed ? "Mark as active" : "Mark as completed"}
          />
          {!editing ? (
            <label
              htmlFor={checkboxId}
              className="todo-title"
              onDoubleClick={() => setEditing(true)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditing(true);
              }}
              aria-describedby={inputId}
              aria-label={`Task: ${item.title}${item.completed ? ", completed" : ""}`}
            >
              {item.title}
            </label>
          ) : (
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              className="input edit"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={save}
              aria-label="Edit task title"
            />
          )}
        </div>
        <div className="actions">
          {!editing && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => setEditing(true)}
              aria-label="Edit task"
              title="Edit"
            >
              ✏️
            </button>
          )}
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => onDelete(item.id)}
            aria-label="Delete task"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </li>
  );
}

TodoItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.any.isRequired,
    title: PropTypes.string.isRequired,
    completed: PropTypes.bool,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
