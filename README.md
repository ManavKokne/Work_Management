# Intense Technologies Task Manager

Full-stack internal Task Management system built with Next.js App Router. This project supports secure login, task creation, engineer update reporting, email notification, image upload, and PDF report generation.

## 1. Project Overview

This application is designed for internal teams to manage field/service tasks and engineer reports with a simple, professional dashboard.

### Core user journey

1. User logs in with Firebase Email/Password credentials.
2. User lands on protected dashboard home page.
3. User creates task from New Task modal.
4. Task is stored in MySQL and email notification is sent to engineer email.
5. User edits task to submit report details.
6. Report row is created, task status is updated.
7. User can generate a PDF from task + report data.

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript |
| Styling | Tailwind CSS v4 |
| UI | shadcn-style components (built using Radix primitives) |
| Icons | lucide-react |
| Client auth | Firebase Authentication (Email/Password) |
| File upload | Cloudinary |
| Database | MySQL |
| DB client | mysql2/promise |
| Validation | zod |
| Email | nodemailer |
| PDF | jspdf + html2canvas |
| Notifications | sonner |

## 3. Dependency Details

### Runtime dependencies (`dependencies`)

| Package | Why it is used |
|---|---|
| `next`, `react`, `react-dom` | Core web application framework/runtime |
| `tailwindcss` | Utility-first styling system |
| `lucide-react` | Icon set (Edit/Print/Navbar icons) |
| `firebase` | Auth SDK |
| `mysql2` | MySQL connection pooling and prepared query execution |
| `nodemailer` | SMTP email sending for task assignment notifications |
| `zod` | API input validation and schema safety |
| `jspdf`, `html2canvas` | Render and export PDF report from task data |
| `sonner` | Toast notifications for success/error states |
| `@radix-ui/react-dialog` | Modal primitives (New/Edit forms) |
| `@radix-ui/react-select` | Accessible select dropdown (status field) |
| `@radix-ui/react-label` | Accessible form labels |
| `@radix-ui/react-slot` | Component composition helper |
| `class-variance-authority` | Style variant patterns (`button`, `badge`) |
| `clsx`, `tailwind-merge` | Classname composition utility |

### Development dependencies (`devDependencies`)

| Package | Why it is used |
|---|---|
| `eslint`, `eslint-config-next` | Code linting and best-practice enforcement |
| `@tailwindcss/postcss` | Tailwind processing via PostCSS |
| `babel-plugin-react-compiler` | React compiler optimization plugin from template |

## 4. Implemented Features

## 4.1 Authentication

- Only `/login` is public.
- No signup page is provided.
- Login uses Firebase Email/Password:
	- `auth.signInWithEmailAndPassword(email, password)`
- Session is tracked via `onAuthStateChanged`.
- Protected routes use `AuthGuard` to redirect unauthenticated users back to `/login`.
- Sign-out is implemented with:
	- `firebase.auth().signOut()`

Relevant files:
- `app/login/page.js`
- `components/AuthGuard.jsx`
- `hooks/useAuth.js`
- `lib/firebase.js`

## 4.2 Navbar and layout

- Navbar appears on protected routes only.
- Left: company label `Intense Technologies`.
- Center: `Home`, `Summary`, `Predictions` (all route to `/` currently).
- Right: logged-in user email and Sign Out button.
- Responsive behavior for small and large screens.

Relevant files:
- `app/(protected)/layout.js`
- `components/Navbar.jsx`

## 4.3 New Task workflow

- `New Task` button opens modal form.
- Captured fields:
	- `cust_name`
	- `address`
	- `task_reported_by`
	- `engg_name`
	- `engg_email` (stored in tasks table)
- Auto/default values in UI:
	- reported datetime: system datetime display
	- status: `Pending`
- Backend insert flow:
	- Validate request with zod
	- Insert into `tasks`
	- Read inserted row
	- Send engineer email notification

Relevant files:
- `components/NewTaskModal.jsx`
- `app/api/create_task/route.js`
- `lib/email.js`
- `lib/validators.js`

## 4.4 Task list/table

- Tasks rendered in a table format.
- Table columns:
	- Task ID
	- Customer Name
	- Reported By
	- Engineer Name
	- Reported Datetime
	- Status
	- Edit icon
	- Print icon
- Sorted by newest first:
	- `ORDER BY reported_datetime DESC`

Relevant files:
- `components/TaskTable.jsx`
- `app/api/get_tasks/route.js`

## 4.5 Edit Task/report submission workflow

- Edit icon opens edit modal per task.
- Disabled pre-filled task fields:
	- customer name
	- address
	- reported by
	- engineer name
	- reported datetime
- Auto-generated disabled fields:
	- `start_time` from task `reported_datetime`
	- `end_time` from system time
	- `location` from browser geolocation
- Editable fields:
	- `observation`
	- `work_done`
	- `work_date`
	- `photo` (jpg/png)
	- `status` (`Completed`, `Pending`, `To Do`)
