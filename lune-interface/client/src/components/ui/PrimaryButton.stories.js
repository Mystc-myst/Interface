import React from 'react';
import PrimaryButton from './PrimaryButton';

export default {
  title: 'Components/UI/PrimaryButton',
  component: PrimaryButton,
  tags: ['autodocs'], // Enables automatic documentation generation
  argTypes: {
    children: {
      control: 'text',
      description: 'Button content (text or JSX elements)',
    },
    onClick: {
      action: 'clicked',
      description: 'Optional click handler',
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description: 'Button type attribute',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    }
  },
};

// Default story
export const Default = {
  args: {
    children: 'Click Me',
  },
};

// Story with custom text
export const AddFolder = {
  args: {
    children: 'Add Folder +',
  },
};

// Story for a disabled button
export const Disabled = {
  args: {
    children: 'Cannot Click',
    disabled: true,
  },
};

// Story to showcase with an icon (assuming icon would be passed as children)
export const WithIcon = {
  args: {
    children: (
      <>
        <span role="img" aria-label="icon" style={{ marginRight: '8px' }}>➕</span>
        Add Item
      </>
    ),
  },
};
