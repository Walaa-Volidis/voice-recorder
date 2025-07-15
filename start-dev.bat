@echo off
echo 🎤 Voice Recorder - Starting Development Environment
echo ==================================================

echo 📊 Checking MySQL connection...
docker ps | findstr voice-recorder-mysql >nul
if %errorlevel% neq 0 (
    echo 🚀 Starting MySQL database...
    docker-compose up -d mysql
    echo ⏳ Waiting for database to be ready...
    timeout /t 10 /nobreak >nul
)

echo 🚀 Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run start:dev"
cd ..

echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 🚀 Starting frontend server...
cd frontend
start "Frontend Server" cmd /k "npm run dev"
cd ..

echo.
echo ✅ Voice Recorder is starting up!
echo =================================
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:3001
echo 📚 API Docs: http://localhost:3001/api
echo 🗄️ Database: MySQL on port 3306
echo.
echo Services are starting in separate windows...
echo Close the terminal windows to stop the services.
echo.
pause
