# Frontend ML Integration README

This document explains the frontend implementation completed for the Resume Backend v2.0 and ML proxy endpoints.

## Overview

The frontend is now wired to backend ML endpoints through:

- API client and typed DTOs in `lib/api.ts`
- UI rendering of v2.0 fields in score views
- ML service health/status display on dashboard
- A dedicated `ML Tools` page for directly running ML endpoints
- Resume selection in `ML Tools` to auto-apply selected resume text when backend provides it

## Implemented Routes and Pages

- `/dashboard`
  - Shows ML service status (`health`, `version`, `skills_loaded`)
  - Includes navigation to `ML Tools`
- `/score`
  - Displays v2 fields through shared score component
  - Includes navigation to `ML Tools`
- `/recommend`
  - Includes navigation to `ML Tools`
- `/ml-tools` (new)
  - Service overview from ML endpoints
  - Interactive endpoint testing UI
  - Resume selection dropdowns (Resume A / Resume B)

## API Layer Updates (`lib/api.ts`)

### Updated `ResumeScore` (v2 fields)

Added optional fields:

- `confidence?: number`
- `interpretation?: string`
- `detectedIndustry?: string`
- `industryScore?: number`

### Updated `ResumeResponse`

Added optional text fields used by ML Tools auto-apply logic:

- `extractedText?: string`
- `resumeText?: string`
- `text?: string`

### Added `mlApi` endpoints

- `health()` -> `GET /api/ml/health`
- `industries()` -> `GET /api/ml/industries`
- `stats()` -> `GET /api/ml/stats`
- `analyze()` -> `POST /api/ml/analyze`
- `wordQuality()` -> `POST /api/ml/word-quality`
- `rank()` -> `POST /api/ml/rank`
- `analyzeEnhanced()` -> `POST /api/ml/analyze-enhanced`
- `analyzeMl()` -> `POST /api/ml/analyze-ml`
- `industryScore()` -> `POST /api/ml/industry-score`
- `compareResumes()` -> `POST /api/ml/compare-resumes`
- `findBestCandidate()` -> `POST /api/ml/find-best-candidate`
- `smartRank()` -> `POST /api/ml/smart-rank`
- `filterResumes()` -> `POST /api/ml/filter-resumes`
- `batchProcess()` -> `POST /api/ml/batch-process`

## Score UI Updates (`components/ScoreDisplay.tsx`)

Added rendering for v2.0 insights:

- `Confidence` score card
- `Industry Score` score card
- `ML v2.0 Insights` panel showing:
  - Detected Industry
  - Confidence
  - Interpretation

Also fixed professionalism normalization:

- Handles both `0-1` and `0-100` style backend values safely

## Dashboard Updates (`app/dashboard/page.tsx`)

- Calls ML metadata endpoints:
  - `mlApi.health()`
  - `mlApi.stats()`
- Displays status block:
  - Status
  - Version
  - Skills loaded
- Added `ML Tools` navigation button in header

## Score and Recommend Page Updates

- `app/score/page.tsx`
  - Added `ML Tools` nav button
  - Shows detected industry hint in resume list (when available)
- `app/recommend/page.tsx`
  - Added `ML Tools` nav button

## ML Tools Page (`app/ml-tools/page.tsx`)

### Service Overview section

Reads and displays:

- Health status
- Version
- Skills loaded
- Industry list

### Endpoint execution sections

- Analyze Enhanced
  - Uses `mlApi.analyzeEnhanced(resumeText, jobDescription)`
- Compare Resumes
  - Uses `mlApi.compareResumes(resumeTextA, resumeTextB, jobDescription)`

### Resume selection and apply behavior

- Loads resume list from `GET /api/resumes`
- On selection, fetches details from `GET /api/resumes/{id}`
- Attempts to auto-fill text from:
  - `extractedText`
  - `resumeText`
  - `text`
  - `content`

If none are returned, UI shows a hint and asks for manual paste.

## Backend Requirement for Auto-Apply in ML Tools

For best behavior, backend should return extracted text in `GET /api/resumes/{id}` response.

Recommended field name:

- `extractedText`

Without that, resume selection still works, but manual text paste is required for ML endpoint calls.

## Files Added and Updated

### Added

- `app/ml-tools/page.tsx`
- `README_ML_IMPLEMENTATION.md`

### Updated

- `lib/api.ts`
- `components/ScoreDisplay.tsx`
- `app/dashboard/page.tsx`
- `app/score/page.tsx`
- `app/recommend/page.tsx`

## How to Use

1. Start backend and frontend.
2. Login.
3. Open `ML Tools` from Dashboard/Score/Recommend headers.
4. Select Resume A (and Resume B for comparison).
5. Provide optional job description.
6. Run:
   - `Analyze Enhanced`
   - `Compare Resumes`
7. Inspect JSON output in page.

## Notes

- All ML and resume endpoints continue to use JWT via Axios interceptor.
- On `401`, token is cleared and user is redirected to `/login`.
