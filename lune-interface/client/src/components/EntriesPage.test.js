import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import EntriesPage from './EntriesPage';
// DO NOT mock useKeyboardShortcuts, we want to test its effect.
// jest.mock('../hooks/useKeyboardShortcuts', () => jest.fn());

// Mock child components to simplify testing EntriesPage logic
// and to control props like onSetHighlight
let mockSetHighlightFunction;
jest.mock('./DiaryFeed', () => ({ entries, onEntryClick, highlightedEntryId, onSetHighlight }) => {
  mockSetHighlightFunction = onSetHighlight; // Capture the onSetHighlight function
  return (
    <div role="list" aria-label="Diary entries">
      {entries.map(entry => (
        <div
          key={entry.id}
          className="entry-card" // Mocked EntryCard
          onClick={() => onEntryClick(entry.id)}
          onFocus={() => onSetHighlight(entry.id)} // Simulate EntryCard calling onSetHighlight
          tabIndex={0} // Make it focusable
          data-testid={`entry-${entry.id}`}
          aria-current={highlightedEntryId === entry.id ? "true" : undefined}
        >
          {entry.title}
        </div>
      ))}
    </div>
  );
});

jest.mock('./FoldersRibbon', () => ({ folders }) => (
  <div role="tablist" aria-label="Folder categories">
    {folders.map(folder => <div key={folder.id}>{folder.name}</div>)}
  </div>
));

// Mock CSS imports
jest.mock('./ui/PrimaryButton.css', () => ({}));
jest.mock('./ui/BackToChatButton.css', () => ({}));
// jest.mock('./ui/FolderChip.css', () => ({})); // FoldersRibbon is mocked
// jest.mock('./ui/EntryCard.css', () => ({})); // DiaryFeed is mocked
// jest.mock('./FoldersRibbon.css', () => ({})); // FoldersRibbon is mocked
// jest.mock('./DiaryFeed.css', () => ({})); // DiaryFeed is mocked
jest.mock('./EntriesPage.css', () => ({}));
jest.mock('../styles/motion.css', () => ({}));


expect.extend(toHaveNoViolations);

