import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';

import { apiFetch } from '../../auth';
import FinanceLayout from './FinanceLayout';

const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'PART_PAID', 'PAID', 'WRITTEN_OFF', 'IN_COLLECTION'];
const CLASSIFICATIONS = ['SELF_PAY', 'MEDICAL_SCHEME', 'GOVERNMENT', 'FREE_CARE'];
const DEBT_CATEGORIES = ['SELF_PAYING', 'GOVERNMENT', 'MEDICAL_SCHEME', 'MUNICIPAL', 'OTHER'];
const AGE_BUCKETS = ['CURRENT', '30', '60', '90', '120_PLUS'];
const DEBT_STATUSES = ['OPEN', 'IN_COLLECTION', 'ESCALATED', 'CLOSED'];

const emptyInvoice = {
  patientName: '',
  classification: 'SELF_PAY',
  medicalScheme: '',
  amount: '',
  amountPaid: '0',
  status: 'DRAFT',
  invoiceDate: '',
  dueDate: '',
  referenceNumber: '',
  notes: '',
};

const emptyDebt = {
  debtorCategory: 'SELF_PAYING',
  debtorName: '',
  amount: '',
  ageBucket: 'CURRENT',
  status: 'OPEN',
  notes: '',
};

function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(n);
}

function StatusBanner({ status }) {
  if (!status?.message) return null;
  return (
    <div
      className={`mb-6 rounded-xl px-4 py-3 text-sm ${
        status.type === 'error' ? 'bg-[#f8f8f8] text-[#e41e1f]' : 'bg-[#f8f8f8] text-[#e41e1f]'
      }`}
    >
      {status.message}
    </div>
  );
}

