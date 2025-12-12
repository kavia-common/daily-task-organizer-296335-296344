import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App UI', () => {
  test('renders header, empty state, and disabled Add button initially', () => {
    render(<App />);

    // Header contains text 'Daily Task Organizer'
    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();
    expect(within(banner).getByRole('heading', { name: /daily task organizer/i })).toBeInTheDocument();

    // Initial empty state text is present
    expect(
      screen.getByText(/No tasks to show\. Add your first task above!/i)
    ).toBeInTheDocument();

    // "Add" button exists and is disabled when input is empty
    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  test('allows adding a task and hides empty state', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Input is labelled by "Add a task"
    const input = screen.getByLabelText(/add a task/i);
    expect(input).toBeInTheDocument();

    // Type 'Buy milk' and click Add
    await user.type(input, 'Buy milk');

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeEnabled();

    await user.click(addButton);

    // New task appears in the list
    expect(screen.getByText(/buy milk/i)).toBeInTheDocument();

    // Empty state disappears
    expect(
      screen.queryByText(/No tasks to show\. Add your first task above!/i)
    ).not.toBeInTheDocument();
  });
});
