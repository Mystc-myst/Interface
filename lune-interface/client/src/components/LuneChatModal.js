// Import React hooks and PropTypes for type checking.
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { logToLune, sendToLune } from '../api/luneApi';

// LuneChatModal component: Provides a modal interface for users to chat with the "Lune" AI.
export default function LuneChatModal({ open, onClose }) {
  // State for storing the history of messages in the current chat session.
  // Each message is an object like { sender: 'user'/'lune', text: '...' }.
  const [messages, setMessages] = useState([]);
  // State for the current text input by the user.
  const [input, setInput] = useState('');
  // State to indicate if a response from the AI is currently being loaded.
  const [loading, setLoading] = useState(false);

  // Handles closing the chat modal.
  // Before closing, it attempts to log the current conversation to the backend.
  const handleClose = async () => {
    try {
      // API call to log the conversation.
      await logToLune({ conversation: messages });
    } catch (e) {
      console.error('Failed to log conversation with Lune:', e);
    }
    onClose(); // Call the onClose prop function (provided by App.js) to hide the modal.
  };

  // If the modal is not supposed to be open, render nothing.
  if (!open) return null;

  // Handles sending a user's message to the backend and receiving the AI's reply.
  const handleSend = async () => {
    if (!input.trim()) return; // Do nothing if input is empty or whitespace.

    // Create the user's message object and add it to the messages state.
    const userMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput(''); // Clear the input field.
    setLoading(true); // Set loading state to true.

    try {
      // API call to send the user's message to the Lune AI backend.
      const response = await sendToLune({
        sessionId: 'test-session-1', // Session ID, currently hardcoded.
        userMessage: userMessage.text // The text of the user's message.
      });

      // The AI's reply is expected directly in this HTTP response.
      const { aiReply } = response.data;
      let messageText;
      // Check if aiReply is an object and has an 'output' property (common pattern for some AI services).
      if (typeof aiReply === 'object' && aiReply !== null) {
        if (Object.prototype.hasOwnProperty.call(aiReply, 'output')) {
          messageText = aiReply.output;
        } else {
          // If structure is unexpected, log a warning and show an error.
          console.warn("Unexpected AI response structure from Lune:", aiReply);
          messageText = "Error: Received unexpected response format from AI.";
        }
      } else {
        // If aiReply is a direct string or other primitive, use it as is.
        messageText = aiReply;
      }
      // Add AI's reply to the messages state.
      setMessages([...newMessages, { sender: 'lune', text: messageText }]);
    } catch (error) {
      // Catch any network or other errors during the fetch operation.
      console.error('Error sending message to Lune:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Sorry, something went wrong. Please try again later.';
      setMessages([...newMessages, { sender: 'lune', text: errorMessage }]);
    } finally {
      setLoading(false); // Reset loading state regardless of success or failure.
    }
  };

  // JSX for rendering the modal.
  return (
    // Modal container: fixed position, covers screen, flex centered.
    // Uses conditional classes for open/close transition effects.
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-animaPink backdrop-blur-md transition-opacity duration-700 ease-in-out ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Modal content box: styled with rounded corners, shadow, gradient background. */}
      <div className={`rounded-2xl shadow-xl max-w-lg w-full p-6 flex flex-col bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 border-l-[1px] border-zinc-700/60 transition-all duration-700 ease-in-out transform ${open ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 translate-y-10 translate-x-10'}`}>
        {/* Modal header with title and close button. */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-xl text-lunePurple font-literata font-light">Chat with Lune</h2>
          <button onClick={handleClose} className="text-lunePurple font-bold text-2xl">&times;</button>
        </div>
        {/* Message display area: scrollable, styled. */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-2 max-h-80 border rounded p-2 bg-luneGray/30 ring-1 ring-slate-800 shadow-inner bg-[#0d0d0f] no-scrollbar">
          {messages.map((msg, i) => (
            // Each message div, styled based on sender (user or lune).
            <div
              key={i} // Using index as key; consider unique IDs if messages can be reordered/deleted.
              className={`whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'text-left bg-zinc-800/70 rounded-lg p-3 shadow-inner text-[#f8f8f2]' // User message style.
                  : 'italic bg-zinc-700/60 border border-indigo-800/20 backdrop-blur text-indigo-200 rounded-lg p-3 shadow-inner' // Lune message style.
              }`}
            >
              <span className="block text-xs text-slate-300">{msg.sender === 'user' ? 'You' : 'Lune'}</span>
              {msg.text}
            </div>
          ))}
          {/* Loading indicator displayed while waiting for AI response. */}
          {loading && (
            <div className="flex items-center text-slate-300">
              <div className="w-4 h-4 mr-2 border-2 border-lunePurple border-t-transparent rounded-full animate-spin"></div>
              Lune is thinking…
            </div>
          )}
        </div>
        {/* Input area for typing messages. */}
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded p-2 ring-1 ring-slate-800 shadow-inner bg-[#0d0d0f] text-[#f8f8f2]"
            value={input}
            disabled={loading} // Disable input while loading.
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()} // Send on Enter key.
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            disabled={loading} // Disable button while loading.
            className="bg-lunePurple text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// PropTypes for type-checking the props passed to LuneChatModal.
LuneChatModal.propTypes = {
  open: PropTypes.bool.isRequired,    // Must be a boolean, controls modal visibility.
  onClose: PropTypes.func.isRequired, // Must be a function, called to close the modal.
};
