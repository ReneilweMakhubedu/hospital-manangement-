import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Pencil,
  Plus,
  RefreshCw,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../auth';
import { brand } from '../brand';
import HrLayout from './hr/HrLayout';
import {
  CLINICIAN_CATEGORIES,
  HPCSA_SPECIALITIES,
  HPCSA_SUB_SPECIALITIES,
  SPECIALIST_GRADES,
  designationFor,
  deriveSystemRoleCode,
  gradeApplicable,
  hpcsaCategoryLabel,
  requiresCosign,
} from '../hpcsa';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  licenseNumber: '',
  clinicianCategory: 'SPECIALIST',
  specialty: 'Internal Medicine',
  designation: 'Physician',
  subSpecialty: '',
  specialistGrade: '1',
  department: '',
  qualifications: '',
  yearsExperience: '',
  workingHours: '08:00-16:00',
  systemRoleCode: '',
  hpcsaRegistrationCategory: '',
};

function enrichForm(partial) {
  const next = { ...emptyForm, ...partial };
  const specialty = next.specialty;
  next.designation = designationFor(specialty) || next.designation;
  next.systemRoleCode = deriveSystemRoleCode(
    next.clinicianCategory,
    gradeApplicable(next.clinicianCategory) ? Number(next.specialistGrade || 1) : null,
    specialty
  );
  next.hpcsaRegistrationCategory = hpcsaCategoryLabel(next.clinicianCategory, specialty);
  return next;
}

