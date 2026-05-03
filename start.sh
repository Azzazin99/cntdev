#!/bin/bash
# Script to start a local static server for the project

PORT=${PORT:-6395}
URL="http://localhost:$PORT"

echo "=================================================="
echo "   🚀 Starting Local Server for CNT Clone"
echo "=================================================="
echo "📂 Project Path: $(pwd)"
echo "🌍 Server URL:   $URL"
echo ""
echo "✅ Features unlocked:"
echo "   - Download Images (No security block)"
echo "   - Download Zip"
echo "   - Smooth Gallery Loading"
echo "=================================================="

# Try to open the browser (macOS/Linux support)
if which open > /dev/null; then
  sleep 1 && open "$URL" &
elif which xdg-open > /dev/null; then
  sleep 1 && xdg-open "$URL" &
fi

# Run Custom Python Server (API Support)
python3 server.py
