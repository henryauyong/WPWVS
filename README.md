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