export default function HrDoctors() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(() => enrichForm({}));
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/doctors', { navigate });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to load doctors');
      setDoctors(Array.isArray(data) ? data : []);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to load doctors' });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const filteredSubs = useMemo(() => {
    if (!form.specialty) return HPCSA_SUB_SPECIALITIES;
    return HPCSA_SUB_SPECIALITIES.filter(
      (s) =>
        s.parentSpeciality === 'Various' ||
        s.parentSpeciality.includes(form.specialty) ||
        form.specialty.includes(s.parentSpeciality.split(' / ')[0])
    );
  }, [form.specialty]);

  const showGrade = gradeApplicable(form.clinicianCategory);
  const cosign = requiresCosign(form.clinicianCategory);

  const updateField = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'specialty') {
        next.designation = designationFor(value);
        if (value === 'General Practice') {
          next.clinicianCategory = 'GP';
          next.specialistGrade = '';
          next.subSpecialty = '';
        }
      }
      if (name === 'clinicianCategory') {
        if (!gradeApplicable(value)) {
          next.specialistGrade = '';
        } else if (!next.specialistGrade) {
          next.specialistGrade = '1';
        }
        if (value !== 'SUB_SPECIALIST') {
          // keep subSpecialty optional for specialists too
        }
      }
      next.systemRoleCode = deriveSystemRoleCode(
        next.clinicianCategory,
        gradeApplicable(next.clinicianCategory) ? Number(next.specialistGrade || 1) : null,
        next.specialty
      );
      next.hpcsaRegistrationCategory = hpcsaCategoryLabel(next.clinicianCategory, next.specialty);
      next.designation = designationFor(next.specialty) || next.designation;
      return next;
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(enrichForm({}));
  };

  const startEdit = (doctor) => {
    setEditingId(doctor.id || doctor._id);
    setForm(
      enrichForm({
        firstName: doctor.firstName || '',
        lastName: doctor.lastName || '',
        email: doctor.email || '',
        phoneNumber: doctor.phoneNumber || '',
        password: '',
        licenseNumber: doctor.licenseNumber || '',
        clinicianCategory: doctor.clinicianCategory || 'SPECIALIST',
        specialty: doctor.specialty || 'Internal Medicine',
        designation: doctor.designation || '',
        subSpecialty: doctor.subSpecialty || '',
        specialistGrade: doctor.specialistGrade != null ? String(doctor.specialistGrade) : '1',
        department: doctor.department || '',
        qualifications: doctor.qualifications || '',
        yearsExperience: doctor.yearsExperience != null ? String(doctor.yearsExperience) : '',
        workingHours: doctor.workingHours || '08:00-16:00',
        systemRoleCode: doctor.systemRoleCode || '',
        hpcsaRegistrationCategory: doctor.hpcsaRegistrationCategory || '',
      })
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        licenseNumber: form.licenseNumber.trim(),
        clinicianCategory: form.clinicianCategory,
        specialty: form.specialty,
        designation: form.designation,
        subSpecialty: form.subSpecialty || null,
        specialistGrade: showGrade ? Number(form.specialistGrade || 1) : null,
        department: form.department.trim() || null,
        qualifications: form.qualifications.trim() || null,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null,
        workingHours: form.workingHours.trim() || null,
        systemRoleCode: form.systemRoleCode,
        hpcsaRegistrationCategory: form.hpcsaRegistrationCategory,
        requiresCosign: cosign,
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      if (editingId) {
        const res = await apiFetch(`/admin/doctors/${editingId}`, {
          navigate,
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Unable to update doctor');
        setStatus({ type: 'success', message: 'Doctor credentials updated.' });
      } else {
        if (!payload.password) {
          throw new Error('Temporary password is required for new doctors');
        }
        const res = await apiFetch('/admin/add-doctor', {
          navigate,
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Unable to add doctor');
        setStatus({ type: 'success', message: 'Doctor account created with HPCSA role mapping.' });
      }
      resetForm();
      await loadDoctors();
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to save doctor' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrLayout
      title="Clinician credentialing"
      subtitle={`${brand.hospital} · HPCSA specialities & grade roles`}
      actions={
        <button
          type="button"
          onClick={loadDoctors}
          className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f]"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      }
    >
      <div className="space-y-8">
        {status.message && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              status.type === 'error' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
            }`}
          >
            {status.message}
          </div>
        )}

        <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-lg bg-[#f8f8f8] p-3 text-[#e41e1f]">
              {editingId ? <Pencil size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1f1f1f]">
                {editingId ? 'Update clinician account' : 'Create clinician account'}
              </h2>
              <p className="mt-1 text-sm text-[#8b8b8b]">
                Assign HPCSA speciality, designation, grade (1–3), and a system role code used for access
                mapping. Login role remains <span className="font-semibold">doctor</span>.
              </p>
              <p className="mt-2 text-xs text-[#8b8b8b]">
                Note: in South Africa, <strong>Physician</strong> means Internal Medicine specialist — not a GP.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="First name" required value={form.firstName} onChange={(v) => updateField('firstName', v)} />
            <Field label="Last name" required value={form.lastName} onChange={(v) => updateField('lastName', v)} />
            <Field
              label="Work email"
              type="email"
              required
              value={form.email}
              onChange={(v) => updateField('email', v)}
            />
            <Field label="Phone" required value={form.phoneNumber} onChange={(v) => updateField('phoneNumber', v)} />
            <Field
              label="HPCSA / practice number"
              required
              value={form.licenseNumber}
              onChange={(v) => updateField('licenseNumber', v)}
            />
            <Field
              label={editingId ? 'Reset password (optional)' : 'Temporary password'}
              type="password"
              required={!editingId}
              value={form.password}
              onChange={(v) => updateField('password', v)}
            />

            <Select
              label="Clinician category"
              value={form.clinicianCategory}
              onChange={(v) => updateField('clinicianCategory', v)}
              options={CLINICIAN_CATEGORIES.map((c) => ({ value: c.code, label: c.title }))}
            />

            <Select
              label="HPCSA speciality"
              value={form.specialty}
              onChange={(v) => updateField('specialty', v)}
              options={HPCSA_SPECIALITIES.map((s) => ({
                value: s.speciality,
                label: `${s.speciality} — ${s.designation}`,
              }))}
            />

            <Field label="Designation" value={form.designation} onChange={(v) => updateField('designation', v)} />

            <Select
              label="Sub-speciality (optional)"
              value={form.subSpecialty}
              onChange={(v) => updateField('subSpecialty', v)}
              options={[
                { value: '', label: 'None' },
                ...filteredSubs.map((s) => ({
                  value: s.name,
                  label: `${s.name} (${s.parentSpeciality})`,
                })),
              ]}
            />

            {showGrade ? (
              <Select
                label="Grade"
                value={form.specialistGrade}
                onChange={(v) => updateField('specialistGrade', v)}
                options={SPECIALIST_GRADES.map((g) => ({
                  value: g,
                  label: `Grade ${g}${g === '2' ? ' (≥5 years typical)' : g === '3' ? ' (senior)' : ' (entry)'}`,
                }))}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-[#8b8b8b]/30 bg-[#f8f8f8] px-3 py-2 text-sm text-[#8b8b8b]">
                Grade N/A for this category
              </div>
            )}

            <Field label="Department" value={form.department} onChange={(v) => updateField('department', v)} />
            <Field
              label="Qualifications"
              value={form.qualifications}
              onChange={(v) => updateField('qualifications', v)}
            />
            <Field
              label="Years of experience"
              type="number"
              value={form.yearsExperience}
              onChange={(v) => updateField('yearsExperience', v)}
            />
            <Field label="Working hours" value={form.workingHours} onChange={(v) => updateField('workingHours', v)} />

            <div className="sm:col-span-2 lg:col-span-3 grid gap-3 rounded-xl border border-[#8b8b8b]/25 bg-[#f8f8f8]/60 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#e41e1f]">System role code</p>
                <p className="mt-1 font-mono text-sm font-bold text-[#1f1f1f]">{form.systemRoleCode || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#e41e1f]">HPCSA registration</p>
                <p className="mt-1 text-sm font-semibold text-[#1f1f1f]">{form.hpcsaRegistrationCategory || '—'}</p>
              </div>
              {cosign && (
                <p className="sm:col-span-2 flex items-center gap-2 text-sm text-[#1f1f1f]">
                  <BadgeCheck size={16} />
                  Intern prescriptions / notes require senior cosign.
                </p>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-5 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
              >
                <Stethoscope size={16} />
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create doctor account'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-[#8b8b8b]/30 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:bg-[#f8f8f8]"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Users className="text-[#e41e1f]" size={22} />
            <div>
              <h2 className="text-lg font-bold text-[#1f1f1f]">Registered clinicians</h2>
              <p className="text-sm text-[#8b8b8b]">{doctors.length} doctor account(s)</p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[#8b8b8b]">Loading…</p>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-[#8b8b8b]">No doctors yet. Create the first clinician above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#8b8b8b]/30 text-xs uppercase tracking-wide text-[#8b8b8b]">
                  <tr>
                    <th className="px-3 py-3">Clinician</th>
                    <th className="px-3 py-3">Category / grade</th>
                    <th className="px-3 py-3">Speciality</th>
                    <th className="px-3 py-3">System role</th>
                    <th className="px-3 py-3">HPCSA</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => (
                    <tr key={d.id || d._id} className="border-b border-[#8b8b8b]/20 align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-[#1f1f1f]">
                          Dr {d.firstName} {d.lastName}
                        </p>
                        <p className="text-xs text-[#8b8b8b]">{d.email}</p>
                        <p className="text-xs text-[#8b8b8b]">{d.licenseNumber}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{d.clinicianCategory || '—'}</p>
                        <p className="text-xs text-[#8b8b8b]">
                          {d.specialistGrade != null ? `Grade ${d.specialistGrade}` : 'No grade'}
                          {d.requiresCosign ? ' · cosign' : ''}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p>{d.specialty}</p>
                        <p className="text-xs text-[#8b8b8b]">{d.designation}</p>
                        {d.subSpecialty && <p className="text-xs text-[#e41e1f]">{d.subSpecialty}</p>}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs font-semibold text-[#1f1f1f]">
                        {d.systemRoleCode || '—'}
                      </td>
                      <td className="px-3 py-3 text-xs text-[#8b8b8b]">{d.hpcsaRegistrationCategory || '—'}</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => startEdit(d)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#8b8b8b]/30 px-3 py-1.5 text-xs font-semibold text-[#1f1f1f] hover:bg-[#f8f8f8]"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </HrLayout>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[#1f1f1f]">
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#8b8b8b]/30 px-3 py-2 text-[#1f1f1f] shadow-sm focus:border-[#8b8b8b]/200 focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[#1f1f1f]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 text-[#1f1f1f] shadow-sm focus:border-[#8b8b8b]/200 focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
      >
        {options.map((opt) => (
          <option key={opt.value || 'empty'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
