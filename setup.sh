#!/usr/bin/env bash
# Setup script for Lune Interface
# Installs dependencies for both the server and the client
# Usage: ./setup.sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT_DIR/lune-interface/server"
echo "Installing server dependencies..."
npm cache clean --force
npm install

cd "$ROOT_DIR/lune-interface/client"
echo "Installing client dependencies..."
npm cache clean --force
npm install

cat <<'EOM'

Setup complete. Before starting the application, ensure you edit 'lune-interface/server/.env' with your OpenAI API key and any other configuration values.

To launch the development servers, run:
  (1) cd lune-interface/server && npm start
  (2) cd lune-interface/client && npm start

If you encounter any issues during or after setup, please also:
  - Ensure you have a stable internet connection.
  - Check for sufficient disk space.
  - Verify write permissions for project directories and npm's global cache directory.
  - Consider updating Node.js and npm to their latest stable versions if problems persist.
EOM

