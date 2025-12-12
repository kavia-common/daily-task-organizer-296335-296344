import React from "react";
import PropTypes from "prop-types";
import TodoItem from "./TodoItem";

/**
 * List of todos. Renders items and empty state.
 */

// PUBLIC_INTERFACE
export default function TodoList({ items, onToggle, onUpdate, onDelete }) {
  const hasItems = Array.isArray(items) && items.length > 0;

  if (!hasItems) {
    return (
      <div className="empty-state" role="note" aria-live="polite">
        No tasks to show. Add your first task above!
      </div>
    );
  }

  return (
    <ul className="todo-list" role="list" aria-label="Tasks">
      {items.map((t) => (
        <TodoItem key={t.id} item={t} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </ul>
  );
}

TodoList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.any.isRequired, title: PropTypes.string.isRequired, completed: PropTypes.bool })
  ).isRequired,
  onToggle: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
