# GNDU Student Portal

This repository now contains two local applications:

- The existing React/Vite frontend in `src/`.
- An Express API with Prisma and SQLite for local development in `server/` and `prisma/`.

Authentication, academic administration, attendance and assessment records are backed by the local API and SQLite database. Calendar, messaging, fees, notifications and payment workflows remain future-phase placeholders and must not be treated as live services.

## Prerequisites

Install Node.js 22 or later, then work from the repository root:

```bash
cd "/Users/Kuljeetkaur/Documents/Hackerwarth 3.0/GNDU-Student-Portal/GNDU-Student-Portal"
npm install
```

## Configure local development

Create the frontend environment file:

```bash
cp .env.example .env
```

`VITE_API_BASE_URL` in `.env` must be `http://localhost:8080/api`. It is safe to expose because it is only the API address; never put passwords or secrets in a `VITE_` variable.

Create the server environment file:

```bash
cp server/.env.example server/.env
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Copy the value printed by the second command into `JWT_SECRET` in `server/.env`. Keep `server/.env` private; it is ignored by Git.

## Create the database and initial administrator

Create the SQLite schema and Prisma client:

```bash
npm run db:migrate -- --name init_auth
npm run db:generate
```

Before creating the first administrator, edit only your local `server/.env` and set these three values to unique values you choose:

```text
INITIAL_ADMIN_NAME=Your administrator name
INITIAL_ADMIN_USERNAME=your-admin-username
INITIAL_ADMIN_PASSWORD=a-long-unique-temporary-password
```

The password must have at least 12 characters. Then run:

```bash
npm run admin:create
```

The command refuses to create a second bootstrap administrator. It stores only a bcrypt password hash and marks the account as requiring a password change. Do not use `Admin` / `Admin123`, do not commit `server/.env`, and do not put this password in `.env` at the repository root.

## Start the portal

Open two terminals at the repository root.

Terminal 1 starts the API:

```bash
npm run server
```

Terminal 2 starts Vite:

```bash
npm run dev
```

Open the Vite URL shown in Terminal 2, normally `http://localhost:5173`. Sign in with the initial administrator username and temporary password. The portal will require a new password before opening protected pages.

To check that the API itself is running:

```bash
curl http://localhost:8080/api/health
```

Expected result:

```json
{"status":"ok"}
```

## Verify this stage

Run the backend tests and frontend build:

```bash
npm run test:server
npm run build
```

The backend test verifies invalid-login rejection, password hashing, active-account enforcement, and that a teacher is blocked from an admin-only API route. It creates and removes its own temporary SQLite users.

## Security notes

- The session is an HttpOnly, SameSite cookie, so the frontend cannot read it directly.
- Every authenticated request reloads the user from the database. A deactivated user’s existing session stops working.
- Login attempts are rate-limited in memory for local single-server use. A production deployment should use a shared rate-limit store and HTTPS.
- `server/.env` contains secrets. The root `.env` contains only the public API URL.
- `GET /api/admin/session-check` is a deliberately small protected endpoint used to verify role middleware. It is not an admin-management feature.

## Academic administration and records

Administrators manage departments, accounts, courses, enrollments and teacher assignments through protected `/api/admin` endpoints. Teachers can record attendance and create assessments only for courses to which they are assigned. Students can read only their own attendance and marks through `/api/attendance/me` and `/api/marks/me`.

Attendance percentages count recorded `PRESENT`, `LATE` and `EXCUSED` sessions over all recorded sessions. Unrecorded sessions are not absences. Marks are recorded only for active enrollments and are validated against the assessment maximum. Grade thresholds are intentionally not configured: the calculator and result summaries show percentages, not an invented official GNDU grade.

`npm run test:server` provisions and migrates `prisma/test.db`, an isolated ignored database. It never alters `prisma/dev.db`.

## Still not implemented

Calendar events, messaging, fee records and receipts, notifications, payment-gateway integration, GNDU-specific grading policies, production deployment and final cross-feature integration remain future work.
