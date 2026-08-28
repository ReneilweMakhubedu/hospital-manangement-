import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3, FileText, HeartPulse, Settings, Bell, UserCircle2, LogOut, Edit2, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const times = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const API = 'http://localhost:5000/api';

function PatientDashboard() {
  const navigate = useNavigate();
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('token');
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', time: '' });
  const [status, setStatus] = useState({ type: '', message: '' });

  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

  // Load patient's appointments
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const response = await fetch(`${API}/patient/my-appointments`, { headers: headers() });
        if (response.ok) {
          const data = await response.json();
          setAppointments(Array.isArray(data) ? data : []);
        } else {
          setAppointments([]);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, [token]);

  // Reschedule appointment
  const handleReschedule = async (appointmentId) => {
    if (!editForm.date || !editForm.time) {
      setStatus({ type: 'error', message: 'Please select a date and time' });
      return;
    }

    try {
      const response = await fetch(`${API}/patient/appointments/${appointmentId}/reschedule`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ date: editForm.date, time: editForm.time })
      });

      const data = await response.json();
      if (response.ok) {
        setAppointments(appointments.map(a => a._id === appointmentId ? data : a));
        setEditingId(null);
        setEditForm({ date: '', time: '' });
        setStatus({ type: 'success', message: 'Appointment rescheduled successfully!' });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      } else {
        setStatus({ type: 'error', message: data.error || 'Unable to reschedule' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  // Cancel appointment
  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? The slot will be available for other patients.')) return;

    try {
      const response = await fetch(`${API}/patient/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: headers()
      });

      if (response.ok) {
        setAppointments(appointments.filter(a => a._id !== appointmentId));
        setStatus({ type: 'success', message: 'Appointment cancelled. Slot is now available for others.' });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      } else {
        const data = await response.json();
        setStatus({ type: 'error', message: data.error || 'Unable to cancel' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const cards = [
    { title: 'My Profile', description: 'View or update your personal information.', icon: UserCircle2, path: '/patient/onboarding' },
    { title: 'Medical Records', description: 'Review your health notes and visit history.', icon: FileText, path: '/medical-records' },
    { title: 'Prescriptions', description: 'View your active prescriptions and pharmacy orders.', icon: HeartPulse, path: '/pharmacy' },
    { title: 'Queue Status', description: 'Track your current waiting status at the clinic.', icon: Clock3, path: '/queue' },
    { title: 'Notifications', description: 'See alerts from doctors and clinic staff.', icon: Bell, path: '/patient/onboarding' },
    { title: 'Settings', description: 'Manage your account preferences.', icon: Settings, path: '/settings' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-blue-950">
      {/* Header/Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-slate-950 via-teal-950 to-blue-950 text-white shadow-xl overflow-y-auto">
        <div className="p-6 border-b border-teal-600 [&>h1]:hidden">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <h2 className="text-3xl font-bold">PMS</h2>
          </div>
          <h1 className="text-3xl font-bold">🏥 PMS</h1>
          <p className="text-sm mt-2 text-teal-100">Patient Portal</p>
        </div>

        <nav className="mt-6 space-y-2 px-3">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-teal-200 uppercase">Account</p>
            <p className="text-sm text-teal-100 mt-1">{email}</p>
          </div>
          <button onClick={() => navigate('/patient/onboarding')} className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-teal-600 text-left">
            <UserCircle2 size={20} /> My Profile
          </button>
          <button onClick={() => navigate('/patient/dashboard')} className="flex items-center gap-3 w-full px-3 py-3 rounded-lg bg-teal-600 text-left">
            <CalendarDays size={20} /> Dashboard
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-teal-600 text-left mt-8">
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-72 px-8 py-8">
        {/* Header */}
        <section className="mb-8 rounded-3xl bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-white shadow-lg">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-100">Patient dashboard</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Welcome back{email ? `, ${email.split('@')[0]}` : ''}</h1>
            <p className="mt-3 text-sm text-teal-100">Manage your appointments, medical records, and health information.</p>
          </div>
        </section>

        {/* Status Messages */}
        {status.message && (
          <div className={`mb-6 rounded-lg px-4 py-3 ${status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {status.message}
          </div>
        )}

        {/* Appointments Section */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <CalendarDays size={20} className="text-teal-600" /> My Appointments
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading appointments...</div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-500">No appointments scheduled yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="px-6 py-5">
                  {editingId === appointment._id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">New Date</label>
                          <input
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">New Time</label>
                          <select
                            value={editForm.time}
                            onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                          >
                            <option value="">Select time</option>
                            {times.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReschedule(appointment._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                          <Check size={16} /> Confirm
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        >
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900">Dr. {appointment.doctorName}</h3>
                          <p className="text-sm text-slate-600">{appointment.specialty}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-teal-700">{appointment.date}</p>
                          <p className="text-sm text-slate-600">{appointment.time}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">{appointment.reason}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(appointment._id);
                            setEditForm({ date: appointment.date, time: appointment.time });
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                        >
                          <Edit2 size={16} /> Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(appointment._id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                        >
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-lg font-bold mb-4 text-slate-900">Other Options</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(({ title, description, icon: Icon, path }) => (
              <button
                type="button"
                key={title}
                onClick={() => navigate(path)}
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <Icon size={18} />
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default PatientDashboard;
