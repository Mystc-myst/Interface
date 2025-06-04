# Key Application Flow

This document outlines the current flow for diary entries and agent processing.

1. **User entry** – Diary entries are written in the React component `DiaryEditable`.
2. **Backend submission** – Entries are posted to the backend where they are handled by the controller and written to `server/diary.json` via the file-based store `diaryStore.js`.
3. **Agent processing** – Agents like **Lune** (and future helpers) operate directly on this JSON file, updating their logs in place for each entry.
4. **Context management** – All contextual data flows through `diaryStore.js`, allowing expansion into features like the Knowledge Dock or additional agent pipelines without using a database.

The intent is to keep the pipeline modular so future agents can reference and update diary entries or derived outputs while maintaining history.
