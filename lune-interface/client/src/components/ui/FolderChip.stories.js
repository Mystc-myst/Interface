import React from 'react';
import FolderChip from './FolderChip';

export default {
  title: 'Components/UI/FolderChip',
  component: FolderChip,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Name of the folder',
    },
    count: {
      control: 'number',
      description: 'Number of entries in the folder',
    },
    onClick: { action: 'clicked', description: 'Single click handler' },
    onDoubleClick: { action: 'doubleClicked', description: 'Double click handler' },
    onLongPress: { action: 'longPressed', description: 'Long press handler (600ms)' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export const Default = {
  args: {
    name: 'Notes',
    count: 12,
  },
};

export const LongName = {
  args: {
    name: 'Very Long Folder Name That Should Truncate',
    count: 5,
  },
};

export const ZeroCount = {
  args: {
    name: 'Empty',
    count: 0,
  },
};

export const ManyEntries = {
  args: {
    name: 'Archive',
    count: 999,
  },
};

// Example to test interactions in Storybook
export const InteractiveChip = (args) => <FolderChip {...args} />;
InteractiveChip.args = {
  name: 'Interact',
  count: 7,
  onClick: () => alert('Single Clicked!'),
  onDoubleClick: () => alert('Double Clicked!'),
  onLongPress: () => alert('Long Pressed!'),
};
