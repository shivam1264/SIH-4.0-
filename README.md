# SIGHT-EXAM AI — Full Stack Accessible Examination Portal
> **Empowering PwD Candidates (Visually Impaired & Blind) with Real-Time AI Narration, Speech Controls & Autonomous Administration**

---

## 🌟 Tech Stack Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Canvas Confetti
- **Backend**: Node.js + Express + TypeScript + JWT Authentication + BCrypt + Persistent JSON Data Engine
- **Accessibility**: Web Speech API (TTS & Speech Recognition), high-contrast themes, screen-reader audio cues

---

## 🚀 Quick Start Instructions

### 🌟 One-Click All-in-One Launch (Frontend + Backend + Whisper Server)
In the project root (`SIH-4.0-`), run:
```bat
.\start_server.bat
```
*(Or in PowerShell: `.\start_server.ps1` or `npm run start:all`)*

This automatically launches all three services in separate, dedicated terminal windows:
1. **Backend API**: `http://localhost:5000`
2. **Whisper Voice Server**: `ws://localhost:8765/ws/voice`
3. **Frontend Application**: `http://localhost:5173`

To stop all three services at once, run:
```bat
.\stop_servers.bat
```

---

### Manual / Individual Component Start

#### 1. Run the Express Backend Server
In the project root, run:
```bash
npm run server
```
Or directly from the `server/` directory:
```bash
cd server
npm install
npm run dev
```
The backend will launch on **`http://localhost:5000`** with live auto-reload via `tsx`.
- Health Check: `http://localhost:5000/api/health`

#### 2. Run the Whisper Voice Recognition Server
From the `whisper_server/` directory:
```bash
cd whisper_server
.\start_server.bat
```
The Whisper WebSocket service will launch on **`ws://localhost:8765`**.

#### 3. Run the React Frontend Application
In a separate terminal at the project root:
```bash
npm run dev
```
The frontend will launch on **`http://localhost:5173`**.

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Access / Features |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@sightexamai.in` | `admin123` | Full administrative control: Students, Exams, AI Question Generator, Pronunciation Rules, Analytics, Emergency Audio Broadcasts |
| **Student (PwD)** | `aryan@example.com` | `student123` | Voice-controlled exam interface, personalized accommodations, screen reader optimization |

---

## 📡 Backend REST API Endpoints (`http://localhost:5000/api`)

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **System** | `/health` | `GET` | Health check & uptime |
| **Auth** | `/auth/login` | `POST` | Authenticate user & issue JWT bearer token |
| **Auth** | `/auth/register` | `POST` | Register student or admin |
| **Auth** | `/auth/me` | `GET` | Retrieve authenticated user profile |
| **Students** | `/students` | `GET`, `POST` | View and create PwD student registrations |
| **Students** | `/students/:id` | `GET`, `PUT`, `DELETE` | Manage student profile & accommodations |
| **Exams** | `/exams` | `GET`, `POST` | List accessible exams & create new tests |
| **Exams** | `/exams/:id` | `GET`, `DELETE` | Retrieve exam details & questions |
| **Exams** | `/exams/:id/submit` | `POST` | Submit attempt & compute real-time scores |
| **Question Bank** | `/questions` | `GET`, `POST` | Retrieve and add questions to official bank |
| **Question Bank** | `/questions/bulk` | `POST` | Bulk import questions |
| **AI Generator** | `/ai/generate-questions` | `POST` | Generate accessible questions with phonetic text |
| **Curriculum** | `/subjects` | `GET`, `POST` | Curriculum subjects and topics |
| **Attempts** | `/attempts` | `GET`, `POST` | Candidate attempt logs and speech audit trail |
| **Analytics** | `/analytics/overview` | `GET` | Overview metrics and impairment distribution |
| **Accessibility**| `/accessibility/rules` | `GET`, `POST` | Math/Logic phonetic pronunciation rules |
| **Notifications**| `/notifications` | `GET`, `POST` | Broadcast announcements & emergency voice alerts |

---

## 🛡️ Key Features
1. **Zero-Config Persistent Storage**: Uses a write-through JSON database in `server/src/data/store.json` seeded with initial data. No external DB or Docker setup needed.
2. **Resilient Offline Fallback**: If the backend is temporarily offline, the frontend's unified API client (`src/services/api.ts`) gracefully falls back to local data.
3. **Phonetic Audio Previews**: AI questions generate speech-ready phonetic text so mathematical symbols and constitutional citations sound clear on all screen readers.
4. **Automated PwD Accommodations**: Extra compensatory time (1.5x / 2.0x), high-contrast modes, and speech rate tuning are managed per student.

---

## 🔑 Environment Configuration (`server/.env`)

SIGHT-EXAM AI works out-of-the-box with built-in curriculum templates. To enable **live dynamic question generation** with Google Gemini 1.5 Flash:

1. Open `server/.env` in your editor.
2. Add your free Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   *(Get your free key at [Google AI Studio](https://aistudio.google.com/app/apikey))*
3. Save the file and restart the backend server (`npm run server:dev` or `npm run dev`).
4. In the **Admin Dashboard** under **AI Curriculum & Question Generator**, the status badge will automatically turn **🟢 Live Google Gemini API Active**.

