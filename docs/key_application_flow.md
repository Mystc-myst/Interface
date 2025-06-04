# Key Application Flow

This document outlines the current flow for diary entries and agent processing.

1. **User entry** – Diary entries are written in the React component `DiaryEditable`.
2. **Backend submission** – Entries are posted to the backend where they are handled by the controller and written to `server/diary.json` via the file-based store `diaryStore.js`.
   The store extracts any `[[tags]]` from the text and categorizes them into fields, states or loops.
3. **Agent processing** – A chain of agents (Resistor → Interpreter → Forge → Lune) operates directly on `diary.json`. Each agent reads the entry and previous logs, writes its own output under `agent_logs`, and never alters other data.
4. **Context management** – All contextual data flows through `diaryStore.js`, allowing expansion into features like the Knowledge Dock or additional agent pipelines without using a database.

The intent is to keep the pipeline modular so future agents can reference and update diary entries or derived outputs while maintaining history.
