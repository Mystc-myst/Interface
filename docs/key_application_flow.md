# Key Application Flow

This document outlines the current flow for diary entries and agent processing.

1. **User entry** – Diary entries are written in the React component `DiaryEditable`.
2. **Backend submission** – Entries are posted to the backend where they are handled by the controller and stored in the SQLite database `offline-diary/diary.sqlite` through the Sequelize models exposed by `diaryStore.js`.
   The store extracts any `[[tags]]` from the text and categorizes them into fields, states or loops.
3. **Agent processing** – A chain of agents (Resistor → Interpreter → Forge → Lune) reads from and writes to the database via these Sequelize models. Each agent stores its output under `agent_logs`, and Lune saves its response in `agent_logs.Lune.reflection`.
4. **Context management** – All contextual data flows through `diaryStore.js`, which manages the Sequelize models backed by `offline-diary/diary.sqlite`. This centralizes data access for features like the Knowledge Dock or additional agent pipelines.

The intent is to keep the pipeline modular so future agents can reference and update diary entries or derived outputs while maintaining history.