- Save action:
	- Upload photo to Cloudinary (if provided)
	- Insert new row in `reports`
	- Update task `status` in `tasks`
	- Send report-updated email to engineer email stored in `tasks`
	- Wrapped in DB transaction for consistency

Relevant files:
- `components/EditTaskModal.jsx`
- `app/api/update_task/route.js`
- `lib/db.js`

## 4.6 PDF generation

- Print icon fetches task + report data from API.
- HTML template is rendered off-screen.
- `html2canvas` captures it.
- `jsPDF` exports a downloadable PDF (`task-<id>.pdf`).

Relevant files:
- `app/(protected)/page.js`
- `app/api/generate_pdf/route.js`

## 4.7 Notifications and UX feedback

- Success and error toasts on all main actions:
	- login
	- create task
	- edit task
	- print pdf
	- data loading errors

Relevant files:
- `components/ui/sonner.jsx`
- `app/layout.js`

## 5. API Contract

### `POST /api/create_task`

- Input:
	- `cust_name`, `address`, `task_reported_by`, `engg_name`, `engg_email`
- Output:
	- `{ success: true, task_id }`
- Behavior:
	- Inserts a task with status `Pending`
	- Sends email to engineer

### `GET /api/get_tasks`

- Output:
	- `{ tasks: [...] }`
- Behavior:
	- Returns tasks sorted by descending `reported_datetime`

### `POST /api/update_task`

- Input:
	- `task_id`, `observation`, `work_done`, `work_date`, `start_time`, `end_time`, `location`, `photo`, `status`
- Output:
	- `{ success: true }`
- Behavior:
	- Inserts report row
	- Updates task status

### `GET /api/generate_pdf?task_id=<id>`

- Output:
	- `{ task, report, reports }`
- Behavior:
	- Returns task and latest report details for PDF rendering

## 6. Security and Good Practices Implemented

- Prepared statements with parameterized queries (`?`) in all DB writes/reads.
- Environment variables for all secrets and connection values.
- Authentication guard on internal routes.
- Input validation with zod in write APIs.
- DB transaction for multi-step update (`reports` insert + `tasks` update).
- `server-only` on server libraries (`lib/db.js`, `lib/email.js`) to avoid client exposure.

## 7. Folder Structure

```text
app/
	(protected)/
		layout.js
		page.js
	api/
		create_task/route.js
		get_tasks/route.js
		update_task/route.js
		generate_pdf/route.js
	login/page.js
	globals.css
	layout.js

components/
	AuthGuard.jsx
	Navbar.jsx
	NewTaskModal.jsx
	EditTaskModal.jsx
	TaskTable.jsx
	ui/

hooks/
	useAuth.js

lib/
	db.js
	email.js
	firebase.js
	utils.js
	validators.js

utils/
	dateFormatter.js
```

## 8. Environment Variables

Use `.env.local` (copy from `.env.example`).

```env
# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=WRMG

# Firebase Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your_password_or_app_password
SMTP_FROM=you@example.com
```

## 9. Database Schema

```sql
CREATE TABLE IF NOT EXISTS tasks (
	task_id INT NOT NULL AUTO_INCREMENT,
	cust_name VARCHAR(150) NOT NULL,
	address TEXT NOT NULL,
	task_reported_by VARCHAR(150) DEFAULT NULL,
	reported_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
	engg_name VARCHAR(150) DEFAULT NULL,
	engg_email VARCHAR(255) DEFAULT NULL,
	status VARCHAR(50) DEFAULT 'Pending',
	PRIMARY KEY (task_id)
);

CREATE TABLE IF NOT EXISTS reports (
	report_id INT NOT NULL AUTO_INCREMENT,
	task_id INT NOT NULL,
	observation TEXT,
	work_done TEXT,
	work_date DATE,
	start_time TIME,
	end_time TIME,
	location VARCHAR(255),
	photo VARCHAR(255),
	status VARCHAR(50),
	PRIMARY KEY (report_id),
	KEY idx_reports_task_id (task_id),
	CONSTRAINT fk_reports_task FOREIGN KEY (task_id) REFERENCES tasks(task_id)
);
```

## 10. Setup and Run Instructions

1. Install dependencies.

```bash
npm install
```

2. Create env file.

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Bash:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` with your Firebase auth, Cloudinary, MySQL, and SMTP credentials.
4. Run SQL schema scripts in MySQL.
5. Start development server.

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## 11. Available npm scripts

- `npm run dev`: run local dev server
- `npm run build`: create production build
- `npm run start`: run production server
- `npm run lint`: lint the project

## 12. Troubleshooting

### Login fails

- Ensure Firebase Email/Password provider is enabled.
- Ensure user exists in Firebase Console.
- Verify `NEXT_PUBLIC_FIREBASE_*` values.

### Task create/update fails with DB error

- Verify MySQL server is running.
- Verify DB credentials in `.env.local`.
- Ensure tables exist and column names match schema.

### Photo upload fails

- Ensure Cloudinary unsigned upload preset is created.
- Verify `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
- Confirm file type is jpg/png.

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
