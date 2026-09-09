import React, { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  ChartBar,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Cog,
  HeartPulse,
  Hospital,
  Shield,
  Users,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { asiphileniPillars, brand } from '../brand';
import API_BASE, { API_ORIGIN } from '../api';

const Button = ({ children, primary, className = '', onClick, ...props }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
      primary
        ? 'bg-[#e41e1f] text-[#ffffff] hover:opacity-90'
        : 'border border-[#8b8b8b]/40 bg-[#ffffff] text-[#1f1f1f] hover:bg-[#f8f8f8]'
    } ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

const pillarIcons = {
  infrastructure: Building2,
  hr: Users,
  finance: Wallet,
  patient: HeartPulse,
  monitoring: ChartBar,
};

const fallbackSlides = [
  {
    _id: 'fallback-1',
    title: brand.name,
    subtitle: `${brand.tagline}. Built to support tertiary referral care and ${brand.programme}.`,
    ctaLabel: 'Access the system',
    ctaLink: '/login',
    imageUrl: null,
  },
];

function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}

function Home() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState(fallbackSlides);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/cms/hero`);
        const data = await response.json();
        if (!cancelled && response.ok && Array.isArray(data) && data.length > 0) {
          setSlides(data);
          setIndex(0);
        }
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Preload carousel images so slide changes stay sharp
  useEffect(() => {
    slides.forEach((item) => {
      const url = mediaUrl(item.imageUrl);
      if (!url) return;
      const preload = new Image();
      preload.src = url;
    });
  }, [slides]);

  const slide = slides[index] || fallbackSlides[0];
  const image = mediaUrl(slide.imageUrl);

  const go = (link) => {
    if (!link) {
      navigate('/login');
      return;
    }
    if (link.startsWith('http')) {
      window.location.assign(link);
      return;
    }
    navigate(link);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="border-b border-[#8b8b8b]/25 bg-[#ffffff]">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12 shrink-0" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-wide text-[#1f1f1f]">{brand.shortName}</h1>
              <p className="text-xs font-medium text-[#8b8b8b]">{brand.hospital}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button primary onClick={() => navigate('/login')}>
              Staff login
            </Button>
            <Button onClick={() => navigate('/signup')}>Register</Button>
          </div>
        </div>
      </header>

      <section className="relative isolate min-h-[78vh] overflow-hidden bg-[#1f1f1f]">
        {image ? (
          <img
            src={image}
            alt=""
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover object-center"
            style={{ imageRendering: 'auto' }}
            key={slide._id || index}
          />
        ) : (
          <div className="absolute inset-0 bg-[#f8f8f8]" aria-hidden />
        )}

        <div className="container relative mx-auto flex min-h-[78vh] flex-col justify-center px-6 py-20">
          <div className="max-w-3xl rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e41e1f]">
              {brand.hospital} · {brand.location}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#1f1f1f] sm:text-6xl">
              {slide.title || brand.name}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#8b8b8b]">
              {slide.subtitle || brand.tagline}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button primary onClick={() => go(slide.ctaLink || '/login')}>
                {slide.ctaLabel || 'Access the system'}
              </Button>
              <Button onClick={() => navigate('/signup')}>Create an account</Button>
            </div>
            <p className="mt-8 text-sm font-medium text-[#8b8b8b]">
              {brand.programmeLabel} — Infrastructure · HR · Finance · Patient Experience · Monitoring
            </p>
          </div>

          {slides.length > 1 && (
            <div className="mt-10 flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
                className="rounded-full border border-[#8b8b8b]/40 bg-[#ffffff] p-2 text-[#1f1f1f] hover:bg-[#f8f8f8]"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-2">
                {slides.map((item, i) => (
                  <button
                    key={item._id || i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-[#e41e1f]' : 'bg-[#8b8b8b]'}`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => setIndex((current) => (current + 1) % slides.length)}
                className="rounded-full border border-[#8b8b8b]/40 bg-[#ffffff] p-2 text-[#1f1f1f] hover:bg-[#f8f8f8]"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#ffffff] py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
              Five pillars of {brand.programme}
            </h2>
            <p className="mt-4 text-[#8b8b8b]">
              Every module in this system maps to a provincial turnaround pillar so hospital and DoH
              priorities stay visible.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {asiphileniPillars.map((pillar) => {
              const Icon = pillarIcons[pillar.id] || Hospital;
              return (
                <div
                  key={pillar.id}
                  className="rounded-xl border border-[#8b8b8b]/25 bg-[#f8f8f8] p-6 transition hover:border-[#e41e1f]"
                >
                  <Icon className="mb-4 h-10 w-10 text-[#e41e1f]" />
                  <h3 className="mb-2 text-xl font-bold text-[#1f1f1f]">{pillar.title}</h3>
                  <p className="mb-4 text-sm text-[#8b8b8b]">{pillar.description}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                    {pillar.modules.length} module{pillar.modules.length === 1 ? '' : 's'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f5f5] py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-[#1f1f1f] sm:text-4xl">
            Core hospital modules
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-[#8b8b8b]">
            Patient flow, clinical records, HR, finance, infrastructure, and provincial reporting —
            organised around the five #OperationAsiphileni pillars.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Clipboard,
                title: 'Digital reception & queue',
                body: 'Electronic check-in and real-time waiting list control for outpatient flow.',
              },
              {
                icon: Hospital,
                title: 'Electronic patient records',
                body: 'Secure role-based records to reduce lost files and support clinical continuity.',
              },
              {
                icon: Calendar,
                title: 'Appointments & pharmacy',
                body: 'Scheduling, prescriptions, and medication stock in one connected workflow.',
              },
              {
                icon: Shield,
                title: 'Role-based access',
                body: 'Patients, doctors, and administrators with authenticated, role-aware entry.',
              },
              {
                icon: Cog,
                title: 'Staff coordination',
                body: 'Internal chat and operational dashboards for day-to-day hospital coordination.',
              },
              {
                icon: ChartBar,
                title: 'Monitoring & reporting',
                body: 'Operational KPIs, DHIS2/HPRS-shaped exports, and provincial reporting support.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-[#8b8b8b]/25 bg-[#ffffff] p-6">
                <Icon className="mb-4 h-10 w-10 text-[#e41e1f]" />
                <h3 className="mb-2 text-xl font-bold text-[#1f1f1f]">{title}</h3>
                <p className="text-[#8b8b8b]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#8b8b8b]/25 bg-[#ffffff] py-10">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <BrandLogo className="h-10 w-10" />
            <h2 className="text-2xl font-bold text-[#1f1f1f]">{brand.shortName}</h2>
          </div>
          <p className="text-[#8b8b8b]">
            {brand.hospital} · Tertiary referral hospital, {brand.location}
          </p>
          <p className="mt-2 text-sm text-[#e41e1f]">{brand.programmeLabel}</p>
          <p className="mt-6 text-sm text-[#8b8b8b]">{brand.copyright}</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
