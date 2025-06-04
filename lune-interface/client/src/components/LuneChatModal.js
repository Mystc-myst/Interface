import React, { useState } from 'react';

export default function LuneChatModal({ open, onClose, entries }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  // Handle sending a message to the backend
  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/lune/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries,
          conversation: newMessages
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { sender: 'lune', text: data.reply }]);
    } catch {
      setMessages([...newMessages, { sender: 'lune', text: 'Sorry, Lune could not reply.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-xl text-lunePurple">Chat with Lune</h2>
          <button onClick={onClose} className="text-lunePurple font-bold text-2xl">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto mb-4 space-y-2 max-h-80 border rounded p-2 bg-luneGray/30">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap ${msg.sender === 'user' ? 'text-right text-lunePurple' : 'text-left text-luneGreen'}`}
            >
              <span className="block text-xs">{msg.sender === 'user' ? 'You' : 'Lune'}</span>
              {msg.text}
            </div>
          ))}
          {loading && <div className="text-luneGray">Lune is thinking…</div>}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded p-2"
            value={input}
            disabled={loading}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-lunePurple text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
