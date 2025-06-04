#!/usr/bin/env bash
# Setup script for Lune Interface
# Installs dependencies for both the server and the client
# Usage: ./setup.sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT_DIR/lune-interface/server"
echo "Installing server dependencies..."
npm install

cd "$ROOT_DIR/lune-interface/client"
echo "Installing client dependencies..."
npm install

cat <<'EOM'

Setup complete. Before starting the application, ensure you edit 'lune-interface/server/.env' with your OpenAI API key and any other configuration values.

To launch the development servers, run:
  (1) cd lune-interface/server && npm start
  (2) cd lune-interface/client && npm start
EOM

