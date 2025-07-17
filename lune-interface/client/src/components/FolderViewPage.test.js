import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';
import FolderViewPage from './FolderViewPage';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock react-router-dom hooks
const mockedNavigate = jest.fn();
let mockParams = { folderId: 'folder1' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
  useParams: () => mockParams,
  // Keep actual Link for navigation testing, but MemoryRouter will catch it.
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ message: 'Success' }),
  })
);
// Mock window.confirm
window.confirm = jest.fn(() => true);


describe('FolderViewPage Component', () => {
  const mockAllEntries = [
    { id: 'entry1', text: 'Entry 1 in Folder 1 content. This is a long entry to test snippet generation.', folderId: 'folder1', timestamp: new Date(2024, 0, 15).toISOString(), agent_logs: {} },
    { id: 'entry2', text: 'Entry 2 in Folder 1 content.', folderId: 'folder1', timestamp: new Date(2024, 0, 10).toISOString(), agent_logs: {} },
    { id: 'entry3', text: 'Entry in Another Folder', folderId: 'folder2', timestamp: new Date().toISOString(), agent_logs: {} },
  ];

  const mockAllFolders = [
    { id: 'folder1', name: 'Test Folder One' },
    { id: 'folder2', name: 'Test Folder Two' },
  ];

  let mockStartEdit;
  let mockRefreshEntries;

  const renderComponentWithRouter = (currentFolderId = 'folder1', entries = mockAllEntries, folders = mockAllFolders) => {
    mockParams = { folderId: currentFolderId };
    mockStartEdit = jest.fn();
    mockRefreshEntries = jest.fn();

    return render(
      <MemoryRouter initialEntries={[`/folders/${currentFolderId}`]}>
        <Routes>
          <Route
            path="/folders/:folderId"
            element={
              <FolderViewPage
                allEntries={entries}
                allFolders={folders}
                startEdit={mockStartEdit}
                refreshEntries={mockRefreshEntries}
              />
            }
          />
          <Route path="/entries" element={<div>All Entries Page</div>} />
          <Route path="/chat" element={<div>Chat Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    mockedNavigate.mockClear();
    jest.clearAllMocks(); // Clears fetch, confirm, and other mocks
    // Reset window.confirm to default true for most tests, can be overridden per test
    window.confirm = jest.fn(() => true);
    global.fetch.mockClear().mockImplementation(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Success' }),
        })
    );
  });

  test('renders folder name and its entries (titles/snippets)', async () => {
    renderComponentWithRouter();
    // Wait for fadeIn animation to complete if it affects element presence
    await waitFor(() => expect(screen.getByText(`Folder: ${mockAllFolders[0].name}`)).toBeVisible());

    expect(screen.getByText(`Folder: ${mockAllFolders[0].name}`)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  test('displays "folder is empty" message if no entries belong to the folder', async () => {
    const folderWithNoEntries = { id: 'folder3', name: 'Empty Folder' };
    renderComponentWithRouter('folder3', mockAllEntries, [...mockAllFolders, folderWithNoEntries]);
    await waitFor(() => expect(screen.getByText(`Folder: ${folderWithNoEntries.name}`)).toBeVisible());
    expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
  });

  test('navigates to chat page on entry card click', async () => {
    renderComponentWithRouter();
    const entryElement = (await screen.findAllByRole('listitem'))[0];
    fireEvent.click(entryElement);
    expect(mockStartEdit).toHaveBeenCalledWith('entry1');
    expect(mockedNavigate).toHaveBeenCalledWith('/chat');
  });

  test('navigates to /entries on "Back to All Entries" pill click', async () => {
    renderComponentWithRouter();
    await waitFor(() => expect(screen.getByLabelText('Back to all entries')).toBeVisible()); // Wait for fadeIn

    const backLink = screen.getByLabelText('Back to all entries');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/entries'); // It's a Link component

    // Use userEvent for more realistic click simulation
    await userEvent.click(backLink);

    // Check if navigation occurred to /entries.
    // Since we are using MemoryRouter, the URL change is internal.
    // We can verify by checking if the content of the /entries route is displayed.
    expect(screen.getByText('All Entries Page')).toBeInTheDocument();
    // Or, if useNavigate was called from within the Link's logic (less common for standard Link)
    // expect(mockedNavigate).toHaveBeenCalledWith('/entries');
  });


  test('handles folder not found by navigating to /entries', async () => {
    renderComponentWithRouter('nonexistentfolder');
    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith('/entries'));
  });

  describe('EntryCard actions menu', () => {
    test('reveals actions on three-dot menu click and calls remove/delete handlers', async () => {
      const user = userEvent.setup();
      renderComponentWithRouter('folder1');

      const entryCard = screen.getAllByRole('listitem')[0];
      expect(entryCard).toBeInTheDocument();

      // The menu button is initially hidden by CSS (opacity 0) until hover/focus
      // RTL doesn't fully simulate hover for CSS opacity changes well.
      // We can fire a mouseEnter event, or directly find the button if it's always in DOM.
      // Let's assume it's in DOM and try to click it.
      // If CSS truly hides it from events, this test might need adjustment or more complex hover simulation.

      // Option 1: Fire mouseEnter to trigger hover styles (if CSS is set up for it and RTL supports it well)
      // fireEvent.mouseEnter(entryCard);

      // Option 2: Find the menu button (it should be in the DOM, even if opacity is 0)
      // The button has aria-label="More actions"
      const menuButton = within(entryCard).getByRole('button', { name: /more actions/i });

      // Click the menu button. userEvent is better for this.
      await user.click(menuButton);

      // Check if menu items are visible
      const removeFromFolderButton = within(entryCard).getByRole('menuitem', { name: /remove from folder/i });
      const deleteEntryButton = within(entryCard).getByRole('menuitem', { name: /delete entry/i });
      expect(removeFromFolderButton).toBeVisible();
      expect(deleteEntryButton).toBeVisible();

      // Test "Remove from Folder"
      window.confirm.mockReturnValueOnce(true); // Ensure confirm returns true for this action
      await user.click(removeFromFolderButton);
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to remove this entry from the folder?');
      expect(global.fetch).toHaveBeenCalledWith('/diary/entry1/folder', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ folderId: null }),
      }));
      await waitFor(() => expect(mockRefreshEntries).toHaveBeenCalledTimes(1));

      // Re-open menu for next action (it closes after an action)
      await user.click(menuButton);
      const deleteEntryButtonAgain = within(entryCard).getByRole('menuitem', { name: /delete entry/i });

      // Test "Delete Entry"
      window.confirm.mockReturnValueOnce(true); // Ensure confirm returns true
      await user.click(deleteEntryButtonAgain);
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this entry permanently?');
      expect(global.fetch).toHaveBeenCalledWith('/diary/entry1', { method: 'DELETE' });
      await waitFor(() => expect(mockRefreshEntries).toHaveBeenCalledTimes(2)); // Called again
    });
  });

  // Jest-axe accessibility test
  test('should have no accessibility violations', async () => {
    const { container } = renderComponentWithRouter();
    // Wait for content to be fully rendered, especially after animations
    await waitFor(() => expect(screen.getByText(`Folder: ${mockAllFolders[0].name}`)).toBeVisible(), { timeout: 2000 });

    // Need to run axe within an act() block if there are state updates post-render affecting a11y
    let results;
    await act(async () => {
        results = await axe(container, { rules: { 'heading-order': { enabled: false }, 'aria-required-parent': { enabled: false } } });
    });
    expect(results).toHaveNoViolations();
  });
});

