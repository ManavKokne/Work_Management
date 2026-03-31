# Intense Technologies Task Manager

Internal task and service-report management application built on Next.js App Router. It supports Firebase login, protected dashboards, task creation, report updates with multi-image uploads, email notifications, and PDF generation.

## Project Overview

The application is used by internal teams to track service tasks end-to-end.

Core flow:

1. User signs in with Firebase Email/Password.
2. User works inside protected routes.
3. User creates a task and assigns an engineer.
4. Engineer/task updates are stored in PostgreSQL.
5. Report updates can include multiple uploaded images.
6. Notification emails are sent to engineer, reporter, and configured admins.
7. Task + report data can be exported as PDF.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript |
| Styling | Tailwind CSS v4 |
| UI primitives | Radix-based UI components |
| Icons | lucide-react |
| Auth | Firebase Authentication (Email/Password) |
| Database | PostgreSQL (Supabase-managed) |
| DB client | pg (Pool) |
| Validation | zod |
| File upload | Cloudinary (unsigned upload preset) |
| Email | nodemailer |
| PDF export | jspdf + html2canvas |
| Toasts | sonner |

## Current Feature Set

### Authentication and Access Control

- `/login` is public.
- Protected pages are wrapped with `AuthGuard`.
- Session state is tracked using Firebase `onAuthStateChanged`.
- Sign-out is available in the navbar.

### Dashboard and Task List

- Main dashboard page lists tasks sorted by latest reported date/time.
- Filters are available in a right-side drawer.
- Supported filters include task ID, customer, reported by, engineer, status, and reported date.
- Edit and Print actions are available per task row.
- Preview modal is available to inspect the latest report and photos.

### Task Creation

- New Task modal captures customer, address, reported by, engineer name, engineer email, and optional reporter email.
- Task is saved with `Pending` status by default.
- API validates payload with zod before insert.
- Task assignment email is sent after successful creation.

### Task Update and Report Submission

- Edit modal pre-fills from the latest report entry when available.
- Captures observation, work done, work date, status, start/end time, location, and reporter email.
- Supports multi-image uploads to Cloudinary.
- Stores report update in `reports` and updates task status in `tasks` within a DB transaction.
- Sends report update notification email with image links/previews.

### PDF and Geolocation

- PDF endpoint collects task + latest report data for print/export.
- Browser-side PDF generation uses HTML template capture (`html2canvas`) and `jsPDF`.
- Reverse geocoding endpoint converts coordinates to readable location text.

### Placeholder Pages

- `/summary` and `/predictions` currently exist as placeholder pages.

## Database Implementation

The backend uses PostgreSQL through `pg` with `DATABASE_URL`.

Connection behavior in `lib/db.js` includes:

- URL validation and placeholder-host guardrails.
- Supabase-compatible SSL settings.
- Pooled connections with keepalive and timeout tuning.
- Retry handling for transient DNS/network errors.
- Explicit transaction helper for multi-step writes.

## API Endpoints

### `POST /api/create_task`

- Validates task payload.
- Inserts into `tasks` with PostgreSQL parameterized query.
- Returns `{ success: true, task_id }`.

### `GET /api/get_tasks`

- Ensures required schema exists.
- Returns tasks plus distinct email options used by forms.
- Returns `{ tasks, enggEmailOptions, reporterEmailOptions }`.

### `POST /api/update_task`

- Validates update payload.
- Inserts report row and updates task row in a transaction.
- Returns `{ success: true }`.

### `GET /api/generate_pdf?task_id=<id>`

- Returns task, latest report, resolved location, and report history.

### `GET /api/reverse_geocode?lat=<lat>&long=<long>`

- Validates coordinates.
- Returns coordinate pair and reverse-geocoded address data.

## Environment Variables

Create `.env.local` from `.env.example` and fill values.

```env
# PostgreSQL (Supabase-managed, used with Node.js pg)
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?sslmode=require
DATABASE_URL=postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres?sslmode=require

# Firebase Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary (unsigned upload)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset

# SMTP (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your_password_or_app_password
SMTP_FROM=you@example.com
ADMIN_NOTIFICATION_EMAILS=admin1@example.com,admin2@example.com
```

## PostgreSQL Schema (Current)

Schema is auto-created by backend bootstrap in `lib/taskSchema.js`.

```sql
CREATE TABLE IF NOT EXISTS tasks (
  task_id SERIAL PRIMARY KEY,
  cust_name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  task_reported_by VARCHAR(150) DEFAULT NULL,
  reporter_email VARCHAR(255) DEFAULT NULL,
  reported_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  engg_name VARCHAR(150) DEFAULT NULL,
  engg_email VARCHAR(255) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS reports (
  report_id SERIAL PRIMARY KEY,
  task_id INT NOT NULL,
  observation TEXT,
  work_done TEXT,
  work_date DATE,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  reporter_email VARCHAR(255),
  photo TEXT,
  status VARCHAR(50),
  CONSTRAINT fk_reports_task FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reports_task_id ON reports(task_id);
```

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create local env file.

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Bash:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` values for PostgreSQL, Firebase, Cloudinary, and SMTP.
4. Start development server.

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## NPM Scripts

- `npm run dev` starts local dev server.
- `npm run build` creates production build.
- `npm run start` starts production server.
- `npm run lint` runs ESLint.

## Troubleshooting

### Intermittent DB 500 errors

- Confirm `DATABASE_URL` host is real and not a placeholder.
- Verify network access to Supabase host from your machine.
- Ensure `.env.local` is loaded by restarting dev server after env edits.

### Login issues

- Enable Firebase Email/Password provider.
- Ensure user exists in Firebase Auth.
- Verify all `NEXT_PUBLIC_FIREBASE_*` values.

### Email not sent

- Verify SMTP credentials and `SMTP_FROM`.
- Verify `ADMIN_NOTIFICATION_EMAILS` format.

### Image upload issues

- Verify Cloudinary unsigned upload preset.
- Verify `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
- Upload only supported image types (`jpg`, `png`).

### Email not sent

- Verify SMTP host/port/user/pass.
- For Gmail, use app password if required.

### PDF not generated

- Ensure browser allows file download.
- Check console/network for API errors from `/api/generate_pdf`.

## 13. Current Scope and Future Enhancements

### Current scope

- Single-page protected dashboard with task table.
- Login-only auth flow.
- Task create, edit, status update, and PDF generation.

### Suggested next enhancements

- Server-side auth token verification middleware for APIs.
- Pagination and search/filter for large datasets.
- Rich PDF templating on server.
- Audit logs and role-based access control.
- Dashboard analytics and prediction modules.
