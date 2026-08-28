import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  LoaderCircle,
  PhoneCall,
  RefreshCw,
  SkipForward,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/queue';

function Queue() {
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    waiting: 0,
    called: 0,
    completed: 0,
    skipped: 0,
    total: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [status, setStatus] = useState({
    type: '',
    message: ''
  });

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  });

  // ==========================================
  // LOAD QUEUE
  // ==========================================
  const loadQueue = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load queue');
      }

      setQueue(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==========================================
  // LOAD STATISTICS
  // ==========================================
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/stats`, {
        headers: getHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Unable to load queue statistics:', error);
    }
  }, []);

  // ==========================================
  // LOAD EVERYTHING
  // ==========================================
  const loadEverything = useCallback(async () => {
    await Promise.all([
      loadQueue(),
      loadStats()
    ]);
  }, [loadQueue, loadStats]);

  useEffect(() => {
    loadEverything();
  }, [loadEverything]);

  // ==========================================
  // CALL NEXT PATIENT
  // ==========================================
  const callNextPatient = async () => {
    setIsCalling(true);
    setStatus({
      type: '',
      message: ''
    });

    try {
      const response = await fetch(`${API_URL}/call-next`, {
        method: 'PUT',
        headers: getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to call next patient');
      }

      setStatus({
        type: 'success',
        message: `Now calling Queue #${data.queue.queueNumber} — ${data.queue.firstName} ${data.queue.lastName}`
      });

      await loadEverything();

    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setIsCalling(false);
    }
  };

  // ==========================================
  // UPDATE STATUS
  // ==========================================
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update queue');
      }

      setStatus({
        type: 'success',
        message: data.message
      });

      await loadEverything();

    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message
      });
    }
  };

  // ==========================================
  // STATUS BADGE
  // ==========================================
  const statusBadge = (currentStatus) => {
    const styles = {
      waiting: 'bg-amber-100 text-amber-800',
      called: 'bg-teal-100 text-teal-800',
      completed: 'bg-emerald-100 text-emerald-800',
      skipped: 'bg-slate-100 text-slate-600'
    };

    return (
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
          styles[currentStatus] || styles.waiting
        }`}
      >
        {currentStatus}
      </span>
    );
  };

  // ==========================================
  // PRIORITY BADGE
  // ==========================================
  const priorityBadge = (priority) => {
    if (priority === 'urgent') {
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
          URGENT
        </span>
      );
    }

    if (priority === 'high') {
      return (
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
          HIGH
        </span>
      );
    }

    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
        NORMAL
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8">

      <div className="mx-auto max-w-7xl">

        {/* BACK */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
              ClinicFlow
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Queue Management
            </h1>

            <p className="mt-2 text-slate-600">
              Manage today's patient queue and control patient flow.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              onClick={loadEverything}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={callNextPatient}
              disabled={isCalling || stats.waiting === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
            >
              {isCalling ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <PhoneCall size={17} />
              )}

              Call Next Patient
            </button>

          </div>
        </div>

        {/* STATUS MESSAGE */}
        {status.message && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 text-sm font-semibold ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {status.message}
          </div>
        )}

        {/* STATISTICS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Waiting"
            value={stats.waiting}
            icon={<Clock size={22} />}
          />

          <StatCard
            title="Currently Called"
            value={stats.called}
            icon={<PhoneCall size={22} />}
          />

          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle size={22} />}
          />

          <StatCard
            title="Total Today"
            value={stats.total}
            icon={<Users size={22} />}
          />

        </div>

        {/* QUEUE */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">

            <div>
              <h2 className="text-lg font-bold">
                Today's Queue
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Patients currently moving through the clinic.
              </p>
            </div>

            <div className="rounded-lg bg-teal-100 px-4 py-2 text-sm font-bold text-teal-800">
              {stats.waiting} waiting
            </div>

          </div>

          {isLoading ? (

            <div className="flex justify-center py-20">
              <LoaderCircle
                size={32}
                className="animate-spin text-teal-600"
              />
            </div>

          ) : queue.length === 0 ? (

            <div className="py-20 text-center">

              <Users
                size={45}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-lg font-bold text-slate-700">
                Queue is empty
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No patients have checked in today.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {queue.map((patient) => (

                <article
                  key={patient._id}
                  className={`px-5 py-5 transition hover:bg-slate-50 sm:px-6 ${
                    patient.status === 'called'
                      ? 'bg-teal-50'
                      : ''
                  }`}
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    {/* PATIENT INFO */}
                    <div className="flex items-center gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-lg font-black text-teal-800">
                        #{patient.queueNumber}
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-lg font-bold">
                            {patient.firstName} {patient.lastName}
                          </h3>

                          {priorityBadge(patient.priority)}

                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          ID: {patient.idNumber}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Reason: {patient.reason}
                        </p>

                      </div>

                    </div>

                    {/* STATUS */}
                    <div className="flex flex-wrap items-center gap-3">

                      {statusBadge(patient.status)}

                      {patient.status === 'called' && (
                        <button
                          onClick={() =>
                            updateStatus(
                              patient._id,
                              'completed'
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle size={16} />
                          Complete
                        </button>
                      )}

                      {patient.status === 'waiting' && (
                        <button
                          onClick={() =>
                            updateStatus(
                              patient._id,
                              'skipped'
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <SkipForward size={16} />
                          Skip
                        </button>
                      )}

                      {patient.status === 'skipped' && (
                        <button
                          onClick={() =>
                            updateStatus(
                              patient._id,
                              'waiting'
                            )
                          }
                          className="rounded-lg border border-teal-300 px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50"
                        >
                          Return to Queue
                        </button>
                      )}

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}

// ==========================================
// STAT CARD
// ==========================================
function StatCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-teal-100 p-3 text-teal-700">
          {icon}
        </div>

      </div>

    </div>
  );
}

export default Queue;