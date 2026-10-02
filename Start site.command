#!/bin/bash
# Double-click to run the wedding site locally (sample household "Sam & Alex").
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  echo "First run: installing packages (takes a minute)..."
  npm install || { echo "npm install failed"; read -n 1; exit 1; }
fi
(sleep 3 && open "http://localhost:5173/wedding/?h=sample") &
npm run dev
