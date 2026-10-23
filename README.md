# GNDU Student Portal

This repository now contains two local applications:

- The existing React/Vite frontend in `src/`.
- An Express API with Prisma and SQLite for local development in `server/` and `prisma/`.

Authentication, academic administration, attendance, assessments, calendar events, announcements, private messages, fee records and administrator-confirmed offline payments are backed by the local API and SQLite database.

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

Create or advance the SQLite schema and generate the Prisma client. This applies forward-only migrations; it does not reset the database:

```bash
npm run db:migrate
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

## Phase 4: calendar, announcements and messages

The calendar reads actual `/api/calendar/events` data. Students receive published events only when their institution, department, or active course enrollment is in scope. Administrators can manage any event. Teachers can create and manage only course-scoped events for courses to which they are actively assigned.

Announcements follow the same publication and audience rules at `/api/announcements`. Draft and archived records cannot be retrieved by students, even by guessing an ID. Use the Calendar and Announcements items in the relevant role workspace to view the data; administrators and authorized teachers can author events and announcements.

Private messages are direct, two-participant conversations at `/api/messages/conversations`. The server permits administrator communication and teacher/student messaging only where the teacher is assigned to one of the student's active courses. Conversation membership is checked for every history, send, and read operation. Message history is paginated.

## Phase 5: fees, offline payments and receipts

Fee amounts and payments are stored as integer minor units (paise for INR), never floats. Only administrators can create/edit fee records or record an offline payment. A confirmed payment requires an institutionally verified reference and cannot exceed the remaining balance. References are unique, balance/status changes occur in one database transaction, and a confirmed payment receives a receipt number. Administrators can reverse a confirmed payment with a recorded reason; the fee balance is recalculated without deleting financial history.

Students can access only their own fee ledger, payments, and printable HTML receipts. A receipt is unavailable after reversal. Teachers have no fee-management permissions.

There is no live online payment gateway configured. The student UI says so explicitly and has no fake checkout or client-side success state. A future provider integration needs provider credentials kept in `server/.env`, server-side confirmation/webhook signature verification, and an idempotent transaction reference before it can create a `CONFIRMED` payment.

To use the finance workflow, an administrator must create student accounts first, then open **Fees** in the admin workspace to create a fee record and record only verified cash, bank-transfer, or receipt-based payments. The returned receipt link can be printed by the student or an administrator.

## Verification

Run the complete verification suite and frontend build:

```bash
npm run db:generate
npm run test:server
npm run build
```

The server tests apply every migration to the disposable `prisma/test.db`, preserve the authentication and academic checks, and test Phase 4/5 draft visibility, conversation membership, financial authorization, overpayment prevention, duplicate payment reference handling, balances, and receipt ownership.

## Development demo accounts

After creating or migrating your local database, create the repeatable local test accounts with:

```bash
npm run db:deploy
npm run seed:demo
```

The seed creates (or safely leaves unchanged) a `GNDU Test Department`, ten students (`student01` through `student10`) and two teachers (`teacher01`, `teacher02`). It is idempotent: rerunning it does not delete users, create duplicates, replace profile data, or replace an existing password. The development-only password for all twelve accounts is `LocalTestPassword!2026`.

| Role | IDs | Usernames |
| --- | --- | --- |
| Student | S123–S132 | student01–student10 |
| Teacher | T001–T002 | teacher01, teacher02 |

The script hashes this password with the same bcrypt policy as the application and never logs it or returns it from an API. These credentials are intentionally public development fixtures and must never be used in production.

Git does not share SQLite data files. Each teammate must copy `server/.env.example` to their own private `server/.env`, configure a unique JWT secret, then run `npm install`, `npm run db:deploy`, `npm run db:generate`, and `npm run seed:demo`. For a deployed database, a deployment operator must configure `DATABASE_URL` and secrets in the deployment environment, apply the forward-only migrations, and run `node server/src/scripts/seed-demo-accounts.js` once with that same environment. Do not run the demo seed against production unless the deployment is explicitly an isolated demonstration environment.

## Not implemented

Live payment-gateway processing, provider webhooks, email/SMS/push delivery, GNDU-specific fee policies and grading policies, and production deployment are intentionally not included.
