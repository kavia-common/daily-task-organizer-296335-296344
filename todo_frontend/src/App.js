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
  /** Main app component wiring hooks to UI components. */
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
          <section className="panel card">
            <TodoInput
              onAdd={(title) => {
                // Hook currently supports only title; ignore dueDate for now
                addTodo(title);
              }}
            />
            <Filters
              filter={filter}
              onChangeFilter={setFilter}
              search={search}
              onChangeSearch={setSearch}
            />
          </section>

          <section className="panel card">
            <TodoList items={tasks} onToggle={toggleTodo} onUpdate={updateTodo} onDelete={deleteTodo} />
            <div className="list-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={clearCompleted}
                aria-label="Clear completed tasks"
                title="Clear completed"
              >
                Clear Completed
              </button>
            </div>
          </section>
        </main>

        <footer className="app-footer" role="contentinfo">
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
