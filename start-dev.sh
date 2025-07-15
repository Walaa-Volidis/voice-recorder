#!/bin/bash

# Voice Recorder - Development Startup Script

echo "🎤 Voice Recorder - Starting Development Environment"
echo "=================================================="

# Check if MySQL is running
echo "📊 Checking MySQL connection..."
if ! docker ps | grep -q voice-recorder-mysql; then
    echo "🚀 Starting MySQL database..."
    docker-compose up -d mysql
    echo "⏳ Waiting for database to be ready..."
    sleep 10
fi

# Start backend
echo "🚀 Starting backend server..."
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 5

# Start frontend
echo "🚀 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Voice Recorder is starting up!"
echo "================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📚 API Docs: http://localhost:3001/api"
echo "🗄️ Database: MySQL on port 3306"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user to stop
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
