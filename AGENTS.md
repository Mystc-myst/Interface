# Agent Instructions

This document provides guidance for AI agents working with this codebase.

## Project Overview

This repository contains two main components:

1.  **Offline Diary App**: A minimal, browser-based diary application located in the `offline-diary/` directory. It uses the File System Access API to work offline without a backend.
2.  **Lune Interface**: A client-server application located in `lune-interface/`. It consists of a React frontend and an Express backend that provides more advanced features, including agent-based processing of diary entries.

## File Structure

-   `.github/`: Contains GitHub Actions workflows for CI/CD.
-   `docs/`: Contains documentation. `key_application_flow.md` is particularly important for understanding the agent data flow.
-   `lune-interface/`: The main application directory.
    -   `client/`: The React frontend.
        -   `src/components/`: Contains the React components. `DiaryEditable.js` is the main component for diary entries.
    -   `server/`: The Express backend.
        -   `controllers/`: Contains the application logic.
        -   `routes/`: Defines the API endpoints.
        -   `diaryStore.js`: Manages access to the diary data via Sequelize.
        -   `server.js`: The main entry point for the server.
-   `offline-diary/`: The simple offline diary application and its data.
    -   `diary.sqlite`: The SQLite database for the diary entries.
    -   `chatlogs/`: Contains logs of conversations with the agent.
-   `setup.sh`: A script to set up the development environment.

## Application Flow

The key application flow for the Lune interface is as follows:

1.  **User Entry**: The user writes a diary entry in the `DiaryEditable` React component.
2.  **Backend Submission**: The entry is sent to the backend. The `diaryStore.js` module, using Sequelize, saves the entry to the `offline-diary/diary.sqlite` database. It also processes any `[[tags]]` in the entry.
3.  **Agent Processing**: A sequence of agents (Resistor → Interpreter → Forge → Lune) processes the entry. Each agent reads from and writes to the database. The final output from the "Lune" agent is stored in `agent_logs.Lune.reflection`.
4.  **Context Management**: All data access is centralized through `diaryStore.js`, which manages the database models.

## How to Run the Application

To run the Lune interface:

1.  Run `./setup.sh` to install dependencies for both the client and server.
2.  Create a `.env` file in `lune-interface/server/` by copying `.env.example`. Fill in the required environment variables.
3.  Start the server: `cd lune-interface/server && npm start`
4.  In a separate terminal, start the client: `cd lune-interface/client && npm start`

To enable the chat functionality, you may need to uncomment the Lune API route in `lune-interface/server/server.js`.
