import { useEffect } from 'react';

/**
 * Custom hook for handling global keyboard shortcuts.
 * @param {Object} targetIds - An object mapping shortcut keys to element IDs for general shortcuts.
 *                             Example: { n: 'add-folder-button', b: 'back-to-chat-button' }
 * @param {Function} onActivate - Callback function for the special Ctrl/Cmd+Enter shortcut on initiation view.
 * @param {boolean} isInitiationViewActive - Flag to determine if the initiation view specific shortcut should be active.
 */
const useKeyboardShortcuts = (targetIds = {}, onActivate = null, isInitiationViewActive = false) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Handle initiation view shortcut FIRST if active
      if (isInitiationViewActive && onActivate && (event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        onActivate();
        return; // Shortcut handled, no need to check others
      }

      // If initiation view shortcut was handled or not active, proceed with other shortcuts
      // but only if not on initiation view (to prevent 'n' or 'b' from firing there)
      if (isInitiationViewActive) {
        return;
      }

      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.isContentEditable);

      if (isTyping) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === 'n' && targetIds.n) {
        event.preventDefault();
        const addFolderBtn = document.getElementById(targetIds.n);
        if (addFolderBtn) {
          addFolderBtn.click();
          addFolderBtn.focus();
        } else {
          console.warn(`Button with id "${targetIds.n}" not found for 'n' shortcut.`);
        }
      } else if (key === 'b' && targetIds.b) {
        event.preventDefault();
        const backToChatBtn = document.getElementById(targetIds.b);
        if (backToChatBtn) {
          backToChatBtn.click();
          // backToChatBtn.focus(); // Optional: focus after click
        } else {
          console.warn(`Button with id "${targetIds.b}" not found for 'b' shortcut.`);
        }
      }
      // 'Delete' and 'Backspace' are handled by the focused components themselves (FolderChip, EntryCard)
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [targetIds, onActivate, isInitiationViewActive]); // Add new dependencies
};

export default useKeyboardShortcuts;
