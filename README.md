# Voice Recorder - Full Stack Application

A modern, full-stack voice recording application built with Next.js (React) frontend and NestJS backend, featuring real-time WebSocket communication and chunked audio upload.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **Voice Recording**: Browser-based audio recording with real-time chunked upload
- **Real-time Updates**: WebSocket integration for live progress updates
- **Audio Playback**: Stream and play back recorded audio files
- **Dashboard**: User-friendly interface showing recordings, stats, and controls
- **Responsive Design**: Modern UI that works on desktop and mobile devices

## Tech Stack

### Backend

- **Framework**: NestJS (Node.js)
- **Database**: MySQL with TypeORM
- **Authentication**: JWT with Passport.js
- **Real-time**: WebSocket with Socket.IO
- **File Upload**: Multer for handling audio chunks
- **API Documentation**: Swagger/OpenAPI

### Frontend

- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Audio Recording**: Web Audio API with MediaRecorder

## Project Structure

```
voice-recorder/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── recordings/     # Recording management
│   │   ├── config/         # Database configuration
│   │   └── main.ts         # Application entry point
│   ├── Dockerfile          # Backend container configuration
│   └── package.json
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js app directory
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utility functions and services
│   ├── Dockerfile          # Frontend container configuration
│   └── package.json
└── docker-compose.yml      # Docker orchestration
```

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd voice-recorder
   ```

2. **Start the application**

   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api

### Option 2: Manual Setup

#### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

#### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials:

   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=root
   DB_NAME=voice_db
   JWT_SECRET=your-secret-key
   FRONTEND_URL=http://localhost:3000
   ```

4. **Create database**

   ```sql
   CREATE DATABASE voice_db;
   ```

5. **Start the backend**
   ```bash
   npm run start:dev
   ```

#### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
   ```

4. **Start the frontend**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Recordings

- `GET /recordings` - Get user's recordings
- `POST /recordings` - Create new recording
- `POST /recordings/:id/chunks` - Upload audio chunk
- `GET /recordings/:id/stream` - Stream audio file
- `DELETE /recordings/:id` - Delete recording
- `GET /recordings/stats` - Get user statistics

### WebSocket Events

- `chunk_uploaded` - Chunk upload progress
- `recording_completed` - Recording completion
- `recording_deleted` - Recording deletion

## Database Schema

### Users Table

- `id` (Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `firstName`, `lastName`
- `createdAt`, `updatedAt`

### Recordings Table

- `id` (Primary Key)
- `userId` (Foreign Key)
- `title`, `description`
- `duration`, `status`
- `audioFormat`
- `totalChunks`, `uploadedChunks`
- `createdAt`, `updatedAt`

### Audio Chunks Table

- `id` (Primary Key)
- `recordingId` (Foreign Key)
- `chunkOrder`, `chunkData`
- `chunkSize`, `mimeType`
- `createdAt`

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Record Audio**: Click "New Recording" and follow the prompts
3. **View Recordings**: See all your recordings with playback controls
4. **Monitor Progress**: Real-time updates during recording and upload
5. **Manage Recordings**: Delete recordings you no longer need

## Development

### Backend Development

```bash
cd backend
npm run start:dev    # Development with hot reload
npm run test         # Run tests
npm run lint         # Lint code
```

### Frontend Development

```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Lint code
```

## Production Deployment

1. **Update environment variables** for production
2. **Build and deploy** using Docker:
   ```bash
   docker-compose -f docker-compose.yml up --build -d
   ```

## Security Considerations

- JWT tokens for authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- File upload restrictions
- Environment variable protection
