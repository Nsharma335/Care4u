# Care4U – Family Caregiver Web App MVP

A comprehensive web application to support family caregivers of older adults with medication management, activity tracking, and care coordination.

## Features

- **Admin Dashboard**: Manage candidates and family members, view medication adherence statistics
- **Caregiver Portal**: Track daily medication schedules, wellness check-ins, and activity logs
- **Candidate Dashboard**: Accessible interface with voice features and medication reminders
- **Family Member Portal**: Stay updated on loved ones' care and medication adherence
- **AI-Powered Onboarding**: Chat-based prescription processing using OpenAI
- **Medication Reminders**: Automated notifications with voice alerts
- **Medication Calendar**: Visual adherence tracking

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with magic links
- **AI**: OpenAI GPT-4 Vision for prescription processing
- **Storage**: Supabase Storage for prescription files

## Project Structure

```
Care4u/
├── frontend/          # React frontend application
├── backend/           # Express backend server
├── shared/            # Shared TypeScript types
└── supabase/          # Database migrations
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository and install dependencies:

```bash
npm run install:all
```

2. Set up environment variables:

**Backend** (`backend/.env`):
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=http://localhost:5173
PORT=8000
```

**Frontend** (`frontend/.env`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

3. Run database migrations:

```bash
# Use Supabase CLI or MCP to run migrations from supabase/migrations/
```

4. Build shared types:

```bash
cd shared && npm run build
```

### Development

Run both frontend and backend concurrently:

```bash
npm run dev
```

Or run individually:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Database Schema

### Core Tables

- `institute_admins` - Institute administrators
- `candidates` - Older adults receiving care
- `family_members` - Family members and caregivers
- `caregivers` - Dedicated caregivers
- `medication_schedules` - Medication schedules
- `medication_logs` - Medication tracking logs
- `prescriptions` - Uploaded prescription files
- `notifications` - In-app notifications
- `activity_logs` - Care activity feed
- `wellness_checkins` - Caregiver wellness tracking
- `chat_messages` - Chat history

## User Roles

1. **Institute Admin**: Manages candidates and registers family members
2. **Candidate**: Person receiving care (accessible dashboard)
3. **Family Member**: Gets updates on candidate's care
4. **Caregiver**: Assists with daily tasks and medications (can also be a family member)

## Key Features Implementation

### Magic Link Authentication
- Passwordless login using Supabase Auth
- Automatic email delivery for new family members
- Role-based access control

### AI Prescription Processing
- Upload prescription images or PDFs
- OpenAI GPT-4 Vision extracts medication details
- Automatic schedule generation

### Medication Reminders
- Cron-based reminder service
- Voice alerts using Web Speech API
- In-app notification system
- Real-time status tracking

### Accessibility Features (Candidate Dashboard)
- Adjustable font sizes (14px - 28px)
- High contrast mode
- Voice navigation and readout
- Large, touch-friendly interface

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel
```

### Backend (Vercel or Render)

For Vercel:
```bash
cd backend
vercel
```

For Render:
- Connect your repository
- Set build command: `npm install && npm run build`
- Set start command: `npm start`
- Add environment variables

### Database (Supabase)
- Database and auth are hosted on Supabase
- Run migrations via Supabase dashboard or CLI
- Configure RLS policies as defined in migrations

## API Documentation

### Authentication
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/auth/me` - Get current user profile

### Admin
- `GET /api/admin/candidates` - List all candidates
- `POST /api/admin/candidates` - Create candidate
- `POST /api/admin/family-members` - Register family member

### Medications
- `GET /api/medications/schedule/:candidateId` - Get medication schedule
- `GET /api/medications/logs/:candidateId` - Get medication logs
- `POST /api/medications/confirm` - Confirm medication taken
- `GET /api/medications/notifications` - Get active notifications

### Caregiver
- `GET /api/caregiver/candidates` - Get assigned candidates
- `POST /api/caregiver/wellness` - Submit wellness check-in
- `POST /api/caregiver/activity-log` - Add activity note

### Chat
- `POST /api/chat/process-prescription` - Process prescription upload
- `POST /api/chat/save-schedule` - Save extracted medication schedule

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For support, please contact the development team.