export default function FinanceBilling() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [debts, setDebts] = useState([]);
  const [debtorsSummary, setDebtorsSummary] = useState([]);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const [debtForm, setDebtForm] = useState(emptyDebt);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, debtRes, sumRes] = await Promise.all([
        apiFetch('/finance/billing/invoices', { navigate }),
        apiFetch('/finance/billing/debts', { navigate }),
        apiFetch('/finance/billing/debtors-summary', { navigate }),
      ]);
      const [invData, debtData, sumData] = await Promise.all([
        invRes.json().catch(() => []),
        debtRes.json().catch(() => []),
        sumRes.json().catch(() => []),
      ]);
      if (!invRes.ok) throw new Error(invData.error || 'Unable to load invoices');
      if (!debtRes.ok) throw new Error(debtData.error || 'Unable to load debts');
      setInvoices(Array.isArray(invData) ? invData : invData.invoices || []);
      setDebts(Array.isArray(debtData) ? debtData : debtData.debts || []);
      const summary = Array.isArray(sumData)
        ? sumData
        : sumData.categories || sumData.debtByCategory || [];
      setDebtorsSummary(summary);
      setStatus({ type: '', message: '' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const submitInvoice = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        patientName: invoiceForm.patientName.trim(),
        classification: invoiceForm.classification,
        medicalScheme: invoiceForm.medicalScheme.trim() || null,
        amount: Number(invoiceForm.amount),
        amountPaid: Number(invoiceForm.amountPaid || 0),
        status: invoiceForm.status,
        invoiceDate: invoiceForm.invoiceDate || null,
        dueDate: invoiceForm.dueDate || null,
        referenceNumber: invoiceForm.referenceNumber.trim() || null,
        notes: invoiceForm.notes.trim() || null,
      };
      const path = editingInvoiceId
        ? `/finance/billing/invoices/${editingInvoiceId}`
        : '/finance/billing/invoices';
      const res = await apiFetch(path, {
        navigate,
        method: editingInvoiceId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save invoice');
      setInvoiceForm(emptyInvoice);
      setEditingInvoiceId(null);
      setStatus({
        type: 'success',
        message: editingInvoiceId ? 'Invoice updated.' : 'Invoice created.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const submitDebt = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        debtorCategory: debtForm.debtorCategory,
        debtorName: debtForm.debtorName.trim(),
        amount: Number(debtForm.amount),
        ageBucket: debtForm.ageBucket,
        status: debtForm.status,
        notes: debtForm.notes.trim() || null,
      };
      const path = editingDebtId
        ? `/finance/billing/debts/${editingDebtId}`
        : '/finance/billing/debts';
      const res = await apiFetch(path, {
        navigate,
        method: editingDebtId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to save debt account');
      setDebtForm(emptyDebt);
      setEditingDebtId(null);
      setStatus({
        type: 'success',
        message: editingDebtId ? 'Debt account updated.' : 'Debt account recorded.',
      });
      await load();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const editInvoice = (inv) => {
    setEditingInvoiceId(inv.id || inv._id);
    setInvoiceForm({
      patientName: inv.patientName || '',
      classification: inv.classification || 'SELF_PAY',
      medicalScheme: inv.medicalScheme || '',
      amount: inv.amount != null ? String(inv.amount) : '',
      amountPaid: inv.amountPaid != null ? String(inv.amountPaid) : '0',
      status: inv.status || 'DRAFT',
      invoiceDate: inv.invoiceDate || '',
      dueDate: inv.dueDate || '',
      referenceNumber: inv.referenceNumber || '',
      notes: inv.notes || '',
    });
    setTab('invoices');
  };

  const editDebt = (debt) => {
    setEditingDebtId(debt.id || debt._id);
    setDebtForm({
      debtorCategory: debt.debtorCategory || 'SELF_PAYING',
      debtorName: debt.debtorName || '',
      amount: debt.amount != null ? String(debt.amount) : '',
      ageBucket: debt.ageBucket || 'CURRENT',
      status: debt.status || 'OPEN',
      notes: debt.notes || '',
    });
    setTab('debts');
  };

  return (
    <FinanceLayout
      title="Billing & revenue"
      subtitle="Patient invoices, debtors ageing, and category recovery summary."
      actions={
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] hover:border-[#8b8b8b]/40 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <StatusBanner status={status} />

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: 'invoices', label: 'Invoices' },
          { id: 'debts', label: 'Debts' },
          { id: 'summary', label: 'Debtors summary' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === t.id
                ? 'bg-[#e41e1f] text-[#ffffff]'
                : 'border border-[#8b8b8b]/30 bg-[#ffffff] text-[#1f1f1f] hover:border-[#8b8b8b]/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-[#8b8b8b]">
          <LoaderCircle className="animate-spin" size={28} />
        </div>
      ) : tab === 'summary' ? (
        <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
          <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
            <h2 className="font-bold text-[#1f1f1f]">Debtors by category</h2>
          </div>
          {debtorsSummary.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">No debtor summary available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8b8b8b]/25">
                  {debtorsSummary.map((row) => (
                    <tr key={row.category || row.name}>
                      <td className="px-5 py-3 font-medium">{row.category || row.name || '—'}</td>
                      <td className="px-5 py-3">{formatMoney(row.amount)}</td>
                      <td className="px-5 py-3">{row.percent ?? row.share ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : tab === 'debts' ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
              <Plus size={18} className="text-[#e41e1f]" />
              {editingDebtId ? 'Update debt' : 'Record debt'}
            </h2>
            <form onSubmit={submitDebt} className="space-y-3">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Debtor name
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={debtForm.debtorName}
                  onChange={(e) => setDebtForm({ ...debtForm, debtorName: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Category
                <select
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={debtForm.debtorCategory}
                  onChange={(e) => setDebtForm({ ...debtForm, debtorCategory: e.target.value })}
                >
                  {DEBT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Amount (ZAR)
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={debtForm.amount}
                  onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Age bucket
                <select
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={debtForm.ageBucket}
                  onChange={(e) => setDebtForm({ ...debtForm, ageBucket: e.target.value })}
                >
                  {AGE_BUCKETS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={debtForm.status}
                  onChange={(e) => setDebtForm({ ...debtForm, status: e.target.value })}
                >
                  {DEBT_STATUSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Notes
                <textarea
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={debtForm.notes}
                  onChange={(e) => setDebtForm({ ...debtForm, notes: e.target.value })}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingDebtId ? 'Update debt' : 'Save debt'}
                </button>
                {editingDebtId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDebtId(null);
                      setDebtForm(emptyDebt);
                    }}
                    className="rounded-lg border border-[#8b8b8b]/40 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="font-bold text-[#1f1f1f]">Debt accounts</h2>
            </div>
            {debts.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">No debt accounts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Debtor</th>
                      <th className="px-5 py-3 font-semibold">Category</th>
                      <th className="px-5 py-3 font-semibold">Age</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {debts.map((d) => (
                      <tr key={d.id || d._id}>
                        <td className="px-5 py-3 font-medium">{d.debtorName}</td>
                        <td className="px-5 py-3">{d.debtorCategory}</td>
                        <td className="px-5 py-3">{d.ageBucket}</td>
                        <td className="px-5 py-3">{formatMoney(d.amount)}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-md bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#1f1f1f]">
                            {d.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => editDebt(d)}
                            className="text-sm font-semibold text-[#e41e1f] hover:underline"
                          >
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
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
              <Plus size={18} className="text-[#e41e1f]" />
              {editingInvoiceId ? 'Update invoice' : 'Create invoice'}
            </h2>
            <form onSubmit={submitInvoice} className="space-y-3">
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Patient name
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={invoiceForm.patientName}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, patientName: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Classification
                <select
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={invoiceForm.classification}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, classification: e.target.value })}
                >
                  {CLASSIFICATIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Medical scheme
                <input
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={invoiceForm.medicalScheme}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, medicalScheme: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Amount
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Paid
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={invoiceForm.amountPaid}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amountPaid: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Status
                <select
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={invoiceForm.status}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                >
                  {INVOICE_STATUSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Invoice date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={invoiceForm.invoiceDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Due date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Reference
                <input
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={invoiceForm.referenceNumber}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, referenceNumber: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm font-semibold text-[#1f1f1f]">
                Notes
                <textarea
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2"
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#e41e1f] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editingInvoiceId ? 'Update invoice' : 'Create invoice'}
                </button>
                {editingInvoiceId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInvoiceId(null);
                      setInvoiceForm(emptyInvoice);
                    }}
                    className="rounded-lg border border-[#8b8b8b]/40 px-4 py-2.5 text-sm font-semibold text-[#1f1f1f]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="font-bold text-[#1f1f1f]">Invoices</h2>
            </div>
            {invoices.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">No invoices yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs uppercase text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Patient</th>
                      <th className="px-5 py-3 font-semibold">Reference</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                      <th className="px-5 py-3 font-semibold">Balance</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {invoices.map((inv) => (
                      <tr key={inv.id || inv._id}>
                        <td className="px-5 py-3">
                          <p className="font-medium">{inv.patientName}</p>
                          <p className="text-xs text-[#8b8b8b]">{inv.classification}</p>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs">{inv.referenceNumber || '—'}</td>
                        <td className="px-5 py-3">{formatMoney(inv.amount)}</td>
                        <td className="px-5 py-3">{formatMoney(inv.balance)}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-md bg-[#f8f8f8] px-2 py-0.5 text-xs font-semibold text-[#e41e1f]">
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => editInvoice(inv)}
                            className="text-sm font-semibold text-[#e41e1f] hover:underline"
                          >
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
      )}
    </FinanceLayout>
  );
}
