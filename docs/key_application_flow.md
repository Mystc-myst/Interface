# Key Application Flow

This document outlines the current flow for diary entries and agent processing.

1. **User entry** – Diary entries are written in the React component `DiaryEditable`.
2. **Backend submission** – Entries are posted to the backend where they are handled by the controller `server/controllers/lune.js` and stored using the `DiaryEntry` model.
3. **Agent processing** – Agents like **Lune** (and future helpers) can read or manipulate saved entries through these controllers and models.
4. **Context management** – All contextual data flows through the existing models such as `DiaryEntry.js`, allowing expansion into features like the Knowledge Dock or additional agent pipelines.

The intent is to keep the pipeline modular so future agents can reference and update `DiaryEntry` documents or derived outputs while maintaining history.
