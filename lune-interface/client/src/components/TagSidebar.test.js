import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TagSidebar from './TagSidebar';

function Wrapper() {
  const [filter, setFilter] = useState(null);
  const entries = [
    { id: '1', text: 'First', tags: ['foo'] },
    { id: '2', text: 'Second', tags: ['bar'] }
  ];
  const tagIndex = { foo: ['1'], bar: ['2'] };
  const visible = filter ? entries.filter(e => e.tags.includes(filter)) : entries;
  return (
    <div>
      <TagSidebar tagIndex={tagIndex} onSelect={setFilter} />
      <ul>
        {visible.map(e => <li key={e.id}>{e.text}</li>)}
      </ul>
    </div>
  );
}

test('clicking a tag filters visible entries', () => {
  render(<Wrapper />);
  expect(screen.getByText('First')).toBeInTheDocument();
  expect(screen.getByText('Second')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /#foo \(1\)/i }));
  expect(screen.getByText('First')).toBeInTheDocument();
  expect(screen.queryByText('Second')).toBeNull();
});
