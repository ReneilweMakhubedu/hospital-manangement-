# ClinicFlow Hospital Management System

ClinicFlow is a React and Express application for managing core clinic operations. It uses a local SQLite database, so MongoDB is not required.

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

Install dependencies once in each application folder:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Start the backend in one terminal:

```bash
cd backend
node server.js
```

Start the frontend in another terminal:

```bash
cd frontend
npm start
```

Open `http://localhost:3000`. The API runs at `http://localhost:5000`.

> On Windows systems where PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm` (for example, `npm.cmd start`).

## Data and configuration

The database is automatically created at `backend/data/hospital.db`. Set a strong `JWT_SECRET` in `backend/.env` before using the application outside local development:

```env
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
```

The project’s current data layer is SQLite, not MongoDB; earlier documentation referring to Mongoose or a MongoDB connection string is obsolete.

## Verification

Create a production frontend build with:

```bash
cd frontend
npm run build
```
