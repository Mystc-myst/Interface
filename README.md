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

## React Client and Server

The original React front‑end and Express backend live in `lune-interface/`.
After running `./setup.sh` to install dependencies you can start them with:

```bash
cd lune-interface/server && npm start
# in a separate terminal
cd lune-interface/client && npm start
```

Before starting the server, copy `lune-interface/server/.env.example` to
`lune-interface/server/.env` and fill in the required values for
`MONGO_URI`, `OPENAI_API_KEY`, `N8N_WEBHOOK_URL` and `PORT`.

The client is configured to proxy API requests to `http://localhost:5001`.
To enable conversations with Lune uncomment the line enabling the route in
`lune-interface/server/server.js`:

```js
// app.use('/api/lune', luneRoutes);
```

Once enabled the React app shows a **Chat with Lune** button. Messages are
sent to `/api/lune/send` and the conversation history is written under
`offline-diary/chatlogs/`.
The webhook payload now only includes `{ sessionId, userMessage }` for clarity and security.

The chat modal now shows a spinner while waiting for Lune's reply. After
around 8&nbsp;seconds a friendly notice appears informing the user that the
request may take a moment. If no response arrives within 30&nbsp;seconds the
modal displays a timeout message and re-enables the input so the user can
retry.

All chat replies are returned in the HTTP response to `/api/lune/send`.
n8n cannot push updates to the app. The n8n webhook URL should be stored in an
environment variable.

## Lune Interface Details

### Color System

*(Placeholder for Color System table)*

### 🌓 Theme System — Light & Dark Modes

| Mode  | Background spec | Primary text | Liquid-Glass Base | Liquid-Gold Action |
|-------|-----------------|--------------|-------------------|--------------------|
| Dark  | Violet-Deep → Ink-Black radial (see Gradient) | Moon-Mist | rgba(91,46,255,.12) | #F3B43F → #E79E30 |
| Light | Solid Parchment `#F6F1E7` | Ink-Black | rgba(0,0,0,.06)  | Desert-Gold `#C79A3B → #B68A2A` |

> *Rationale:* Dark mode invites inward depth; Light mode offers airy clarity for daytime reflection.

### Radial Gradient

*(Placeholder for Radial Gradient description)*

**Light fallback:** in light theme the background is a flat `#F6F1E7` to minimise visual noise; no gradient needed.

## Developer Notes

### 🌗 Theme Toggle

Lune observes the user’s OS preference (`prefers-color-scheme`) at first load and stores overrides in `localStorage`.
Toggle component: a small 🌙/☀️ pill at bottom-right using the `.btn-glass` class.
Key custom-props live in `:root[data-theme="dark"| "light"]`; see `lune-interface/client/src/index.css`.

- Run Lighthouse in **both** themes; maintain contrast ≥ 4.5 : 1 and a11y ≥ 95.
- If `prefers-reduced-transparency` is true, blur effects are disabled in both modes.

## Generative-Principles

*(Placeholder for Generative-Principles table)*

| Principle         | Description                                                                                                |
|-------------------|------------------------------------------------------------------------------------------------------------|
| Phase Entrainment | ... (other bullets) <br> - Theme fades respect circadian rhythm: dark evokes night introspection, light evokes dawn clarity. |
| ...               | ...                                                                                                        |
