import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        {/* Main clinic system */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reception" element={<Reception />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/records" element={<MedicalRecords />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />

        {/* Staff */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/doctor" element={<Doctors />} />
        <Route path="/chat" element={<Chat />} />

        {/* Patient pages */}
        <Route
          path="/patient/dashboard"
          element={<Dashboard />}
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