import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Save } from 'lucide-react';

import { apiFetch } from '../../auth';
import DoctorLayout from './DoctorLayout';

const emptyProfile = {
  firstName: '',
  lastName: '',
  email: '',
  specialty: '',
  designation: '',
  subSpecialty: '',
  clinicianCategory: '',
  specialistGrade: null,
  systemRoleCode: '',
  hpcsaRegistrationCategory: '',
  requiresCosign: false,
  department: '',
  qualifications: '',
  yearsExperience: '',
  licenseNumber: '',
  phoneNumber: '',
  workingHours: '08:00-16:00',
  availableToday: true,
  consultationNotesTemplate: 'SOAP',
};

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/doctor/profile', { navigate });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Unable to load profile');
        }
        const data = await res.json();
        if (!cancelled) {
          setForm((f) => ({
            ...f,
            ...data,
            yearsExperience:
              data.yearsExperience != null ? String(data.yearsExperience) : f.yearsExperience,
            availableToday:
              data.availableToday != null ? Boolean(data.availableToday) : f.availableToday,
          }));
        }
      } catch (error) {
        if (!cancelled) setStatus({ type: 'error', message: error.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        ...form,
        yearsExperience:
          form.yearsExperience === '' || form.yearsExperience == null
            ? null
            : Number(form.yearsExperience),
      };
      const res = await apiFetch('/doctor/profile', {
        navigate,
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save profile');
      setForm((f) => ({
        ...f,
        ...data,
        yearsExperience:
          data.yearsExperience != null ? String(data.yearsExperience) : f.yearsExperience,
      }));
      setStatus({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, name, type = 'text', ...rest }) => (
    <label className="block text-sm font-semibold text-[#1f1f1f]">
      {label}
      <input
        name={name}
        type={type}
        value={form[name] ?? ''}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#8b8b8b]/200 focus:ring-2 focus:ring-[#e41e1f]"
        {...rest}
      />
    </label>
  );

  const ReadOnly = ({ label, value, mono }) => (
    <div className="rounded-lg border border-[#8b8b8b]/30 bg-[#f8f8f8] px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">{label}</p>
      <p className={`mt-1 text-sm text-[#1f1f1f] ${mono ? 'font-mono font-semibold' : 'font-medium'}`}>
        {value || '—'}
      </p>
    </div>
  );

  return (
    <DoctorLayout
      title="Profile"
      subtitle="Professional details, specialty, department, licence, and clinic availability."
    >
      {status.message && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${
            status.type === 'error' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
          }`}
        >
          {status.message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={20} /> Loading profile…
        </div>
      ) : (
        <form onSubmit={save} className="space-y-6">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Identity</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" name="firstName" required />
              <Field label="Last name" name="lastName" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Phone" name="phoneNumber" type="tel" />
            </div>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">HPCSA credentialing</h2>
            <p className="mb-4 text-sm text-[#8b8b8b]">
              Assigned by hospital admin. Contact HR to change speciality, grade, or system role.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadOnly label="Clinician category" value={form.clinicianCategory} />
              <ReadOnly
                label="Grade"
                value={form.specialistGrade != null ? `Grade ${form.specialistGrade}` : 'N/A'}
              />
              <ReadOnly label="Designation" value={form.designation} />
              <ReadOnly label="Sub-speciality" value={form.subSpecialty || '—'} />
              <ReadOnly label="System role code" value={form.systemRoleCode} mono />
              <ReadOnly label="HPCSA registration" value={form.hpcsaRegistrationCategory} />
              {form.requiresCosign && (
                <p className="sm:col-span-2 rounded-lg bg-[#f8f8f8] px-3 py-2 text-sm text-[#1f1f1f]">
                  Intern cosign required for prescriptions and selected clinical actions.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Professional</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Specialty" name="specialty" readOnly />
              <Field label="Department" name="department" />
              <Field label="Qualifications" name="qualifications" />
              <Field label="Years experience" name="yearsExperience" type="number" min="0" />
              <Field label="Licence / HPCSA number" name="licenseNumber" readOnly />
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Default note template
                <select
                  name="consultationNotesTemplate"
                  value={form.consultationNotesTemplate || 'SOAP'}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                >
                  <option value="SOAP">SOAP</option>
                  <option value="NARRATIVE">NARRATIVE</option>
                  <option value="BRIEF">BRIEF</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Clinic hours</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Working hours" name="workingHours" placeholder="08:00-16:00" />
              <label className="flex items-start gap-3 rounded-xl border border-[#8b8b8b]/30 bg-[#f8f8f8] px-4 py-3 text-sm sm:mt-6">
                <input
                  type="checkbox"
                  name="availableToday"
                  checked={Boolean(form.availableToday)}
                  onChange={onChange}
                  className="mt-1 h-4 w-4 rounded border-[#8b8b8b]/40 text-[#e41e1f] focus:ring-[#e41e1f]"
                />
                <span>
                  <span className="font-semibold text-[#1f1f1f]">Available today</span>
                  <span className="mt-0.5 block text-xs text-[#8b8b8b]">
                    Shown on the clinician schedule and booking views
                  </span>
                </span>
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e41e1f] px-5 py-3 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      )}
    </DoctorLayout>
  );
}
