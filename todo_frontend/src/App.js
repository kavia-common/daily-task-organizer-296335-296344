import React, { useMemo } from "react";
import "./App.css";
import useTheme from "./hooks/useTheme";
import useTodos from "./hooks/useTodos";
import Header from "./components/Header";
import TodoInput from "./components/TodoInput";
import Filters from "./components/Filters";
import TodoList from "./components/TodoList";

// PUBLIC_INTERFACE
function App() {
  /**
   * Main app component wiring hooks to UI components.
   * Theme and layout adhere to the "Ocean Professional" design:
   * - Clean surface panels with rounded corners
   * - Blue primary accents and amber highlights
   * - Subtle shadows and smooth transitions
   */
  const { theme, toggleTheme } = useTheme();
  const {
    tasks,
    filter,
    search,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    clearCompleted,
    setFilter,
    setSearch,
  } = useTodos();

  const totalCount = tasks.length;
  const activeCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);

  return (
    <div className="App" data-theme={theme}>
      <div className="viewport">
        <Header theme={theme} onToggleTheme={toggleTheme} total={totalCount} active={activeCount} />

        <main className="main-panel" role="main">
          {/* Input + Filters Panel (Ocean surface card) */}
          <section className="panel card" aria-label="Add tasks and refine list">
            <TodoInput
              onAdd={(payload) => {
                // Hook currently supports only title; ignore dueDate for now
                const title = typeof payload === "string" ? payload : payload?.title;
                if (title) addTodo(title);
              }}
            />
            <Filters
              filter={filter}
              onChangeFilter={setFilter}
              search={search}
              onChangeSearch={setSearch}
            />
          </section>

          {/* Tasks Panel (Ocean surface card) */}
          <section className="panel card" aria-label="Task list">
            <TodoList
              items={tasks}
              onToggle={toggleTodo}
              onUpdate={updateTodo}
              onDelete={deleteTodo}
            />
            <div className="list-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={clearCompleted}
                aria-label="Clear completed tasks"
                title="Clear completed tasks"
              >
                Clear Completed
              </button>
            </div>
          </section>
        </main>

        <footer className="app-footer" role="contentinfo">
          <span className="App-link" aria-label="Ocean Professional theme applied">
            Ocean Professional theme
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;
