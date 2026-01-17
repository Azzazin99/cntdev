#!/bin/bash

# Navigate to the script location
cd "$(dirname "$0")"

# Open the Browser
open http://localhost:8000/admin.html

# Start the Server
echo "Starting Admin Server..."
echo "Close this window to stop the server."
python3 admin_server.py
