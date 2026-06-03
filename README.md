
# TaskFlow — Project Management API

TaskFlow is a Node.js and Express REST API with a PostgreSQL database. 
It lets users register, log in, and manage their tasks. This README 
explains every problem found in the original code, how it was fixed, 
and how to run the project.

---

## Table of Contents

1. [Bugs Found & Fixed](#bugs-found--fixed)
2. [Security Fixes](#security-fixes)
3. [How to Run with Docker](#how-to-run-with-docker)
4. [How the CI/CD Pipeline Works](#how-the-cicd-pipeline-works)
5. [Assumptions & Trade-offs](#assumptions--trade-offs)

---

## Bugs Found & Fixed

### Bug 1 — App crashed on startup
**File:** `package.json`
The start script was pointing to `server.js` which does not exist in 
the project. So running `npm start` would crash immediately.
We fixed it by pointing it to the correct file `src/app.js`.

---

### Bug 2 — Missing package caused crash
**File:** `src/app.js`
The code was trying to use a package called `morgan` but it was never 
installed. This caused the app to crash before it even started.
We removed `morgan` since it was not needed.

---

### Bug 3 — Two packages doing the same job
**File:** `src/app.js`
The code was using `body-parser` to read request data, but Express 
already has this built in with `express.json()`. Having both is 
unnecessary and adds extra weight.
We removed `body-parser` and kept `express.json()`.

---

### Bug 4 — Dead code left in database file
**File:** `src/db/connection.js`
There was a function commented out that was never used. It was just 
sitting there doing nothing and confusing anyone reading the code.
We deleted it to keep the code clean.

---

### Bug 5 — Unused function in tasks file
**File:** `src/routes/tasks.js`
A function called `formatTask()` was defined but never called anywhere 
in the project. It was dead code with no purpose.
We removed it entirely.

---

### Bug 6 — App could crash on delete
**File:** `src/routes/tasks.js`
The delete route had no error handling. If the database had any problem 
during a delete, the whole server would crash with an unhandled error.
We wrapped it in a try/catch block so errors are handled gracefully.

---

### Bug 7 — Wrong response code on create
**File:** `src/routes/tasks.js`
When a new task was created, the API was returning status `200`. But the 
correct status for creating something new is `201 Created`.
We changed it to `res.status(201)` which follows REST standards.

---

### Bug 8 — No error when task not found
**File:** `src/routes/tasks.js`
When updating a task that does not exist, the API was returning an empty 
response with no error message. The client had no way to know what went wrong.
We added a check that returns a clear `404 Not Found` response.

---

### Bug 9 — Internal code details sent to users
**Files:** `src/app.js`, `src/routes/auth.js`, `src/routes/tasks.js`
Error responses were including the full stack trace of the error. This 
exposes internal file paths and code details to anyone using the API.
We removed stack traces from responses — errors are now logged on the 
server only.

---

### Bug 10 — Wrong API path in frontend
**File:** `public/app.js`
The API base path was an empty string `''`. This meant all requests were 
going to the wrong URL like `/login` instead of `/api/login`.
We changed it to `const API = '/api'` so all requests go to the correct path.

---

### Bug 11 — Duplicate DELETE route
**File:** `src/routes/tasks.js`
There were two identical DELETE routes defined for `/:id`. Having two 
routes doing the same thing is redundant and confusing for anyone 
reading the code.
We removed the duplicate and kept only one clean DELETE route.

---

### Bug 12 — Missing POST route for creating tasks
**File:** `src/routes/tasks.js`
There was no POST route to create a new task. This is a core feature 
of the application — without it users cannot add any tasks at all.
We added a proper POST route that saves the task to the database and 
returns the created task with status `201`.

---

## Security Fixes

### Fix 1 — Database password was hardcoded
**File:** `src/config.js`
The database username and password were written directly in the code. 
Anyone with access to the repository could see the credentials.
We moved them to environment variables so secrets are never in the code.

---

### Fix 2 — Database connection string was hardcoded
**File:** `src/db/connection.js`
The full database URL including the password was hardcoded in the file.
Same problem as above — credentials visible in source code.
We replaced it with environment variables.

---

### Fix 3 — JWT secret was hardcoded
**Files:** `src/middleware/auth.js`, `src/routes/auth.js`
The secret used to sign login tokens was hardcoded as 
`"super_secret_key_123"`. Anyone who sees this can create fake tokens 
and log in as any user.
We moved it to `process.env.JWT_SECRET`.

---

### Fix 4 — Login was vulnerable to SQL injection
**File:** `src/routes/auth.js`
The login query was built by joining user input directly into the SQL 
string. An attacker could type special characters to bypass login 
completely and access any account.
We replaced it with a parameterised query which is safe from this attack.

---

### Fix 5 — Passwords saved as plain text
**File:** `src/routes/auth.js`
User passwords were being saved to the database exactly as typed. If the 
database was ever leaked, every password would be exposed immediately.
We now hash passwords with `bcrypt` before saving, so even if the 
database leaks, passwords cannot be read.

---

### Fix 6 — Delete was vulnerable to SQL injection
**File:** `src/routes/tasks.js`
Same problem as Fix 4 — the delete query was built using the task ID 
from the URL directly, which is untrusted user input.
We replaced it with a parameterised query.

---

### Fix 7 — Error details exposed to users
**Files:** `src/app.js`, `src/routes/auth.js`, `src/routes/tasks.js`
Already covered in Bug 9 — stack traces were being sent to the client.
This is both a bug and a security issue so it is listed in both sections.

---

### Fix 8 — No input validation on forms
**Files:** `src/routes/auth.js`, `src/routes/tasks.js`
The API was accepting requests with missing or empty fields and passing 
them straight to the database. This caused confusing errors.
We added clear validation — required fields are checked, email format is 
validated, and password must be at least 8 characters with uppercase, 
number, and special character.

---

## How to Run with Docker

**You need:** Docker Desktop installed and running.

**Step 1 — Clone the project:**
```bash
git clone <your-repo-url>
cd se-skill-test
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
```
http://localhost:3000
```

**Step 5 — Stop the app:**
```bash
docker compose down
```

---

## How the CI/CD Pipeline Works

The pipeline file is at `.github/workflows/ci.yml`.
It runs automatically every time you push code to the `main` branch.

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

No extra secrets need to be set up — GitHub provides `GITHUB_TOKEN` 
automatically.

---

## Assumptions & Trade-offs

**Removed `morgan` instead of installing it:** Adding a half-configured 
logger would cause more confusion than it solves. A proper logger like 
`pino` would be the right choice for production.

**Used `bcrypt` instead of `argon2`:** Both are good choices. `bcrypt` 
works on all environments without extra setup and is widely understood 
by developers.

**Kept raw SQL instead of adding an ORM:** The original code used plain 
database queries. Adding Prisma or Knex was out of scope and the 
parameterised queries we have are already safe.

**CORS is open in development:** To make local development easy, all 
origins are allowed in development mode. In production, only the domain 
set in `ALLOWED_ORIGIN` is allowed.

<!-- CI/CD test -->