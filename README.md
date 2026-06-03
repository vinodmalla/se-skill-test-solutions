# TaskFlow — Project Management API

TaskFlow is a task management web application built with the following tech stack:

**Backend:**
- Node.js and Express — REST API server
- PostgreSQL — relational database for storing users and tasks
- bcrypt — password hashing
- jsonwebtoken (JWT) — user authentication
- dotenv — environment variable management

**Frontend:**
- HTML, CSS, Vanilla JavaScript — simple and lightweight UI
- No frameworks — runs directly in the browser

**DevOps:**
- Docker and Docker Compose — containerised local development
- GitHub Actions — automated CI/CD pipeline
- GitHub Container Registry (GHCR) — Docker image storage

---

## How the App Works

1. A user opens the app and sees a login and register form
2. They register with a username, email and password
3. After registering or logging in they get a JWT token
4. The token is saved in the browser and sent with every request
5. The user can create tasks, update their status, edit details, and delete them
6. All tasks are saved in the PostgreSQL database and belong to the logged in user only
7. When the user logs out the token is removed from the browser

---

## Table of Contents

1. [Bugs Found & Fixed](#bugs-found--fixed)
2. [New Features Added](#new-features-added)
3. [Security Fixes](#security-fixes)
4. [How to Run with Docker](#how-to-run-with-docker)
5. [How the CI/CD Pipeline Works](#how-the-cicd-pipeline-works)
6. [Assumptions & Trade-offs](#assumptions--trade-offs)

---

## Bugs Found & Fixed

### Bug 1 — App crashed on startup
**File:** `package.json`
The start script was pointing to `server.js` which does not exist in
the project. So running `npm start` would crash immediately.
I fixed it by pointing it to the correct file `src/app.js`.

---

### Bug 2 — Missing package caused crash
**File:** `src/app.js`
The code was using a package called `morgan` for request logging but it
was never installed. This caused the app to crash before it even started.
I installed `morgan` by running `npm install morgan`.

---

### Bug 3 — Two packages doing the same job
**File:** `src/app.js`
The code was using `body-parser` to read request data, but Express
already has this built in with `express.json()`. Having both is
unnecessary and adds extra weight.
I removed `body-parser` and kept `express.json()`.

---

### Bug 4 — Dead code left in database file
**File:** `src/db/connection.js`
There was a function commented out that was never used. It was just
sitting there doing nothing and confusing anyone reading the code.
I deleted it to keep the code clean.

---

### Bug 5 — Unused function in tasks file
**File:** `src/routes/tasks.js`
A function called `formatTask()` was defined but never called anywhere
in the project. It was dead code with no purpose.
I removed it entirely.

---

### Bug 6 — App could crash on delete
**File:** `src/routes/tasks.js`
The delete route had no error handling. If the database had any problem
during a delete, the whole server would crash with an unhandled error.
I wrapped it in a try/catch block so errors are handled gracefully.

---

### Bug 7 — No error when task not found
**File:** `src/routes/tasks.js`
When updating a task that does not exist, the API was returning an empty
response with no error message. The client had no way to know what went wrong.
I added a check that returns a clear `404 Not Found` response.

---

### Bug 8 — Internal code details sent to users
**Files:** `src/app.js`, `src/routes/auth.js`, `src/routes/tasks.js`
Error responses were including the full stack trace of the error. This
exposes internal file paths and code details to anyone using the API.
I removed stack traces from responses — errors are now logged on the
server only.

---

### Bug 9 — Duplicate DELETE route
**File:** `src/routes/tasks.js`
There were two DELETE routes defined for the same endpoint. The first
one was also vulnerable to SQL injection as it used string concatenation.
I removed the vulnerable duplicate and kept only the safe parameterised one.

---

## New Features Added

### Feature 1 — POST route for creating tasks
**File:** `src/routes/tasks.js`
There was no POST route to create a new task. This is a core feature
of the application — without it users cannot add any tasks at all.
I added a proper POST route that saves the task to the database and
returns the created task with status `201`.

---

### Feature 2 — Edit button on task cards
**File:** `public/index.html`, `public/app.js`
The original UI had no way to edit a task. Users could only see tasks
but could not update the title, description, or status.
I added an edit button on each task card that opens a modal with a form
to update the task details.

---

### Feature 3 — Delete button on task cards
**File:** `public/index.html`, `public/app.js`
The original UI had no delete button. Users had no way to remove tasks
from the frontend even though the backend supported it.
I added a delete button on each task card that asks for confirmation
and then removes the task instantly without needing a page refresh.

---

## Security Fixes

### Fix 1 — Database connection string was hardcoded
**File:** `src/db/connection.js`
The full database URL including the username and password was hardcoded
directly in the source file. Anyone with access to the repository could
see the credentials.
I replaced it with environment variables so secrets are never in the code.

---

### Fix 2 — JWT secret was hardcoded
**Files:** `src/middleware/auth.js`, `src/routes/auth.js`
The secret used to sign login tokens was hardcoded as
`"super_secret_key_123"`. Anyone who sees this can create fake tokens
and log in as any user.
I moved it to `process.env.JWT_SECRET`.

---

### Fix 3 — Login was vulnerable to SQL injection
**File:** `src/routes/auth.js`
The login query was built by joining user input directly into the SQL
string. An attacker could type special characters to bypass login
completely and access any account.
I replaced it with a parameterised query which is safe from this attack.

---

### Fix 4 — Passwords saved as plain text
**File:** `src/routes/auth.js`
User passwords were being saved to the database exactly as typed. If the
database was ever leaked, every password would be exposed immediately.
I now hash passwords with `bcrypt` before saving, so even if the
database leaks, passwords cannot be read.

---

### Fix 5 — Delete was vulnerable to SQL injection
**File:** `src/routes/tasks.js`
The delete query was built using the task ID from the URL directly,
which is untrusted user input. An attacker could manipulate it.
I replaced it with a parameterised query.

---

### Fix 6 — Error details exposed to users
**Files:** `src/app.js`, `src/routes/auth.js`, `src/routes/tasks.js`
Error responses were including `err.stack` which reveals internal file
paths and code structure to anyone using the API.
I removed stack traces from all error responses. Errors are logged on
the server only and clients receive a generic message.

---

### Fix 7 — No input validation on forms
**Files:** `src/routes/auth.js`, `src/routes/tasks.js`
The API was accepting requests with missing or empty fields and passing
them straight to the database. This caused confusing database errors.
I added clear validation — required fields are checked, email format is
validated, and password must be at least 8 characters with uppercase,
number, and special character.

---

## How to Run with Docker

**You need:** Docker Desktop installed and running.

**Step 1 — Clone the project:**
```bash
git clone https://github.com/vinodmalla/se-skill-test-solutions.git
cd se-skill-test-solutions
```

**Step 2 — Create your `.env` file:**
```bash
cp .env.example .env
```
Open `.env` and fill in your values:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=your_password_here
DB_NAME=taskflow
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=24h
```

**Step 3 — Start the app:**
```bash
docker compose up --build
```
This will start the database and the app together. The database tables
are created automatically on first run.

**Step 4 — Open in browser:**
http://localhost:3000

**Step 5 — Stop the app:**
```bash
docker compose down
```

---

## How the CI/CD Pipeline Works

The pipeline file is at `.github/workflows/ci.yml`.
It runs automatically every time code is pushed to the `main` branch.

**Step 1 — Lint & Test:**
- Checks out the code
- Installs Node.js 20
- Installs dependencies with `npm ci`
- Runs the test suite with `npm test`

**Step 2 — Build & Push (only on main branch):**
- Logs in to GitHub Container Registry using `GITHUB_TOKEN`
- Builds the Docker image
- Tags it as `latest` and `sha-<commit>` for traceability
- Pushes the image to the registry

No extra secrets need to be configured — GitHub provides `GITHUB_TOKEN`
automatically.

---

## Assumptions & Trade-offs

**Installed `morgan` instead of removing it:** The app was already using
it for request logging so I installed it properly rather than removing it.

**Used `bcrypt` instead of `argon2`:** Both are good choices. `bcrypt`
works on all environments without extra setup and is widely understood
by developers.

**Kept raw SQL instead of adding an ORM:** The original code used plain
database queries. Adding Prisma or Knex was out of scope and the
parameterised queries are already safe.

**Routes mounted at `/` instead of `/api`:** The original routing worked
locally so I kept it consistent. The frontend uses an environment-aware
API base path that works on both localhost and production.Sonnet 4.6 Low
