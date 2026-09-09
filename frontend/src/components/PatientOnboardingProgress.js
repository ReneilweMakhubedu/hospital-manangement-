import React from 'react';

function PatientOnboardingProgress({ step }) {
  const steps = [
    { label: 'Personal details', number: 1 },
    { label: 'Medical information', number: 2 },
    { label: 'Documents & consent', number: 3 },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((item) => (
        <div key={item.number} className={`rounded-3xl border p-4 text-center ${step === item.number ? 'border-[#e41e1f] bg-[#f8f8f8]' : 'border-[#8b8b8b]/30 bg-[#ffffff]'}`}>
          <p className="text-sm font-semibold text-[#8b8b8b]">Step {item.number}</p>
          <p className="mt-1 text-sm font-bold text-[#1f1f1f]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export default PatientOnboardingProgress;
