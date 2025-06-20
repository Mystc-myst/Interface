import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function LuneChatModal({ open, onClose }) {
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

  // Polling logic removed - n8n now replies directly to /send

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
          sessionId: 'test-session-1',
          userMessage: userMessage.text
        }),
      });
      // n8n replies in this HTTP response; it cannot push messages separately

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to send message to server:', res.status, errorData.error);
        setMessages([...newMessages, { sender: 'lune', text: `Sorry, failed to send your message. ${errorData.error || ''}`.trim() }]);
      } else {
        const { aiReply } = await res.json();
        let messageText;
        if (typeof aiReply === 'object' && aiReply !== null) {
          if (Object.prototype.hasOwnProperty.call(aiReply, 'output')) {
            messageText = aiReply.output;
          } else {
            console.warn("Unexpected AI response structure:", aiReply);
            messageText = "Error: Received unexpected response format from AI.";
          }
        } else {
          messageText = aiReply;
        }
        setMessages([...newMessages, { sender: 'lune', text: messageText }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...newMessages, { sender: 'lune', text: 'Sorry, something went wrong. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
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
          {loading && (
            <div className="flex items-center text-luneGray">
              <div className="w-4 h-4 mr-2 border-2 border-lunePurple border-t-transparent rounded-full animate-spin"></div>
              Lune is thinking…
            </div>
          )}
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

LuneChatModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
