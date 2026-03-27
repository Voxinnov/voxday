# VOXDAY Integrated Project

A unified platform combining **VOXTREE** (Project Management) and **Smart Daybook** (Financial & Task Management).

## Project Structure

- `VOXTREE/`: Core Project Management suite (Frontend & Backend).
- `SmartDaybook/`:
  - `backend/`: Financial & Task API (Node.js/Express).
  - `app/`: Cross-platform Mobile Application (Flutter).
  - `web-app/`: Original standalone web interface.

## Prerequisites

- Node.js (v18+)
- MySQL Database
- Flutter SDK (for mobile app)

## Setup Instructions

### 1. Database Setup
- Create a database named `smart_daybook`.
- Import the schema from `SmartDaybook/backend/config/schema.sql` (if available) or run migrations.

### 2. Smart Daybook Backend
```bash
cd SmartDaybook/backend
npm install
# Configure .env
npm start
```

### 3. VOXTREE Web Application
```bash
cd VOXTREE/frontend
npm install
npm run dev
```

### 4. Smart Daybook Mobile App
```bash
cd SmartDaybook/app
flutter pub get
flutter run
```

## Deployment

The project is designed to run with VOXTREE as the main shell, proxying or linking to Smart Daybook services for a unified experience.
