import React from 'react';

const BrandLogo = ({ className = 'h-10 w-10', title = 'ClinicFlow' }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={title}
  >
    <rect width="48" height="48" rx="14" fill="url(#clinicflow-gradient)" />
    <path
      d="M24 11.5V36.5M11.5 24H36.5"
      stroke="white"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M10.5 29.5H17L20.1 23.8L23.3 31.4L27.1 18.9L30.2 27.2H37.5"
      stroke="#BFF6EE"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="clinicflow-gradient" x1="7" y1="5" x2="42" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0F766E" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
    </defs>
  </svg>
);

export default BrandLogo;
