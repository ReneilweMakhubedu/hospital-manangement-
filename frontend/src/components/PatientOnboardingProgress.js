import React from 'react';

function PatientOnboardingProgress({ phase }) {
  const steps = [
    { label: 'Personal details', phase: 1 },
    { label: 'Medical information', phase: 2 },
    { label: 'Upload documents', phase: 3 },
  ];

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-3">
      {steps.map((step) => (
        <div key={step.phase} className={`rounded-3xl border p-4 text-center ${phase === step.phase ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white'}`}>
          <p className="text-sm font-semibold text-slate-600">Step {step.phase}</p>
          <p className="mt-2 text-sm font-bold text-slate-900">{step.label}</p>
        </div>
      ))}
    </div>
  );
}

export default PatientOnboardingProgress;
