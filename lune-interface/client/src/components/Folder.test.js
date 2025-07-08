import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Folder from './Folder';

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Folder Component', () => {
  const mockFolderData = {
    id: 'folder123',
    name: 'My Test Folder',
    entries: ['entry1', 'entry2'], // Array of entry IDs
  };
  const mockOnDropEntry = jest.fn();

  beforeEach(() => {
    // Clear mock call history before each test
    mockedNavigate.mockClear();
    mockOnDropEntry.mockClear();
  });

  test('renders folder name and entry count', () => {
    render(
      <MemoryRouter>
        <Folder folder={mockFolderData} onDropEntry={mockOnDropEntry} />
      </MemoryRouter>
    );

    expect(screen.getByText(mockFolderData.name)).toBeInTheDocument();
    expect(screen.getByText(`(${mockFolderData.entries.length})`)).toBeInTheDocument();
  });

  test('navigates to folder view on click', () => {
    render(
      <MemoryRouter>
        <Folder folder={mockFolderData} onDropEntry={mockOnDropEntry} />
      </MemoryRouter>
    );

    const folderElement = screen.getByText(mockFolderData.name).closest('div');
    fireEvent.click(folderElement);

    expect(mockedNavigate).toHaveBeenCalledWith(`/folders/${mockFolderData.id}`);
  });

  test('displays correct entry count for zero entries', () => {
    const folderWithNoEntries = { ...mockFolderData, entries: [] };
    render(
      <MemoryRouter>
        <Folder folder={folderWithNoEntries} onDropEntry={mockOnDropEntry} />
      </MemoryRouter>
    );
    expect(screen.getByText('(0)')).toBeInTheDocument();
  });

  // Drag and drop is harder to test with precision without more complex setup
  // but we can check if the handlers are present or try a basic fireEvent if needed.
  // For now, focusing on rendering and navigation.

  test('has correct title attribute', () => {
    render(
      <MemoryRouter>
        <Folder folder={mockFolderData} onDropEntry={mockOnDropEntry} />
      </MemoryRouter>
    );
    const folderElement = screen.getByText(mockFolderData.name).closest('div');
    expect(folderElement).toHaveAttribute(
      'title',
      `Open folder: ${mockFolderData.name} (${mockFolderData.entries.length} entries)`
    );
  });
});
