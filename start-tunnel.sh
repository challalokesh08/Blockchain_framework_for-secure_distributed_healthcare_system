#!/bin/bash
# start-tunnel.sh — Run backend + ngrok tunnel for cross-network mobile testing
# Usage: bash start-tunnel.sh [port]
# Requires: ngrok installed (brew install ngrok)

PORT=${1:-4000}

echo "=== HealthLedger Tunnel Setup ==="
echo ""

# Check ngrok is installed
if ! command -v ngrok &>/dev/null; then
  echo "ngrok not found. Install it: brew install ngrok"
  exit 1
fi

# Check ngrok auth
if ! ngrok config check &>/dev/null; then
  echo "ngrok not authenticated."
  echo "1. Sign up free at https://dashboard.ngrok.com/signup"
  echo "2. Get your token at https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "3. Run: ngrok config add-authtoken YOUR_TOKEN"
  exit 1
fi

# Start backend server in background
echo "Starting backend on port $PORT..."
cd "$(dirname "$0")/server" || exit 1
PORT=$PORT node index.js &
SERVER_PID=$!
sleep 2

# Start ngrok tunnel
echo "Starting ngrok tunnel to port $PORT..."
ngrok http $PORT --log=stdout &
NGROK_PID=$!
sleep 3

# Get public URL
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "========================================="
echo "  Backend API: $PUBLIC_URL"
echo "========================================="
echo ""
echo "Update mobile/src/api.js:"
echo "  export const API_BASE = '${PUBLIC_URL}/api';"
echo ""
echo "Press Ctrl+C to stop both server and tunnel."

# Cleanup on exit
trap "kill $SERVER_PID $NGROK_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
