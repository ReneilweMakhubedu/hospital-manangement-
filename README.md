# ClinicFlow Hospital Management System

ClinicFlow is a React and Express application for managing core clinic operations. It uses PostgreSQL through Neon.

## Included modules

- Role-based sign-up and login for patients, doctors, and administrators
- Patient records and appointment scheduling
- Doctor profiles, appointments, and prescriptions
- Pharmacy inventory, low-stock alerts, and medication dispensing
- Admin reporting and staff management

## Requirements

- Node.js 18 or newer
- npm

## Run locally

Install all dependencies from the project root:

```bash
npm install
npm run install:all
```

Start both applications from the project root:

```bash
npm run dev
```

Open `http://localhost:3000`. The API runs at `http://localhost:5000`.

> On Windows systems where PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm` (for example, `npm.cmd start`).

## Data and configuration

Create `backend/.env` from `backend/.env.example`, then add your Neon connection string and a strong JWT secret:

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
```

Never commit `backend/.env`; each collaborator should use their own local environment file or a development database.

## Verification

Create a production frontend build with:

```bash
cd frontend
npm run build
```
