import React from 'react';
import {
  Calendar,
  Clipboard,
  Cog,
  HeartPulse,
  Hospital,
  Shield,
  Users,
  Clock,
  ChartBar,
  MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Button = ({ children, primary, onClick, ...props }) => (
  <button
    className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors ${
      primary
        ? "bg-teal-600 text-white hover:bg-teal-700"
        : "bg-white text-gray-700 hover:bg-gray-100"
    }`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ icon: Icon, title, description, dark = false }) => (
  <div className={`rounded-xl p-6 transition hover:-translate-y-1 ${
    dark
      ? 'border border-teal-200/15 bg-white/10 shadow-xl shadow-slate-950/30 backdrop-blur-sm hover:bg-white/15'
      : 'bg-white shadow-lg hover:shadow-xl'
  }`}>
    <Icon className={`mb-4 h-10 w-10 ${dark ? 'text-teal-300' : 'text-teal-600'}`} />

    <h3 className={`mb-3 text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>
      {title}
    </h3>

    <p className={`mb-5 ${dark ? 'text-teal-50/85' : 'text-gray-600'}`}>
      {description}
    </p>

    <Button primary>
      Learn More
    </Button>
  </div>
);

const Section = ({ children, bg }) => (
  <section className={`py-20 ${bg}`}>
    <div className="container mx-auto px-4">
      {children}
    </div>
  </section>
);

function Home() {

  const navigate = useNavigate();

  return (

    <div className="min-h-screen bg-gray-50">

      {/* ================= HEADER ================= */}

      <header className="border-b border-teal-300/15 bg-gradient-to-r from-slate-950 via-teal-950 to-blue-950 shadow-xl shadow-teal-950/30">

        <div className="container mx-auto px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">

            <img
              src="/images/pms-brand-hero.png"
              alt="PMS Patient Management System"
              className="h-14 w-24 rounded-lg object-cover object-center shadow-lg shadow-cyan-500/20"
            />

            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-wide text-white">PMS</h1>
              <p className="text-xs font-medium text-teal-200">Patient Management System</p>
            </div>

          </div>

          <div className="flex gap-3">

            <Button
              primary
              onClick={() => navigate("/login")}
            >
              Login
            </Button>

            <Button
              className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
              onClick={() => navigate("/signup")}
            >
              Register
            </Button>

          </div>

        </div>

      </header>

      {/* ================= HERO ================= */}

      <section
        className="relative isolate overflow-hidden bg-teal-950 py-24 sm:py-32"
        style={{ backgroundImage: "url('/images/pms-brand-hero.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-teal-950/85 to-blue-950/70" />
        <div className="container relative mx-auto px-6">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-teal-200/30 bg-white/10 px-4 py-1 text-sm font-medium text-teal-50 backdrop-blur-sm">
              Smarter care. Better patient experiences.
            </span>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
              Care that flows with your clinic.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-teal-50">
              PMS brings appointments, patient records, prescriptions and pharmacy operations together in one secure, easy-to-use system.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button primary onClick={() => navigate("/login")}>Access PMS</Button>
              <Button onClick={() => navigate("/signup")}>Create an account</Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-teal-50">
              <span>✓ Streamlined appointments</span>
              <span>✓ Connected patient care</span>
              <span>✓ Reliable clinic operations</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN MODULES ================= */}

      <Section bg="bg-gradient-to-br from-slate-950 via-teal-950 to-blue-950">

        <h2 className="text-4xl font-bold text-center text-white mb-12">

          Core PMS Modules

        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          <Card

            icon={Clipboard}

            title="Digital Reception"

            description="Replace the paper sign-in register with secure electronic patient check-in."

            dark

          />

          <Card

            icon={Hospital}

            title="Electronic Patient Records"

            description="Replace paper files with secure electronic patient records available instantly."

            dark

          />

          <Card

            icon={Users}

            title="Smart Queue Management"

            description="Automatically generate queue numbers and monitor waiting patients in real time."

            dark

          />

        </div>

      </Section>

      {/* ================= FEATURES ================= */}

      <Section bg="bg-gradient-to-br from-slate-950 via-teal-950 to-blue-950">

        <h2 className="text-4xl font-bold text-center text-white mb-12">

          Why PMS?

        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          <Card

            icon={Clipboard}

            title="Digital Check-In"

            description="Patients sign in electronically instead of using paper registers."

            dark

          />

          <Card

            icon={Users}

            title="Queue Management"

            description="Replace numbered queue cards with a digital queue system."

            dark

          />

          <Card

            icon={Calendar}

            title="Appointment Automation"

            description="Bookings are approved automatically based on doctor availability."

            dark

          />

          <Card

            icon={Shield}

            title="Secure Medical Records"

            description="Patient files remain safe and never get lost."

            dark

          />

          <Card

            icon={HeartPulse}

            title="Clinical History"

            description="Every consultation, diagnosis and prescription is stored permanently."

            dark

          />

          <Card

            icon={ChartBar}

            title="Reports"

            description="Generate daily, weekly and monthly clinic reports instantly."

            dark

          />

          <Card

            icon={Clock}

            title="Live Dashboard"

            description="Monitor waiting patients in real time."

            dark

          />

          <Card

            icon={Cog}

            title="Staff Management"

            description="Manage receptionists, nurses, doctors and pharmacists."

            dark

          />

          <Card

            icon={MessageCircle}

            title="Internal Chat Board"

            description="Allow receptionists, doctors and pharmacists to communicate instantly."

            dark

          />

        </div>

      </Section>

      {/* ================= FOOTER ================= */}

      <footer className="bg-teal-700 text-white py-8 mt-10">

        <div className="container mx-auto text-center">

          <h2 className="text-2xl font-bold">

            PMS Patient Management System

          </h2>

          <p className="mt-3">

            Digital Clinic Operations Platform

          </p>

          <p className="mt-2">

            Replacing Paper.
            <br />

            Reducing Queues.
            <br />

            Improving Patient Care.

          </p>

          <p className="mt-6">

            © 2026 PMS Patient Management System. All Rights Reserved.

          </p>

        </div>

      </footer>

    </div>

  );

}

export default Home;
