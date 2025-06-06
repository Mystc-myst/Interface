import React, { useState } from 'react';

export default function LuneChatModal({ open, onClose, entries }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    try {
      await fetch('/api/lune/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: messages })
      });
    } catch (e) {
      console.error('Failed to log conversation', e);
    }
    onClose();
  };

  if (!open) return null;

  // --- Polling Logic ---
  const startPollingForResponse = async (currentMessages) => {
    const POLLING_INTERVAL = 3000; // 3 seconds
    const MAX_POLLS = 10; // 10 polls for a total of 30 seconds

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));

      try {
        const pollRes = await fetch('/api/lune/get_n8n_response');

        if (!pollRes.ok) {
          console.error(`Polling failed with status: ${pollRes.status}`);
          // Optionally, if it's a server error, break or show specific message
          if (pollRes.status >= 500) {
            setMessages([...currentMessages, { sender: 'lune', text: 'Error fetching Lune\'s response due to server issue.' }]);
            setLoading(false);
            return;
          }
          continue; // Try next poll for client-side or recoverable errors
        }

        const pollData = await pollRes.json();

        if (pollData.message && pollData.message.trim() !== '') {
          setMessages([...currentMessages, { sender: 'lune', text: pollData.message }]);
          setLoading(false);
          return; // Exit polling
        }
      } catch (pollError) {
        console.error('Polling fetch error:', pollError);
        setMessages([...currentMessages, { sender: 'lune', text: 'Error fetching Lune\'s response.' }]);
        setLoading(false);
        return; // Exit polling on fetch error
      }

      // If loop finishes without a message
      if (i === MAX_POLLS - 1) {
        setMessages([...currentMessages, { sender: 'lune', text: 'Sorry, Lune did not respond in time.' }]);
        setLoading(false);
        return;
      }
    }
  };
  // --- End Polling Logic ---

  // Handle sending a message to the backend
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/lune/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries, // assuming 'entries' is available in this scope
          conversation: [userMessage] // Send only the latest user message for context to n8n if that's the design
                                    // Or pass 'newMessages' if n8n expects the whole conversation history up to this point
        }),
      });

      if (!res.ok) { // Check if response status is 202 (Accepted) or similar success
        // Handle non-2xx responses from /api/lune/send
        const errorData = await res.json().catch(() => ({})); // Try to parse error, default to empty object
        console.error('Failed to send message to server:', res.status, errorData.error);
        setMessages([...newMessages, { sender: 'lune', text: `Sorry, failed to send your message. ${errorData.error || ''}`.trim() }]);
        setLoading(false);
        return;
      }

      // If /api/lune/send is successful (e.g., 202 Accepted), start polling
      startPollingForResponse(newMessages);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...newMessages, { sender: 'lune', text: 'Sorry, failed to send your message to the server.' }]);
      setLoading(false);
    }
    // setLoading(false) is now handled by startPollingForResponse or in error cases above
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-animaPink backdrop-blur-md transition-opacity duration-700 ease-in-out ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 border-l-[1px] border-zinc-700/60 transition-all duration-700 ease-in-out transform ${open ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 translate-y-10 translate-x-10'}`}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-xl text-lunePurple font-literata">Chat with Lune</h2>
          <button onClick={handleClose} className="text-lunePurple font-bold text-2xl">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto mb-4 space-y-2 max-h-80 border rounded p-2 bg-luneGray/30 ring-1 ring-slate-800 shadow-inner bg-[#0d0d0f]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'text-left bg-zinc-800/70 rounded-lg p-3 shadow-inner text-[#f8f8f2]'
                  : 'italic bg-zinc-700/60 border border-indigo-800/20 backdrop-blur text-indigo-200 rounded-lg p-3 shadow-inner'
              }`}
            >
              <span className="block text-xs">{msg.sender === 'user' ? 'You' : 'Lune'}</span>
              {msg.text}
            </div>
          ))}
          {loading && <div className="text-luneGray">Lune is thinking…</div>}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded p-2 ring-1 ring-slate-800 shadow-inner bg-[#0d0d0f] text-[#f8f8f2]"
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
