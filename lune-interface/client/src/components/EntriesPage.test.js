import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import EntriesPage from './EntriesPage';

// Mock child components and hooks to isolate EntriesPage logic if needed,
// or allow them to render if their interactions are part of what's being tested.
// For now, let's allow them to render with their placeholder states.

jest.mock('./ui/PrimaryButton.css', () => ({}));
jest.mock('./ui/BackToChatButton.css', () => ({}));
jest.mock('./ui/FolderChip.css', () => ({}));
jest.mock('./ui/EntryCard.css', () => ({}));
jest.mock('./FoldersRibbon.css', () => ({}));
jest.mock('./DiaryFeed.css', () => ({}));
jest.mock('./EntriesPage.css', () => ({}));
jest.mock('../hooks/useKeyboardShortcuts', () => jest.fn()); // Mock the hook itself
jest.mock('../styles/motion.css', () => ({}));


expect.extend(toHaveNoViolations);

describe('EntriesPage', () => {
  const mockEntries = [
    { id: 'e1', title: 'Entry 1', snippet: 'Snippet 1', date: 'Date 1' },
  ];
  const mockFolders = [
    { id: 'f1', name: 'Folder 1', count: 1 },
  ];

  const mockUseKeyboardShortcuts = require('../hooks/useKeyboardShortcuts');

  beforeEach(() => {
    mockUseKeyboardShortcuts.mockClear();
     // Mock window.confirm for tests that might trigger it (e.g., folder/entry delete)
    global.confirm = jest.fn(() => true);
    // Mock window.prompt
    global.prompt = jest.fn(() => 'New Name');
     // Mock window.alert
    global.alert = jest.fn();
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
    });
  });

  test('renders header, folders ribbon, diary feed, and back button, and has no a11y violations', async () => {
    const { container } = render(
      <EntriesPage entries={mockEntries} folders={mockFolders} />
    );

    // Check for header elements
    expect(screen.getByRole('heading', { name: /Entries/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Folder \+/i })).toBeInTheDocument(); // This is the add-folder-button

    // Check for FoldersRibbon (presence of its role or a chip)
    expect(screen.getByRole('tablist', { name: /Folder categories/i })).toBeInTheDocument();
    expect(screen.getByText(mockFolders[0].name)).toBeInTheDocument();


    // Check for DiaryFeed (presence of its role or an entry)
    expect(screen.getByRole('list', { name: /Diary entries/i })).toBeInTheDocument();
    expect(screen.getByText(mockEntries[0].title)).toBeInTheDocument();

    // Check for BackToChatButton
    expect(screen.getByRole('button', { name: /Back to Chat/i })).toBeInTheDocument(); // This is the back-to-chat-button

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('initializes useKeyboardShortcuts with correct target IDs', () => {
    render(<EntriesPage entries={mockEntries} folders={mockFolders} />);
    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith({
      n: 'add-folder-button',
      b: 'back-to-chat-button',
    });
  });

  test('handles "Add Folder" button click', () => {
    render(<EntriesPage entries={mockEntries} folders={mockFolders} setFolders={jest.fn()} />);
    const addFolderButton = screen.getByRole('button', { name: /Add Folder \+/i });
    fireEvent.click(addFolderButton);
    expect(global.prompt).toHaveBeenCalledWith('Enter new folder name:');
    // Further tests could assert setFolders was called if prompt returns a value
  });

  test('handles entry card click and page slide animation', async () => {
    const { container } = render(<EntriesPage entries={mockEntries} folders={mockFolders} />);
    const entryCard = screen.getByText(mockEntries[0].title).closest('.entry-card'); // EntryCard has this class

    expect(entryCard).toBeInTheDocument();

    const pageWrapper = container.firstChild; // Assuming .entries-page-wrapper is the first child
    expect(pageWrapper).not.toHaveClass('slide-out-active');

    fireEvent.click(entryCard);

    expect(pageWrapper).toHaveClass('slide-out-active');

    // Fast-forward timers for the setTimeout in handleEntryCardClick
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    // Check if navigation was attempted (mocked to alert)
    expect(window.location.href).toBe(`/entries/${mockEntries[0].id}`);
  });

  test('handles "Back to Chat" button click', () => {
    render(<EntriesPage entries={mockEntries} folders={mockFolders} />);
    const backToChatButton = screen.getByRole('button', { name: /Back to Chat/i });
    fireEvent.click(backToChatButton);
    expect(global.alert).toHaveBeenCalledWith('Navigating back to chat...');
    expect(window.location.href).toBe('/chat');
  });

  // Note: Testing the actual effect of useKeyboardShortcuts (i.e., 'n' and 'b' key presses)
  // would require not mocking the hook and ensuring the buttons are rendered with the correct IDs.
  // The current test 'initializes useKeyboardShortcuts' verifies it's called correctly.
  // To test the full interaction:
  // 1. Don't mock useKeyboardShortcuts.
  // 2. Ensure EntriesPage renders PrimaryButton with id="add-folder-button" and BackToChatButton with id="back-to-chat-button".
  // 3. Dispatch keydown events for 'n' and 'b' on the document.
  // 4. Assert that the respective button click handlers (or mocked button.click()) were called.
  // This is more of an integration test for the hook and page.
});
