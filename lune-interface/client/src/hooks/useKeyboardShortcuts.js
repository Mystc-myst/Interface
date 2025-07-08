import { useEffect } from 'react';

/**
 * Custom hook for handling global keyboard shortcuts.
 * @param {Object} shortcuts - An object where keys are shortcut keys (e.g., 'n', 'b')
 *                             and values are callback functions to execute.
 * @param {Array<string>} targetIds - An object mapping shortcut keys to element IDs.
 *                                    Example: { n: 'add-folder-button', b: 'back-to-chat-button' }
 */
const useKeyboardShortcuts = (targetIds = {}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
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
  }, [targetIds]); // Re-run effect if targetIds change, though typically they won't.
};

export default useKeyboardShortcuts;
