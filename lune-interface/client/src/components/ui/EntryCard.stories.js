import React from 'react';
import EntryCard from './EntryCard';
// Import motion.css to ensure animations are applied in Storybook
import '../../styles/motion.css';

export default {
  title: 'Components/UI/EntryCard',
  component: EntryCard,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Title of the diary entry' },
    snippet: { control: 'text', description: 'A short snippet of the entry content' },
    date: { control: 'text', description: 'Date of the entry' },
    onClick: { action: 'clicked', description: 'Handler for card click' },
    onDelete: { action: 'deleted', description: 'Handler for delete icon click' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '340px', margin: '20px' }}> {/* Max-width similar to a column in the feed */}
        <Story />
      </div>
    ),
  ],
};

export const Default = {
  args: {
    title: 'A Wonderful Day',
    snippet: 'Today was filled with joy and sunshine. We went to the park and had a lovely picnic. The birds were singing and the flowers were in full bloom.',
    date: 'October 26, 2023',
    onDelete: () => alert('Delete triggered!'), // Provide a dummy handler for story
  },
};

export const ShortContent = {
  args: {
    title: 'Quick Note',
    snippet: 'Remember to buy milk.',
    date: 'October 27, 2023',
    onDelete: () => alert('Delete triggered!'),
  },
};

export const LongTitleAndSnippet = {
  args: {
    title: 'Reflections on the Ephemeral Nature of Time and the Universe',
    snippet: 'It is a curious thing, time. It marches ever onward, unyielding, yet our perception of it shifts like desert sands. Sometimes moments stretch into eternities, and other times years slip by in what feels like a fleeting breath. This contemplation leads one to ponder the vastness of the cosmos and our small, yet significant, place within it all.',
    date: 'November 15, 2023',
    onDelete: () => alert('Delete triggered!'),
  },
};

export const NoDeleteAction = {
  args: {
    title: 'Read Only Entry',
    snippet: 'This entry cannot be deleted from the UI here.',
    date: 'October 28, 2023',
    // onDelete is not provided
  },
};

export const MinimalContent = {
  args: {
    title: '...',
    snippet: '...',
    date: 'Jan 1, 2024',
    onDelete: () => alert('Delete triggered!'),
  },
};
