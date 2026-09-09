import React, { useEffect, useState } from 'react';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PatientOnboardingProgress from './PatientOnboardingProgress';

import API_BASE from '../api';
const API = `${API_BASE}/patient`;
const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  idNumber: '',
  dob: '',
  gender: '',
  phoneNumber: '',
  address: '',
  emergencyContact: '',
  allergies: '',
  existingConditions: '',
  currentMedications: '',
  previousMedicalInfo: '',
  nextOfKin: '',
  languagePreference: 'English',
  smsConsent: false,
  popiaConsent: false,
  preferredChannel: 'SMS',
};

function PatientOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [documents, setDocuments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetch(`${API}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          navigate('/login');
          return;
        }

        const data = await response.json();
        if (data.onboardingComplete) {
          navigate('/patient/dashboard');
          return;
        }

        setFormData((current) => ({ ...current, ...data }));
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
      } catch (error) {
        setStatus({ type: 'error', message: 'Unable to load onboarding data. Please refresh.' });
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const saveProfile = async (extra = {}) => {
    const token = localStorage.getItem('token');
    const payload = { ...formData, ...extra };
    const response = await fetch(`${API}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Unable to save onboarding information.');
    }

    return response.json();
  };

  const uploadDocuments = async () => {
    if (!selectedFiles.length) return null;

    const token = localStorage.getItem('token');
    const uploadData = new FormData();
    selectedFiles.forEach((file) => uploadData.append('documents', file));

    const response = await fetch(`${API}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: uploadData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Unable to upload documents.');
    }

    const result = await response.json();
    setDocuments(result.documents || []);
    setSelectedFiles([]);
    return result.documents;
  };

  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus({ type: '', message: '' });

    try {
      if (step < 3) {
        await saveProfile();
        setStep((current) => current + 1);
        setStatus({ type: 'success', message: 'Your information has been saved. Continue to the next step.' });
      } else {
        if (!formData.popiaConsent) {
          setStatus({
            type: 'error',
            message: 'Please confirm POPIA consent to complete registration.',
          });
          return;
        }
        await saveProfile({ onboardingComplete: true });
        localStorage.setItem('onboardingComplete', 'true');
        navigate('/patient/dashboard', { replace: true });
        if (selectedFiles.length) {
          try {
            await uploadDocuments();
          } catch (error) {
            console.error('Document upload failed after registration:', error);
          }
        }
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="First name" name="firstName" value={formData.firstName} onChange={handleChange} />
          <Field label="Last name" name="lastName" value={formData.lastName} onChange={handleChange} />
          <Field label="Email address" name="email" type="email" value={formData.email} onChange={handleChange} disabled />
          <Field label="ID number" name="idNumber" value={formData.idNumber} onChange={handleChange} />
          <Field label="Date of birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
          <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={[{ value: '', label: 'Select gender' }, { value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'other', label: 'Other' }]} />
          <Field label="Phone number" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} />
          <TextareaField label="Home address" name="address" value={formData.address} onChange={handleChange} />
          <TextareaField label="Emergency contact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} rows={3} />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <TextareaField label="Allergies" name="allergies" value={formData.allergies} onChange={handleChange} rows={3} />
          <TextareaField label="Existing medical conditions" name="existingConditions" value={formData.existingConditions} onChange={handleChange} rows={3} />
          <TextareaField label="Current medication" name="currentMedications" value={formData.currentMedications} onChange={handleChange} rows={3} />
          <TextareaField label="Previous medical information" name="previousMedicalInfo" value={formData.previousMedicalInfo} onChange={handleChange} rows={4} />
          <TextareaField label="Next of kin / emergency information" name="nextOfKin" value={formData.nextOfKin} onChange={handleChange} rows={3} />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Preferred language"
            name="languagePreference"
            value={formData.languagePreference || 'English'}
            onChange={handleChange}
            options={[
              { value: 'English', label: 'English' },
              { value: 'Afrikaans', label: 'Afrikaans' },
              { value: 'isiZulu', label: 'isiZulu' },
              { value: 'siSwati', label: 'siSwati' },
              { value: 'Xitsonga', label: 'Xitsonga' },
              { value: 'Sepedi', label: 'Sepedi' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          <SelectField
            label="Preferred channel"
            name="preferredChannel"
            value={formData.preferredChannel || 'SMS'}
            onChange={handleChange}
            options={[
              { value: 'SMS', label: 'SMS' },
              { value: 'WHATSAPP', label: 'WhatsApp' },
              { value: 'APP', label: 'App / portal' },
              { value: 'EMAIL', label: 'Email' },
            ]}
          />
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-[#8b8b8b]/30 bg-[#f8f8f8] px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="smsConsent"
            checked={Boolean(formData.smsConsent)}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-[#8b8b8b]/40 text-[#e41e1f] focus:ring-[#e41e1f]"
          />
          <span>
            <span className="font-semibold text-[#1f1f1f]">SMS reminders</span>
            <span className="mt-0.5 block text-xs text-[#8b8b8b]">
              Allow appointment and medication reminders by SMS
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#8b8b8b]/30 bg-[#f8f8f8] px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="popiaConsent"
            checked={Boolean(formData.popiaConsent)}
            onChange={handleChange}
            required
            className="mt-1 h-4 w-4 rounded border-[#8b8b8b]/40 text-[#e41e1f] focus:ring-[#e41e1f]"
          />
          <span>
            <span className="font-semibold text-[#1f1f1f]">POPIA consent (required)</span>
            <span className="mt-0.5 block text-xs text-[#8b8b8b]">
              I consent to Rob Ferreira Hospital processing my personal information for care and
              administration under POPIA.
            </span>
          </span>
        </label>

        <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#f8f8f8] p-4">
          <div className="flex items-center gap-3 text-[#1f1f1f]">
            <UploadCloud size={20} />
            <div>
              <p className="font-semibold">Upload documents</p>
              <p className="text-sm text-[#8b8b8b]">Add your ID and medical documents to complete registration.</p>
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-6 text-center text-sm font-medium text-[#8b8b8b] transition hover:border-[#8b8b8b]/200 hover:text-[#e41e1f]">
            <input type="file" name="documents" onChange={handleFileChange} multiple className="hidden" />
            Choose files or drag here
          </label>
          {selectedFiles.length > 0 && (
            <div className="mt-4 rounded-lg bg-[#ffffff] p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-[#1f1f1f]">Selected documents</p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-[#8b8b8b]">
                {selectedFiles.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
          {documents.length > 0 && (
            <div className="mt-4 rounded-lg bg-[#f8f8f8] p-4">
              <p className="mb-2 text-sm font-semibold text-[#1f1f1f]">Already uploaded documents</p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-[#8b8b8b]">
                {documents.map((doc, index) => (
                  <li key={`${doc.filename}-${index}`}>
                    <a target="_blank" rel="noreferrer" href={doc.url} className="text-[#e41e1f] hover:underline">
                      {doc.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-[#ffffff] p-6 shadow-xl sm:p-10">
        <button onClick={() => navigate('/login')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#8b8b8b] hover:text-[#1f1f1f]">
          <ArrowLeft size={16} /> Back to login
        </button>

        <div className="mb-8 rounded-3xl bg-[#f5f5f5] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[#e41e1f]">Patient onboarding</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1f1f1f]">{step === 1 ? 'Personal details' : step === 2 ? 'Medical information' : 'Documents & consent'}</h1>
          <p className="mt-2 text-sm text-[#8b8b8b]">Complete the {step === 1 ? 'personal details' : step === 2 ? 'medical information' : 'documents and consent'} section to finish your patient registration.</p>
        </div>

        <PatientOnboardingProgress step={step} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            {renderStep()}
          </div>

          {status.message && (
            <p className={`rounded-2xl px-4 py-3 text-sm ${status.type === 'success' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'}`}>
              {status.message}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {step > 1 && (
              <button type="button" onClick={() => setStep((current) => current - 1)} className="rounded-2xl border border-[#8b8b8b]/40 px-4 py-3 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#f5f5f5]">
                Back
              </button>
            )}
            <button type="submit" disabled={isSaving} className="rounded-2xl bg-[#e41e1f] px-5 py-3 text-sm font-semibold text-[#ffffff] transition hover:bg-[#e41e1f] disabled:cursor-not-allowed disabled:bg-[#8b8b8b]">
              {step < 3 ? 'Save and continue' : 'Complete registration'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({ label, name, type = 'text', value, onChange, disabled }) {
  return (
    <label className="block text-sm font-semibold text-[#1f1f1f]">
      {label}
      <input
        name={name}
        type={type}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className="mt-1 block w-full rounded-2xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-3 text-sm outline-none transition focus:border-[#8b8b8b]/200 focus:ring-2 focus:ring-[#e41e1f]"
      />
    </label>
  );
}

function TextareaField({ label, name, value, onChange, rows = 4 }) {
  return (
    <label className="block text-sm font-semibold text-[#1f1f1f]">
      {label}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="mt-1 block w-full rounded-2xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-3 text-sm outline-none transition focus:border-[#8b8b8b]/200 focus:ring-2 focus:ring-[#e41e1f]"
      />
    </label>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="block text-sm font-semibold text-[#1f1f1f]">
      {label}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full rounded-2xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-3 text-sm outline-none transition focus:border-[#8b8b8b]/200 focus:ring-2 focus:ring-[#e41e1f]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default PatientOnboarding;