describe('EntriesPage', () => {
  const mockInitialEntries = [
    { id: 'e1', title: 'Entry 1', snippet: 'Snippet 1', date: 'Date 1' },
    { id: 'e2', title: 'Entry 2', snippet: 'Snippet 2', date: 'Date 2' },
  ];
  const mockInitialFolders = [
    { id: 'f1', name: 'Folder 1', count: 1 },
  ];

  let mockRefreshEntries;

  beforeEach(() => {
    mockRefreshEntries = jest.fn();
    global.confirm = jest.fn(() => true);
    global.prompt = jest.fn(() => 'New Folder Name');
    // global.alert = jest.fn(); // Alert is not used in current EntriesPage version for navigation

    // Mock window.location.href for navigation checks
    delete window.location;
    window.location = { href: '' };

    // Reset captured function from mock
    mockSetHighlightFunction = undefined;
  });

  test('renders correctly and has no a11y violations on initial load', async () => {
    const { container } = render(
      <EntriesPage initialEntries={mockInitialEntries} initialFolders={mockInitialFolders} />
    );

    expect(screen.getByRole('heading', { name: /Entries/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Folder \+/i })).toHaveAttribute('id', 'add-folder-button');
    expect(screen.getByRole('tablist', { name: /Folder categories/i })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /Diary entries/i })).toBeInTheDocument();
    expect(screen.getByText(mockInitialEntries[0].title)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to Chat/i })).toHaveAttribute('id', 'back-to-chat-button');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('Keyboard Shortcuts', () => {
    test('Pressing "n" triggers add folder prompt', () => {
      render(<EntriesPage initialEntries={mockInitialEntries} initialFolders={mockInitialFolders} />);
      fireEvent.keyDown(document, { key: 'n' });
      expect(global.prompt).toHaveBeenCalledWith('Enter new folder name:');
    });

    test('Pressing "b" navigates back to chat', () => {
      render(<EntriesPage initialEntries={mockInitialEntries} initialFolders={mockInitialFolders} />);
      fireEvent.keyDown(document, { key: 'b' });
      // The component clicks the button, which calls handleBackToChat, which navigates.
      expect(window.location.href).toBe('/chat');
    });

    test('Pressing "Delete" deletes the highlighted entry', async () => {
      render(
        <EntriesPage
          initialEntries={mockInitialEntries}
          initialFolders={mockInitialFolders}
          refreshEntries={mockRefreshEntries}
        />
      );

      // Step 1: Highlight an entry. Simulate focus on the mock EntryCard.
      // The mock DiaryFeed calls onSetHighlight (which is EntriesPage.setHighlightedEntryId) on focus.
      const entryToHighlight = screen.getByTestId('entry-e1');
      expect(entryToHighlight).toBeInTheDocument();

      // Act is needed here if focusing causes state updates that React needs to process
      await act(async () => {
        fireEvent.focus(entryToHighlight);
      });

      // Check that the mock onSetHighlight was called (indirectly testing state update)
      // This requires mockSetHighlightFunction to be captured correctly by the DiaryFeed mock.
      // A more direct test would be to check if the entry card has aria-current="true".
      expect(entryToHighlight).toHaveAttribute('aria-current', 'true');


      // Step 2: Press Delete key
      fireEvent.keyDown(document, { key: 'Delete' });

      // Check confirmation was called
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete entry: "Entry 1"?');

      // Check entry is removed from UI (since we are not relying on external refresh for this test)
      expect(screen.queryByText('Entry 1')).not.toBeInTheDocument();
      expect(screen.getByText('Entry 2')).toBeInTheDocument(); // Ensure other entries remain

      // Check refreshEntries was called (if applicable)
      expect(mockRefreshEntries).toHaveBeenCalled();

      // Check a11y after DOM change
      const { container } = render( // Re-render or get container from previous if possible
        <EntriesPage
          initialEntries={mockInitialEntries.filter(e => e.id !== 'e1')} // Updated entries
          initialFolders={mockInitialFolders}
          refreshEntries={mockRefreshEntries}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Pressing "Delete" does nothing if no entry is highlighted', () => {
      render(
        <EntriesPage
          initialEntries={mockInitialEntries}
          initialFolders={mockInitialFolders}
          refreshEntries={mockRefreshEntries}
        />
      );
      fireEvent.keyDown(document, { key: 'Delete' });
      expect(global.confirm).not.toHaveBeenCalled();
      expect(screen.getByText('Entry 1')).toBeInTheDocument(); // Entries remain
      expect(mockRefreshEntries).not.toHaveBeenCalled();
    });
  });

  // Previous tests for button clicks and page slide animation can remain,
  // just ensure they are compatible with the non-mocked useKeyboardShortcuts
  // and updated component structure.
  test('handles "Add Folder" button click via direct click', () => {
    const mockSetAppFolders = jest.fn();
    render(<EntriesPage initialEntries={mockInitialEntries} initialFolders={mockInitialFolders} setAppFolders={mockSetAppFolders} />);
    const addFolderButton = screen.getByRole('button', { name: /Add Folder \+/i });
    fireEvent.click(addFolderButton);
    expect(global.prompt).toHaveBeenCalledWith('Enter new folder name:');
    // If prompt returns a name, setAppFolders should be called
    expect(mockSetAppFolders).toHaveBeenCalledWith(expect.any(Function)); // or expect.anything() if more specific
  });

  test('handles entry card click and page slide animation', async () => {
    const { container } = render(<EntriesPage initialEntries={mockInitialEntries} initialFolders={mockInitialFolders} />);
    // Use the mock DiaryFeed's structure to find the card
    const entryCard = screen.getByTestId(`entry-${mockInitialEntries[0].id}`);
    expect(entryCard).toBeInTheDocument();

    const pageWrapper = container.firstChild;
    expect(pageWrapper).not.toHaveClass('slide-out-active');

    fireEvent.click(entryCard); // Simulate click on the mock EntryCard
    expect(pageWrapper).toHaveClass('slide-out-active');

    // Fast-forward timers for the setTimeout in handleEntryCardClick
    // jest.useFakeTimers(); // Should be at the top of describe or test if used
    // await act(async () => { jest.advanceTimersByTime(300); });
    // jest.useRealTimers(); // Clean up
    // For simplicity, as setTimeout is not critical to test here beyond page slide,
    // we'll rely on the class change and mock navigation.
    // The navigation is now direct:
    expect(window.location.href).toBe(`/entries/${mockInitialEntries[0].id}`);
  });

  test('handles "Back to Chat" button click via direct click', () => {
    render(<EntriesPage initialEntries={mockInitialEntries} initialFolders={mockInitialFolders} />);
    const backToChatButton = screen.getByRole('button', { name: /Back to Chat/i });
    fireEvent.click(backToChatButton);
    expect(window.location.href).toBe('/chat');
  });

});
