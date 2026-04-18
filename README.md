# WPWVS: Web Player With Vtt Subtitle

WPWVS is a modern, full-stack web media player designed to support VTT subtitles for music and video files. It features a folder-based management system, user authentication, and a responsive UI.

## 🚀 Features

- **Media Playback**: Support for various audio and video formats.
- **VTT Subtitle Support**: Automatically loads and displays VTT subtitles synchronized with your media.
- **Folder Navigation**: Browse your media library using a familiar directory structure.
- **User Authentication**: Secure JWT-based login system.
- **File Sync**: Automatically syncs your local media folder with the database.
- **Favorites**: Mark your favorite tracks for quick access.
- **Responsive Design**: Modern UI built with React and Tailwind CSS, optimized for both desktop and mobile.

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Pydantic v2

### Frontend
- **Framework**: React 19 with React Router 7
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📂 Project Structure

```text
WPWVS/
├── backend/                # FastAPI application
│   ├── app/                # Core logic, models, schemas, and API endpoints
│   ├── music/              # Default directory for media files
│   └── run.py              # Entry point for the backend
├── frontend/               # React Router application
│   ├── app/                # Components, routes, and contexts
│   └── public/             # Static assets
└── docker-compose.yml      # Docker orchestration
```

## 🚀 Deployment with Docker Compose

Follow these steps to deploy WPWVS using Docker:

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Environment Variables Configuration

You need to create `.env` files for both the backend and frontend.

#### **Backend (`backend/.env`)**
Create a file at `backend/.env` with the following content:
```env
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
```
*   `SECRET_KEY`: A long, random string used to sign JWT tokens.

#### **Frontend (`frontend/.env.production`)**
Create a file at `frontend/.env.production` with the following content:
```env
VITE_API_URL=http://localhost:8000
```
*   `VITE_API_URL`: The full URL where your backend API is accessible from the browser.

### 3. Configure Media Path
Open `docker-compose.yml` and update the volume mapping for the backend to point to your local music directory:

```yaml
services:
  backend:
    volumes:
      - ./backend/data:/app/data
      - /path/to/your/music:/app/music  # Change this to your music folder
      - ./backend/.env:/app/.env:ro
```

### 4. Start the Application
Run the following command from the project root:
```bash
docker compose up -d --build
```

The services will be available at:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
