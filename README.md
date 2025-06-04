# Offline Diary App

This repository focuses on a minimal diary located in `offline-diary/`.
The app works entirely in the browser using the File System Access API so it can
function offline with no backend server or agent logic required. The previous
server-side agent routes remain in the repository but are commented out so the
diary can run fully offline.

## Browser Support

This app requires a browser with File System Access API support, such as Chrome or Edge, running in a secure context (HTTPS or localhost).

## Usage
1. Open `offline-diary/index.html` in a modern browser (e.g. Chrome).
2. Click **Open Diary** to select an existing `diary.json` file or **Create Diary** to make a new one.
3. Write entries in the text box and click **Save Entry**.
4. Existing entries appear below with Edit and Delete options. All changes are saved directly to `diary.json`.
5. Use the search box to filter entries.
6. Your draft text is automatically saved locally until you save the entry.
7. Enter a password before opening or creating a diary to encrypt the file.
8. Use **Export** to download a CSV copy and **Import** to merge entries from another JSON file.

Entries are stored as an array of objects with `id`, `text` and `timestamp`.

### Repository cleanup

Large dependencies such as `node_modules` and the archived `lune-interface.zip`
have been removed and are ignored via `.gitignore` to keep the project small and
focused on the offline diary.
