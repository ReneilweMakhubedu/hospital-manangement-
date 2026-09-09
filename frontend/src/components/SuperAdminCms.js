import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { brand } from '../brand';
import API_BASE, { API_ORIGIN } from '../api';
import { clearSession, getToken } from '../auth';

const emptyForm = {
  title: '',
  subtitle: '',
  ctaLabel: 'Access the system',
  ctaLink: '/login',
  sortOrder: '0',
  active: true,
};

function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}${path}`;
}

export default function SuperAdminCms() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const loadSlides = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/cms/hero/all`, {
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load slides');
      setSlides(Array.isArray(data) ? data : []);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setEditingId(null);
  };

  const startEdit = (slide) => {
    setEditingId(slide._id);
    setForm({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      ctaLabel: slide.ctaLabel || '',
      ctaLink: slide.ctaLink || '/login',
      sortOrder: String(slide.sortOrder ?? 0),
      active: Boolean(slide.active),
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onPickImage = (file) => {
    setImageFile(null);
    setStatus({ type: '', message: '' });
    if (!file) return;
    const url = URL.createObjectURL(file);
    const probe = new window.Image();
    probe.onload = () => {
      URL.revokeObjectURL(url);
      if (probe.naturalWidth < 1600 || probe.naturalHeight < 900) {
        setStatus({
          type: 'error',
          message: `This photo is ${probe.naturalWidth}×${probe.naturalHeight}. Hero images need at least 1600×900 (1920×1080 recommended) or they look blurry on large screens.`,
        });
        return;
      }
      setImageFile(file);
      setStatus({
        type: 'success',
        message: `Image ready (${probe.naturalWidth}×${probe.naturalHeight}).`,
      });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      setStatus({ type: 'error', message: 'Could not read that image file.' });
    };
    probe.src = url;
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      if (!editingId && !imageFile) {
        throw new Error('Add a high-resolution hero image (at least 1600×900).');
      }
      const body = new FormData();
      body.append('title', form.title);
      body.append('subtitle', form.subtitle);
      body.append('ctaLabel', form.ctaLabel);
      body.append('ctaLink', form.ctaLink);
      body.append('sortOrder', form.sortOrder);
      body.append('active', String(form.active));
      if (imageFile) body.append('image', imageFile);

      const url = editingId ? `${API_BASE}/cms/hero/${editingId}` : `${API_BASE}/cms/hero`;
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken() || ''}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save slide');
      setStatus({
        type: 'success',
        message: editingId ? 'Slide updated.' : 'Slide created. It will appear on the home page.',
      });
      resetForm();
      await loadSlides();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slide) => {
    if (!window.confirm(`Delete slide “${slide.title}”?`)) return;
    try {
      const response = await fetch(`${API_BASE}/cms/hero/${slide._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to delete slide');
      setStatus({ type: 'success', message: 'Slide deleted.' });
      await loadSlides();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#1f1f1f]">
      <header className="border-b border-[#8b8b8b]/25 bg-[#ffffff]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10 w-10" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#e41e1f]">Super Admin</p>
              <h1 className="text-lg font-bold text-[#1f1f1f]">{brand.shortName} website CMS</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/30 px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f8f8f8]"
            >
              <ArrowLeft size={16} /> View home
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="rounded-lg border border-[#8b8b8b]/30 px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f8f8f8]"
            >
              Hospital admin
            </button>
            <button
              type="button"
              onClick={() => {
                clearSession();
                navigate('/login');
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e41e1f]/40 bg-[#f8f8f8] px-3 py-2 text-sm text-[#e41e1f] hover:bg-[#f5f5f5]"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <section className="mb-8 rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#1f1f1f]">
            <ImagePlus className="text-[#e41e1f]" />
            {editingId ? 'Edit hero slide' : 'Add hero slide'}
          </h2>
          <p className="mt-2 text-sm text-[#8b8b8b]">
            Current slides look soft because many uploaded photos are under 800px wide. Use a clear
            landscape hospital photo at least{' '}
            <span className="font-semibold text-[#1f1f1f]">1600×900</span> (best:{' '}
            <span className="font-semibold text-[#1f1f1f]">1920×1080</span> JPG/PNG). Smaller files
            will be rejected.
          </p>

          <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold md:col-span-2">
              Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm text-[#1f1f1f] outline-none focus:border-[#8b8b8b]/200"
              />
            </label>
            <label className="block text-sm font-semibold md:col-span-2">
              Subtitle
              <textarea
                rows={3}
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm text-[#1f1f1f] outline-none focus:border-[#8b8b8b]/200"
              />
            </label>
            <label className="block text-sm font-semibold">
              Button label
              <input
                value={form.ctaLabel}
                onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm text-[#1f1f1f] outline-none focus:border-[#8b8b8b]/200"
              />
            </label>
            <label className="block text-sm font-semibold">
              Button link
              <input
                value={form.ctaLink}
                onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
                placeholder="/login"
                className="mt-1.5 w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm text-[#1f1f1f] outline-none focus:border-[#8b8b8b]/200"
              />
            </label>
            <label className="block text-sm font-semibold">
              Sort order
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm text-[#1f1f1f] outline-none focus:border-[#8b8b8b]/200"
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="h-4 w-4 rounded border-[#8b8b8b]"
              />
              Active on home page
            </label>
            <label className="block text-sm font-semibold md:col-span-2">
              Hero image (JPG, PNG, WEBP, GIF)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                className="mt-1.5 block w-full text-sm text-[#8b8b8b] file:mr-3 file:rounded-lg file:border-0 file:bg-[#e41e1f] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#ffffff]"
              />
              {imageFile && (
                <p className="mt-1 text-xs text-[#8b8b8b]">Selected: {imageFile.name}</p>
              )}
            </label>

            {status.message && (
              <p
                role="alert"
                className={`md:col-span-2 rounded-lg px-3 py-2 text-sm ${
                  status.type === 'success' ? 'bg-[#f8f8f8] text-[#8b8b8b]' : 'bg-[#f8f8f8] text-[#e41e1f]'
                }`}
              >
                {status.message}
              </p>
            )}

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold hover:bg-[#f8f8f8] disabled:opacity-60"
              >
                {saving ? <LoaderCircle className="animate-spin" size={16} /> : editingId ? <Pencil size={16} /> : <Plus size={16} />}
                {editingId ? 'Update slide' : 'Add slide'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-white/20 px-4 py-2.5 text-sm hover:bg-[#ffffff]"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Hero slides</h2>
            <button type="button" onClick={loadSlides} className="text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoaderCircle className="animate-spin text-[#e41e1f]" />
            </div>
          ) : slides.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#8b8b8b]">No slides yet. Add your first hero image above.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {slides.map((slide) => (
                <article key={slide._id} className="overflow-hidden rounded-xl border border-[#8b8b8b]/25 bg-[#f8f8f8]">
                  <div className="aspect-[16/9] bg-[#f5f5f5]">
                    {slide.imageUrl ? (
                      <img src={mediaUrl(slide.imageUrl)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#8b8b8b]">No image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-[#1f1f1f]">{slide.title}</h3>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          slide.active ? 'bg-[#f8f8f8] text-[#8b8b8b]' : 'bg-[#8b8b8b] text-[#8b8b8b]'
                        }`}
                      >
                        {slide.active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-[#8b8b8b]">{slide.subtitle}</p>
                    <p className="mt-2 text-xs text-[#8b8b8b]">
                      Order {slide.sortOrder} · {slide.ctaLabel} → {slide.ctaLink}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(slide)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#e41e1f] px-3 py-2 text-sm font-semibold hover:bg-[#f8f8f8]"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(slide)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#e41e1f]/80 px-3 py-2 text-sm font-semibold hover:bg-[#e41e1f]"
                      >
                        <Trash2 size={14} />
                      </button>
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
