import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import SignUp from "./components/Register";
import Dashboard from "./components/Dashboard";
import Patients from "./components/Patients";
import Appointments from "./components/Appointments";
import Reception from "./components/Reception";
import Queue from "./components/Queue";
import MedicalRecords from "./components/MedicalRecords";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import Admin from "./components/Admin";
import Doctors from "./components/Doctors";
import Chat from "./components/Chat";
import Home from "./components/Home";
import PatientOnboarding from "./components/PatientOnboarding";
import PatientDashboard from "./components/PatientDashboard";

function RoleRoute({ roles, children }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  if (!token) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to={role === 'patient' ? '/patient/dashboard' : role === 'doctor' ? '/doctor' : '/admin'} replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Main clinic system */}
        <Route path="/dashboard" element={<RoleRoute roles={["admin", "doctor"]}><Dashboard /></RoleRoute>} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reception" element={<Reception />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/records" element={<MedicalRecords />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />

        {/* Staff */}
        <Route path="/admin" element={<RoleRoute roles={["admin"]}><Admin /></RoleRoute>} />
        <Route path="/doctor" element={<RoleRoute roles={["doctor"]}><Doctors /></RoleRoute>} />
        <Route path="/chat" element={<Chat />} />

        {/* Patient pages */}
        <Route
          path="/patient/dashboard"
          element={<RoleRoute roles={["patient"]}><PatientDashboard /></RoleRoute>}
        />
        <Route
          path="/patient/onboarding"
          element={<RoleRoute roles={["patient"]}><PatientOnboarding /></RoleRoute>}
        />

        {/* Unknown page */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;