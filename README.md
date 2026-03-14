# Resume Intelligence AI - Frontend

A Next.js 16 application with React 19 for AI-powered resume analysis and optimization.

## Features

- **Authentication**: JWT-based auth with Spring Boot backend
- **Resume Upload**: PDF/DOCX upload with optional job description
- **AI Analysis**: 
  - ATS scoring
  - Skill matching
  - Experience assessment
  - Word quality analysis
  - Role prediction
  - Actionable feedback
- **Dashboard**: View all resumes with detailed score breakdowns
- **Responsive Design**: Modern UI built with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **State**: React Context API
- **HTTP Client**: Axios
- **Authentication**: JWT (stored in cookies via js-cookie)
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- Java backend running on `http://localhost:8080`

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
resume-frontend/
├── app/
│   ├── layout.tsx              # Root layout with AuthProvider
│   ├── page.tsx                # Landing page
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── register/
│   │   └── page.tsx            # Registration page
│   └── dashboard/
│       └── page.tsx            # Main dashboard (protected)
├── components/
│   ├── ResumeUploader.tsx      # File upload component
│   ├── ResumeCard.tsx          # Resume list item
│   └── ScoreDisplay.tsx        # AI score visualization
├── context/
│   └── AuthContext.tsx         # Authentication state management
├── hooks/
│   └── useProtectedRoute.ts    # Route protection hook
├── lib/
│   └── api.ts                  # Axios client + API methods
└── public/
```

## API Integration

The frontend communicates with the Spring Boot backend via Axios.

### Authentication Flow

1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Optional Google sign-in uses `/api/auth/google` with Google `idToken`
3. Backend returns JWT token
4. Token stored in cookie (7-day expiry)
5. Token automatically sent in `Authorization: Bearer <token>` header
6. On 401 error, token cleared and user redirected to login

### Resume Operations

- **Upload**: `POST /api/resumes/upload` (multipart/form-data)
- **Get All**: `GET /api/resumes`
- **Get One**: `GET /api/resumes/:id`

## Key Components

### AuthContext

Manages authentication state across the app:

```tsx
const { isAuthenticated, login, register, logout } = useAuth();
```

### useProtectedRoute

Hook to protect routes (redirects to login if not authenticated):

```tsx
const { isLoading } = useProtectedRoute();
```

### API Client

Centralized Axios instance with interceptors:

```tsx
import { authApi, resumeApi } from '@/lib/api';

// Login
const response = await authApi.login(email, password);

// Upload resume
const result = await resumeApi.upload(file, jobDescription);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Java backend URL | `http://localhost:8080` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID for GIS button on `/login` | Not set |

## Building for Production

```bash
npm run build
npm start
```

## Development Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## TypeScript Types

The frontend uses strong typing for all API responses:

```typescript
interface ResumeResponse {
  resumeId: number;
  fileName: string;
  blobUrl: string;
  uploadedAt: string;
  score: ResumeScore | null;
}

interface ResumeScore {
  overallScore: number;
  atsScore: number;
  skillScore: number;
  experienceScore: number;
  predictedRole: string;
  missingSkills: string[];
  skillsFound: string[];
  // ... more fields
}
```

## Design System

- **Colors**: Dark theme with gray-900/800 backgrounds
- **Accent**: Blue-500/600 primary, with purple/green for specific scores
- **Typography**: 
  - Custom font: `Rogbold` (var(--font-space-future))
  - System fonts: Geist Sans, Geist Mono
- **Components**: Rounded corners (lg/xl), backdrop blur, border highlights on hover

## Error Handling

- Form validation errors displayed inline
- API errors shown in toast-style alerts
- 401 errors trigger automatic logout + redirect
- Network errors caught and displayed with retry options

## Security

- JWT stored in httpOnly-compatible cookie
- Token automatically expires after 7 days
- CORS configured on backend (localhost:3000, localhost:8080)
- No sensitive data stored in localStorage

## Backend Integration

This frontend connects to:
- **Java Spring Boot API** (port 8080) - Authentication, resume storage, text extraction
- **Python ML Service** (port 8000) - AI scoring, skill extraction, semantic analysis

See backend documentation for setup instructions.

## Future Enhancements

- [ ] Resume comparison view
- [ ] Export analysis as PDF
- [ ] Dark/light theme toggle
- [ ] Bulk resume upload
- [ ] Resume versioning
- [ ] Email notifications for analysis complete

---

**Last Updated**: March 8, 2026  
**Next.js Version**: 16.1.6  
**React Version**: 19.2.3
