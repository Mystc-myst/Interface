import React from 'react';
import { log } from '../lib/logger';
import EntryCard from './ui/EntryCard';
import './DiaryFeed.css';

// Placeholder data - in a real app, this would come from state/props
const placeholderEntries = [
  {
    id: 'e1',
    title: 'First Day Musings',
    snippet: 'The journey of a thousand miles begins with a single step. Today, I took that step into a new adventure...',
    date: 'October 20, 2023',
    tags: [],
  },
  {
    id: 'e2',
    title: 'A Walk in the Park',
    snippet: 'The autumn leaves were vibrant, painting the park in hues of gold and crimson. A gentle breeze rustled through the trees.',
    date: 'October 22, 2023',
    tags: [],
  },
  {
    id: 'e3',
    title: 'Recipe for Success',
    snippet: 'Found an amazing recipe for sourdough bread. The key is patience and a good starter. Can\'t wait to try it this weekend!',
    date: 'October 24, 2023',
    tags: [],
  },
  {
    id: 'e4',
    title: 'Stargazing Night',
    snippet: 'The sky was incredibly clear tonight. Saw Mars and the Pleiades cluster. It felt like looking into infinity.',
    date: 'October 25, 2023',
    tags: [],
  },
];

const DiaryFeed = ({ entries = placeholderEntries, onEntryClick, onEntryDelete, onTagClick }) => {
  const handleEntryClick = (entryId) => {
    if (onEntryClick) {
      onEntryClick(entryId);
    } else {
      // Placeholder navigation for spec: "click routes to /entries/:id via 300ms slide-right"
      // Actual routing and animation would depend on the app's routing/animation libraries.
      log(`Navigating to /entries/${entryId}`);
      // Simulate navigation delay for slide animation perception
      setTimeout(() => {
        window.location.href = `/entries/${entryId}`; // Simple redirect for now
      }, 300);
    }
  };

  const handleEntryDelete = (entryId) => {
    // Placeholder for delete confirmation: "opens a confirm popover"
    if (window.confirm('Are you sure you want to delete this entry?')) {
      if (onEntryDelete) {
        onEntryDelete(entryId);
      } else {
        log(`Deleting entry: ${entryId}`);
        // In a real app, update state to remove the entry
      }
    }
  };

  if (!entries || entries.length === 0) {
    return <p className="diary-feed-empty">No entries yet. Start writing!</p>;
  }

  return (
    <div className="diary-feed-container" role="list" aria-label="Diary entries">
      {entries.map(entry => (
        <EntryCard
          key={entry.id}
          title={entry.title}
          snippet={entry.snippet}
          date={entry.date}
          tags={entry.tags}
          onTagClick={onTagClick}
          onClick={() => handleEntryClick(entry.id)}
          onDelete={() => handleEntryDelete(entry.id)}
          // EntryCard already has role="listitem"
        />
      ))}
    </div>
  );
};

export default DiaryFeed;
