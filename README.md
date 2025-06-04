# Offline Diary App

This repository includes a minimal diary application located in `offline-diary/`.
The app works entirely in the browser using the File System Access API so it can
function offline without a backend server or agent.

## Usage

1. Open `offline-diary/index.html` in a modern browser (e.g. Chrome).
2. Click **Open Diary** to select an existing `diary.json` file or **Create Diary** to
   make a new one.
3. Write entries in the text box and click **Save Entry**.
4. Existing entries appear below with Edit and Delete options. All changes are
   saved directly to `diary.json`.

Entries are stored as an array of objects with `id`, `text` and `timestamp`.
