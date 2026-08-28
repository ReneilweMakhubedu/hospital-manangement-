import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  Clock3,
  Pill,
  MessageSquare,
  FileBarChart,
  Settings,
  Stethoscope,
  LogOut,
} from "lucide-react";
import BrandLogo from './BrandLogo';

const modules = [
  {
    title: "Digital Reception",
    description: "Register patients, digital check-in and queue generation.",
    icon: <UserPlus size={40} className="text-teal-600" />,
    route: "/reception",
  },
  {
    title: "Patient Management",
    description: "Electronic patient records and medical history.",
    icon: <Users size={40} className="text-teal-600" />,
    route: "/patient",
  },
  {
    title: "Healthcare Staff",
    description: "Manage doctors, nurses and reception staff.",
    icon: <Stethoscope size={40} className="text-teal-600" />,
    route: "/doctor",
  },
  {
    title: "Appointment Scheduling",
    description: "Book and approve clinic appointments.",
    icon: <Calendar size={40} className="text-teal-600" />,
    route: "/appointments",
  },
  {
    title: "Smart Queue",
    description: "Monitor waiting patients and now serving.",
    icon: <Clock3 size={40} className="text-teal-600" />,
    route: "/queue",
  },
  {
    title: "Pharmacy",
    description: "Medication dispensing and stock management.",
    icon: <Pill size={40} className="text-teal-600" />,
    route: "/pharmacy",
  },
  {
    title: "Staff Chat",
    description: "Internal communication between clinic staff.",
    icon: <MessageSquare size={40} className="text-teal-600" />,
    route: "/chat",
  },
  {
    title: "Reports",
    description: "Clinic reports, statistics and analytics.",
    icon: <FileBarChart size={40} className="text-teal-600" />,
    route: "/reports",
  },
];

export default function Admin() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-blue-950 flex">

      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-slate-950 via-teal-950 to-blue-950 text-white shadow-xl">

        <div className="p-6 border-b border-teal-600 [&>h1]:hidden">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <h2 className="text-3xl font-bold">PMS</h2>
          </div>
          <h1 className="text-3xl font-bold">🏥 PMS</h1>
          <p className="text-sm mt-2 text-teal-100">
            Digital Clinic Operations Platform
          </p>
        </div>

        <nav className="mt-6">

          <button className="flex items-center gap-3 w-full px-6 py-4 hover:bg-teal-600">
            <LayoutDashboard />
            Dashboard
          </button>

          <button
            onClick={() => navigate("/reception")}
            className="flex items-center gap-3 w-full px-6 py-4 hover:bg-teal-600"
          >
            <UserPlus />
            Digital Reception
          </button>

          <button
            onClick={() => navigate("/patient")}
            className="flex items-center gap-3 w-full px-6 py-4 hover:bg-teal-600"
          >
            <Users />
            Patients
          </button>

          <button
            onClick={() => navigate("/doctor")}
            className="flex items-center gap-3 w-full px-6 py-4 hover:bg-teal-600"
          >
            <Stethoscope />
            Healthcare Staff
          </button>

          <button
            onClick={() => navigate("/appointments")}
            className="flex items-center gap-3 w-full px-6 py-4 hover:bg-teal-600"
          >
            <Calendar />
            Appointments
          </button>

          <button
            onClick={() => navigate("/queue")}
            className="flex items-center gap-3 w-full px-6 py-4 hover:bg-teal-600"
          >
            <Clock3 />
            Smart Queue
          </button>

          <button
            onClick={() => navigate("/pharmacy")}
            className="flex items-center gap-3 w-full px-6 py-4 hover:bg-teal-600"
          >
            <Pill />
            Pharmacy
          </button>

          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-3 w-full px-6 py-4 hover:bg-teal-600"
          >
            <MessageSquare />
            Staff Chat
          </button>

          <button
            onClick={() => navigate("/reports")}
            className="flex items-center gap-3 w-full px-6 py-4 hover:bg-teal-600"
          >
            <FileBarChart />
            Reports
          </button>

          <button className="flex items-center gap-3 w-full px-6 py-4 hover:bg-teal-600">
            <Settings />
            Settings
          </button>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 w-full px-6 py-4 hover:bg-red-600 mt-8"
          >
            <LogOut />
            Logout
          </button>

        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10">

        <div className="rounded-xl border border-teal-200/15 bg-slate-900/70 p-8 text-white shadow-xl shadow-slate-950/30 backdrop-blur-sm mb-8">

          <h1 className="text-4xl font-bold text-white">
            PMS Dashboard
          </h1>

          <p className="text-teal-100/80 mt-3 text-lg">
            Digital Clinic Operations Platform
          </p>

          <p className="text-teal-300 font-semibold mt-2">
            Replacing Paper. Reducing Queues. Improving Patient Care.
          </p>

        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">

          <div className="rounded-xl border border-teal-200/15 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30 backdrop-blur-sm">
            <h3 className="text-teal-100/75">Registered Patients</h3>
            <p className="text-4xl font-bold text-teal-300">1,254</p>
          </div>

          <div className="rounded-xl border border-teal-200/15 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30 backdrop-blur-sm">
            <h3 className="text-teal-100/75">Today's Appointments</h3>
            <p className="text-4xl font-bold text-cyan-300">57</p>
          </div>

          <div className="rounded-xl border border-teal-200/15 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30 backdrop-blur-sm">
            <h3 className="text-teal-100/75">Patients Waiting</h3>
            <p className="text-4xl font-bold text-amber-300">19</p>
          </div>

          <div className="rounded-xl border border-teal-200/15 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30 backdrop-blur-sm">
            <h3 className="text-teal-100/75">Doctors On Duty</h3>
            <p className="text-4xl font-bold text-emerald-300">12</p>
          </div>

        </div>

        {/* Modules */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

          {modules.map((module, index) => (

            <div
              key={index}
              className="rounded-xl border border-teal-200/15 bg-slate-900/70 p-6 text-white shadow-lg shadow-slate-950/30 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-slate-800/80 hover:shadow-xl"
            >

              {module.icon}

              <h2 className="text-xl font-bold mt-4">
                {module.title}
              </h2>

              <p className="text-teal-100/75 mt-2">
                {module.description}
              </p>

              <button
                onClick={() => navigate(module.route)}
                className="mt-6 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg w-full"
              >
                Open Module
              </button>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}
