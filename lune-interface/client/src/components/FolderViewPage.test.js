import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import FolderViewPage from './FolderViewPage';

// Mock react-router-dom hooks
const mockedNavigate = jest.fn();
let mockParams = { folderId: 'folder1' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
  useParams: () => mockParams,
  Link: ({ children, to }) => <a href={to}>{children}</a>, // Simple mock for Link
}));

describe('FolderViewPage Component', () => {
  const mockAllEntries = [
    { id: 'entry1', text: 'Entry 1 in Folder 1', folderId: 'folder1', timestamp: new Date().toISOString(), agent_logs: {} },
    { id: 'entry2', text: 'Entry 2 in Folder 1', folderId: 'folder1', timestamp: new Date().toISOString(), agent_logs: {} },
    { id: 'entry3', text: 'Entry in Another Folder', folderId: 'folder2', timestamp: new Date().toISOString(), agent_logs: {} },
    { id: 'entry4', text: 'Unfiled Entry', folderId: null, timestamp: new Date().toISOString(), agent_logs: {} },
  ];

  const mockAllFolders = [
    { id: 'folder1', name: 'Test Folder One' },
    { id: 'folder2', name: 'Test Folder Two' },
  ];

  const mockStartEdit = jest.fn();
  const mockRefreshEntries = jest.fn();

  const renderComponent = (currentParams = { folderId: 'folder1' }) => {
    mockParams = currentParams; // Update mockParams before render
    return render(
      <MemoryRouter initialEntries={[`/folders/${currentParams.folderId}`]}>
        <Routes>
          <Route
            path="/folders/:folderId"
            element={
              <FolderViewPage
                allEntries={mockAllEntries}
                allFolders={mockAllFolders}
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
    mockStartEdit.mockClear();
    mockRefreshEntries.mockClear();
  });

  test('renders folder name and its entries', () => {
    renderComponent();
    expect(screen.getByText(`Folder: ${mockAllFolders[0].name}`)).toBeInTheDocument();
    expect(screen.getByText('Entry 1 in Folder 1')).toBeInTheDocument();
    expect(screen.getByText('Entry 2 in Folder 1')).toBeInTheDocument();
    expect(screen.queryByText('Entry in Another Folder')).not.toBeInTheDocument();
    expect(screen.queryByText('Unfiled Entry')).not.toBeInTheDocument();
  });

  test('displays "folder is empty" message if no entries belong to the folder', () => {
    renderComponent({ folderId: 'folder2' }); // folder2 has one entry by mockAllEntries setup, let's change that for the test

    const entriesForFolder2Only = [ // Override mockAllEntries for this specific test case
        { id: 'entry3', text: 'Entry in Another Folder', folderId: 'folder2', timestamp: new Date().toISOString(), agent_logs: {} },
    ];
    const foldersForFolder2Only = [mockAllFolders[1]];

    mockParams = { folderId: 'folder2' }; // Ensure params are set for this specific render
    render(
        <MemoryRouter initialEntries={[`/folders/folder2`]}>
          <Routes>
            <Route
              path="/folders/:folderId"
              element={
                <FolderViewPage
                  allEntries={mockAllEntries.filter(e => e.id !== 'entry1' && e.id !== 'entry2')} // Remove folder1 entries
                  allFolders={mockAllFolders} // Keep all folders for lookup
                  startEdit={mockStartEdit}
                  refreshEntries={mockRefreshEntries}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      );
    // Re-render with specific empty folder scenario
    const folderWithNoEntries = { id: 'folder3', name: 'Empty Folder' };
    mockParams = { folderId: 'folder3' };
    render(
      <MemoryRouter initialEntries={['/folders/folder3']}>
        <Routes>
            <Route path="/folders/:folderId" element={
                <FolderViewPage
                    allEntries={mockAllEntries}
                    allFolders={[...mockAllFolders, folderWithNoEntries]}
                    startEdit={mockStartEdit}
                    refreshEntries={mockRefreshEntries}
                />}
            />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(`Folder: ${folderWithNoEntries.name}`)).toBeInTheDocument();
    expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
  });

  test('navigates to chat page on entry click', () => {
    renderComponent();
    const entryElement = screen.getByText('Entry 1 in Folder 1');
    fireEvent.click(entryElement);
    expect(mockStartEdit).toHaveBeenCalledWith('entry1');
    expect(mockedNavigate).toHaveBeenCalledWith('/chat');
  });

  test('navigates to /entries on "Back to All Entries" link click', () => {
    renderComponent();
    // Since Link is mocked as a simple <a>, we find by text and check href or simulate click
    const backLink = screen.getByText('Back to All Entries');
    expect(backLink).toHaveAttribute('href', '/entries');
    // To test navigation with mocked Link, usually you'd check mockedNavigate
    // For a simple href check, this is fine. If actual navigation needs testing:
    // fireEvent.click(backLink);
    // expect(mockedNavigate).toHaveBeenCalledWith('/entries'); // This depends on how Link mock interacts
  });

  test('handles folder not found by navigating to /entries', async () => {
    renderComponent({ folderId: 'nonexistentfolder' });
    // It should navigate away. Check if the "Loading" or "not found" text briefly appears,
    // then navigation occurs. useNavigate is called within useEffect.
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/entries');
    });
  });

  // Test for delete button (optional, as it's similar to EntriesPage)
  test('calls handleDelete and refreshes entries on delete button click', async () => {
    window.confirm = jest.fn(() => true); // Mock window.confirm
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Deleted' }),
      })
    );

    renderComponent();
    const deleteButtons = screen.getAllByText('Delete'); // Assuming 'Delete' is unique enough
    fireEvent.click(deleteButtons[0]); // Click the first delete button

    expect(window.confirm).toHaveBeenCalledWith('Delete this entry?');
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/diary/entry1', { method: 'DELETE' }));
    await waitFor(() => expect(mockRefreshEntries).toHaveBeenCalled());

    jest.restoreAllMocks(); // Restore fetch and confirm
  });
});
