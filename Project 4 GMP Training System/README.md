# GMP Training Management System

A full-stack pharmaceutical training management application with role-based access control and a 21 CFR Part 11–style immutable audit trail. Every system event — login, assignment, exam submission, evaluation, even viewing a report — is recorded with the performing user, action details, IP address, and a server-side timestamp.

> Built by an engineer with 8+ years in GMP-regulated pharmaceutical manufacturing (FDA / TGA / MHRA audit experience) — the workflow mirrors how site training is actually managed on a pharma site.

## Roles & permissions (hierarchical)

| Role | Capabilities |
|------|--------------|
| **User** | Log in, sit assessments within their scheduled window, track Completed / Assigned / Pending trainings |
| **Trainer** | Everything above + set assessment questions, set assessment schedules, evaluate submitted attempts (PASS/FAIL with remarks) |
| **DTC** (Departmental Training Coordinator) | Everything above + view all users' training status, create trainings, assign trainings to users or groups, notify trainers to evaluate and users to submit |
| **STC** (Site Training Coordinator) | Everything above + notify DTCs, view any user's full training report (report access is itself audited) |
| **Administrator** | Create users, set roles, view and print the audit trail. Deliberately **outside** the training hierarchy — segregation of duties |

## Training lifecycle

```
ASSIGNED ──(user submits assessment)──▶ PENDING ──(trainer records PASS)──▶ COMPLETED
   ▲                                       │
   └────────(trainer records FAIL — retraining)
```

## Tech stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt, hierarchical RBAC middleware

## GMP / data-integrity features

- Immutable audit trail: the API exposes **no update or delete** routes for audit records
- Unambiguous GMP-format timestamps everywhere: `10-Jun-2026 14:32:05 (GMT+06:00)`
- Old → new values logged on role changes; failed logins recorded
- Assessment answers are never sent to the browser; scoring is server-side
- Printable controlled-document audit trail report
- Submissions blocked outside the scheduled assessment window (server-enforced)

## Setup

```bash
# 1. Database
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env        # set a real JWT_SECRET
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev                 # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Demo accounts (password `Pharma@123`)

| Email | Role |
|-------|------|
| admin@pharma.com | Administrator |
| stc@pharma.com | Site Training Coordinator |
| dtc@pharma.com | Departmental Training Coordinator |
| trainer@pharma.com | Trainer |
| user1@pharma.com / user2@pharma.com | Users |

## Live demo

_Deployment link placeholder — Vercel (frontend) + Railway (API + PostgreSQL)_

## Screenshots

_Screenshot placeholder — dashboard, exam screen, evaluation queue, printable audit trail_
