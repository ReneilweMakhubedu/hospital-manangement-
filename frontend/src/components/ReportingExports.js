import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileJson,
  LoaderCircle,
  RefreshCw,
  Table2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../auth';
import { brand } from '../brand';

export default function ReportingExports() {
  const navigate = useNavigate();
  const role = getRole();
  const isAdmin = role === 'admin';

  const [qualityChecks, setQualityChecks] = useState([]);
  const [mapping, setMapping] = useState([]);
  const [packPreview, setPackPreview] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [loadingPack, setLoadingPack] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [checksRes, mappingRes] = await Promise.all([
        apiFetch('/reporting/exports/quality-checks', { navigate }),
        apiFetch('/reporting/exports/mapping', { navigate }),
      ]);
      const [checksData, mappingData] = await Promise.all([
        checksRes.json().catch(() => []),
        mappingRes.json().catch(() => []),
      ]);
      if (!checksRes.ok) throw new Error(checksData.error || 'Unable to load quality checks');
      if (!mappingRes.ok) throw new Error(mappingData.error || 'Unable to load field mapping');

      setQualityChecks(
        Array.isArray(checksData) ? checksData : checksData.checks || checksData.qualityChecks || []
      );
      setMapping(Array.isArray(mappingData) ? mappingData : mappingData.mapping || []);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadPack = async (download) => {
    setLoadingPack(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch('/reporting/exports/dhis2-pack', { navigate });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to load DHIS2 pack');
      setPackPreview(data);
      if (download) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rfh-dhis2-pack-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus({ type: 'success', message: 'DHIS2 pack downloaded.' });
      } else {
        setStatus({ type: 'success', message: 'DHIS2 pack loaded for preview.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoadingPack(false);
    }
  };

  const checkPass = (check) => {
    const s = (check.status || check.result || '').toString().toUpperCase();
    return s === 'PASS' || s === 'OK' || check.passed === true;
  };

  return (
    <main className="min-h-screen bg-[#f8f8f8] px-5 py-8 text-[#1f1f1f] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(isAdmin ? '/admin' : '/doctor')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#e41e1f] hover:text-[#e41e1f]"
        >
          <ArrowLeft size={16} /> Back to {isAdmin ? 'admin' : 'doctor'}
        </button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#e41e1f]">
              {brand.shortName} · Monitoring &amp; Evaluation
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <FileJson className="h-8 w-8 text-[#e41e1f]" />
              DHIS2 / HPRS exports
            </h1>
            <p className="mt-2 text-[#8b8b8b]">
              Data quality checks, indicator field mapping, and downloadable DHIS2-shaped JSON pack.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2 text-sm font-semibold hover:bg-[#f8f8f8]"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              type="button"
              disabled={loadingPack}
              onClick={() => loadPack(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e41e1f] px-4 py-2 text-sm font-semibold text-[#e41e1f] hover:bg-[#f8f8f8] disabled:opacity-50"
            >
              {loadingPack ? <LoaderCircle size={16} className="animate-spin" /> : <FileJson size={16} />}
              View pack
            </button>
            <button
              type="button"
              disabled={loadingPack}
              onClick={() => loadPack(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
            >
              <Download size={16} /> Download JSON
            </button>
          </div>
        </div>

        {status.message && (
          <p
            role="alert"
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              status.type === 'success' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
            }`}
          >
            {status.message}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderCircle className="animate-spin text-[#e41e1f]" size={32} />
          </div>
        ) : (
          <>
            <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-bold">
                <CheckCircle2 size={18} className="text-[#e41e1f]" /> Quality checks
              </h2>
              {qualityChecks.length === 0 ? (
                <p className="mt-4 text-sm text-[#8b8b8b]">No quality checks returned.</p>
              ) : (
                <ul className="mt-4 divide-y divide-[#8b8b8b]/25">
                  {qualityChecks.map((check, index) => (
                    <li
                      key={check.id || check.code || check.name || index}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div>
                        <p className="font-medium">{check.name || check.code || `Check ${index + 1}`}</p>
                        {check.message || check.detail ? (
                          <p className="text-sm text-[#8b8b8b]">{check.message || check.detail}</p>
                        ) : null}
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          checkPass(check)
                            ? 'bg-[#f8f8f8] text-[#e41e1f]'
                            : 'bg-red-100 text-[#e41e1f]'
                        }`}
                      >
                        {checkPass(check) ? 'PASS' : check.status || 'FAIL'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mb-8 overflow-hidden rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold">
                  <Table2 size={18} className="text-[#e41e1f]" /> Field mapping
                </h2>
              </div>
              {mapping.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">No mapping rows.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">RFH field</th>
                        <th className="px-5 py-3 font-semibold">DHIS2 / HPRS</th>
                        <th className="px-5 py-3 font-semibold">Indicator / notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b8b8b]/25">
                      {mapping.map((row, index) => (
                        <tr key={row.id || row.source || index}>
                          <td className="px-5 py-3 font-mono text-xs">
                            {row.source || row.rfhField || row.localField || '—'}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs">
                            {row.target || row.dhis2Field || row.externalField || '—'}
                          </td>
                          <td className="px-5 py-3 text-[#8b8b8b]">
                            {row.indicator || row.notes || row.description || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {packPreview && (
              <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
                <h2 className="mb-3 font-bold">Pack preview</h2>
                <pre className="max-h-96 overflow-auto rounded-lg bg-[#f5f5f5] p-4 text-xs text-[#8b8b8b]">
                  {JSON.stringify(packPreview, null, 2)}
                </pre>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
