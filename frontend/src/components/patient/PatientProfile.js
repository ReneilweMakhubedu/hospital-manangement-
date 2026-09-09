import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Save } from 'lucide-react';

import { apiFetch } from '../../auth';
import PatientLayout from './PatientLayout';

const emptyProfile = {
  firstName: '',
  lastName: '',
  email: '',
  idNumber: '',
  dob: '',
  gender: '',
  phoneNumber: '',
  address: '',
  bloodType: '',
  allergies: '',
  existingConditions: '',
  currentMedications: '',
  previousMedicalInfo: '',
  emergencyContact: '',
  nextOfKin: '',
  nextOfKinPhone: '',
  nextOfKinRelation: '',
  languagePreference: 'English',
  accessibilityNeeds: '',
  primaryFacility: 'Rob Ferreira Hospital',
  ccmddEnrolled: false,
  ccmddPickupPoint: '',
  nextCollectionDate: '',
  popiaConsent: false,
  smsConsent: false,
  whatsappConsent: false,
  marketingConsent: false,
  dataSharingConsent: false,
  preferredChannel: 'SMS',
};

export default function PatientProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/patient/profile', { navigate });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Unable to load profile');
        }
        const data = await res.json();
        if (!cancelled) setForm((f) => ({ ...f, ...data }));
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
      const res = await apiFetch('/patient/profile', {
        navigate,
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save profile');
      setForm((f) => ({ ...f, ...data }));
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

  const TextArea = ({ label, name, rows = 3 }) => (
    <label className="block text-sm font-semibold text-[#1f1f1f] sm:col-span-2">
      {label}
      <textarea
        name={name}
        value={form[name] ?? ''}
        onChange={onChange}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#8b8b8b]/200 focus:ring-2 focus:ring-[#e41e1f]"
      />
    </label>
  );

  const Check = ({ label, name, hint }) => (
    <label className="flex items-start gap-3 rounded-xl border border-[#8b8b8b]/30 bg-[#f8f8f8] px-4 py-3 text-sm">
      <input
        type="checkbox"
        name={name}
        checked={Boolean(form[name])}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-[#8b8b8b]/40 text-[#e41e1f] focus:ring-[#e41e1f]"
      />
      <span>
        <span className="font-semibold text-[#1f1f1f]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-[#8b8b8b]">{hint}</span>}
      </span>
    </label>
  );

  return (
    <PatientLayout
      title="Profile"
      subtitle="Personal details, health information, next of kin, accessibility, CCMDD, and consents."
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
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Personal</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" name="firstName" />
              <Field label="Last name" name="lastName" />
              <Field label="Email" name="email" type="email" />
              <Field label="ID number" name="idNumber" />
              <Field label="Date of birth" name="dob" type="date" />
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Gender
                <select
                  name="gender"
                  value={form.gender || ''}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                >
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <Field label="Phone number" name="phoneNumber" type="tel" />
              <Field label="Blood type" name="bloodType" />
              <TextArea label="Home address" name="address" />
            </div>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Health</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextArea label="Allergies" name="allergies" />
              <TextArea label="Existing conditions" name="existingConditions" />
              <TextArea label="Current medications" name="currentMedications" />
              <TextArea label="Previous medical information" name="previousMedicalInfo" />
            </div>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Next of kin</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextArea label="Next of kin / emergency details" name="nextOfKin" />
              <TextArea label="Emergency contact" name="emergencyContact" />
              <Field label="Next of kin phone" name="nextOfKinPhone" type="tel" />
              <Field label="Relationship" name="nextOfKinRelation" />
            </div>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Language & accessibility</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Preferred language
                <select
                  name="languagePreference"
                  value={form.languagePreference || 'English'}
                  onChange={onChange}
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
                >
                  {['English', 'Afrikaans', 'isiZulu', 'siSwati', 'Xitsonga', 'Sepedi', 'Other'].map(
                    (lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    )
                  )}
                </select>
              </label>
              <Field label="Primary facility" name="primaryFacility" />
              <TextArea label="Accessibility needs" name="accessibilityNeeds" />
            </div>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">CCMDD</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Check
                label="Enrolled in CCMDD"
                name="ccmddEnrolled"
                hint="Chronic medication delivery / pickup programme"
              />
              <Field label="Pickup point" name="ccmddPickupPoint" />
              <Field label="Next collection date" name="nextCollectionDate" type="date" />
            </div>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#1f1f1f]">Consents & channel</h2>
            <div className="mb-4 grid gap-3">
              <Check
                label="POPIA consent"
                name="popiaConsent"
                hint="I consent to processing of my personal information for care under POPIA"
              />
              <Check label="SMS reminders" name="smsConsent" />
              <Check label="WhatsApp reminders" name="whatsappConsent" />
              <Check label="Marketing messages" name="marketingConsent" />
              <Check
                label="Data sharing for referrals"
                name="dataSharingConsent"
                hint="Allow sharing clinical information with referred facilities when needed"
              />
            </div>
            <label className="block text-sm font-semibold text-[#1f1f1f]">
              Preferred communication channel
              <select
                name="preferredChannel"
                value={form.preferredChannel || 'SMS'}
                onChange={onChange}
                className="mt-1 w-full max-w-xs rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm"
              >
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="APP">App / portal</option>
                <option value="EMAIL">Email</option>
              </select>
            </label>
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
    </PatientLayout>
  );
}
