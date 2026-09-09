import React, { useCallback, useEffect, useState } from 'react';
import {
  LoaderCircle,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../auth';
import FinanceLayout from './finance/FinanceLayout';

const emptyTx = {
  costCentreId: '',
  type: 'COMMITMENT',
  amount: '',
  description: '',
  reference: '',
  txnDate: new Date().toISOString().slice(0, 10),
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

function totalsFromSummary(summaryData) {
  if (Array.isArray(summaryData)) {
    return summaryData.reduce(
      (acc, row) => ({
        budgetTotal: acc.budgetTotal + Number(row.budgetAnnual ?? row.budget ?? 0),
        commitmentTotal: acc.commitmentTotal + Number(row.commitments ?? row.commitment ?? 0),
        actualTotal: acc.actualTotal + Number(row.actuals ?? row.actual ?? 0),
      }),
      { budgetTotal: 0, commitmentTotal: 0, actualTotal: 0 }
    );
  }
  return {
    budgetTotal: summaryData.budgetTotal ?? summaryData.budget ?? 0,
    commitmentTotal: summaryData.commitmentTotal ?? summaryData.commitments ?? 0,
    actualTotal: summaryData.actualTotal ?? summaryData.actual ?? 0,
  };
}

export default function Finance() {
  const navigate = useNavigate();
  const [centres, setCentres] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    budgetTotal: 0,
    commitmentTotal: 0,
    actualTotal: 0,
  });
  const [form, setForm] = useState(emptyTx);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [centresRes, txRes, summaryRes] = await Promise.all([
        apiFetch('/finance/cost-centres', { navigate }),
        apiFetch('/finance/transactions', { navigate }),
        apiFetch('/finance/summary', { navigate }),
      ]);
      const [centresData, txData, summaryData] = await Promise.all([
        centresRes.json().catch(() => []),
        txRes.json().catch(() => []),
        summaryRes.json().catch(() => ({})),
      ]);
      if (!centresRes.ok) throw new Error(centresData.error || 'Unable to load cost centres');
      if (!txRes.ok) throw new Error(txData.error || 'Unable to load transactions');
      if (!summaryRes.ok) throw new Error(summaryData.error || 'Unable to load finance summary');

      setCentres(Array.isArray(centresData) ? centresData : centresData.costCentres || []);
      setTransactions(Array.isArray(txData) ? txData : txData.transactions || []);
      const rows = Array.isArray(summaryData) ? summaryData : summaryData.rows || [];
      setSummaryRows(rows);
      setSummary(totalsFromSummary(summaryData));
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

  const change = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await apiFetch('/finance/transactions', {
        method: 'POST',
        navigate,
        body: JSON.stringify({
          costCentreId: form.costCentreId,
          type: form.type,
          amount: Number(form.amount),
          description: form.description.trim(),
          reference: form.reference.trim() || null,
          txnDate: form.txnDate || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to add transaction');
      setForm(emptyTx);
      setStatus({ type: 'success', message: 'Transaction recorded against cost centre.' });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const cards = [
    { label: 'Budget total', value: formatMoney(summary.budgetTotal), tone: 'text-[#e41e1f]' },
    { label: 'Commitments', value: formatMoney(summary.commitmentTotal), tone: 'text-[#8b8b8b]' },
    { label: 'Actual spend', value: formatMoney(summary.actualTotal), tone: 'text-[#1f1f1f]' },
  ];

  const tableRows =
    summaryRows.length > 0
      ? summaryRows
      : centres.map((cc) => ({
          costCentreId: cc.id || cc._id,
          code: cc.code,
          name: cc.name,
          department: cc.department,
          budgetAnnual: cc.budget ?? cc.budgetAnnual,
          commitments: cc.commitment ?? cc.commitments,
          actuals: cc.actual ?? cc.actualSpend,
          remainingBudget:
            Number(cc.budget ?? cc.budgetAnnual ?? 0) -
            Number(cc.commitment ?? cc.commitments ?? 0) -
            Number(cc.actual ?? cc.actualSpend ?? 0),
        }));

  return (
    <FinanceLayout
      title="Cost centres"
      subtitle="Budget vs commitment vs actual for departmental cost centres (PFMA-aware capture)."
      actions={
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2 text-sm font-semibold hover:bg-[#f8f8f8]"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      }
    >
      <div className="mb-6 rounded-lg border border-[#8b8b8b]/30 bg-[#f8f8f8] px-4 py-3 text-sm text-[#1f1f1f]">
        <strong>PFMA note:</strong> Commitments and expenditure must align with approved budgets and
        delegated authority. This module supports visibility — formal SCOA / BAS posting remains with
        provincial finance systems.
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
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8b8b8b]">
                  {card.label}
                </p>
                <p className={`mt-3 text-2xl font-bold ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <section className="mb-8 overflow-hidden rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
            <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold">
                <Wallet size={18} className="text-[#e41e1f]" /> Cost centres
              </h2>
            </div>
            {tableRows.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-[#8b8b8b]">
                No cost centres configured yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Code</th>
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Budget</th>
                      <th className="px-5 py-3 font-semibold">Commitment</th>
                      <th className="px-5 py-3 font-semibold">Actual</th>
                      <th className="px-5 py-3 font-semibold">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8b8b8b]/25">
                    {tableRows.map((row) => {
                      const id = row.costCentreId || row.id || row._id || row.code;
                      const budget = Number(row.budgetAnnual ?? row.budget ?? 0);
                      const commitment = Number(row.commitments ?? row.commitment ?? 0);
                      const actual = Number(row.actuals ?? row.actual ?? 0);
                      const available =
                        row.remainingBudget != null
                          ? Number(row.remainingBudget)
                          : budget - commitment - actual;
                      return (
                        <tr key={id}>
                          <td className="px-5 py-3 font-mono text-xs">{row.code || '—'}</td>
                          <td className="px-5 py-3 font-medium">
                            {row.name || row.department || '—'}
                          </td>
                          <td className="px-5 py-3">{formatMoney(budget)}</td>
                          <td className="px-5 py-3 text-[#1f1f1f]">{formatMoney(commitment)}</td>
                          <td className="px-5 py-3">{formatMoney(actual)}</td>
                          <td
                            className={`px-5 py-3 font-semibold ${
                              available < 0 ? 'text-[#e41e1f]' : 'text-[#e41e1f]'
                            }`}
                          >
                            {formatMoney(available)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm lg:col-span-2 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Plus size={18} className="text-[#e41e1f]" /> Add transaction
              </h2>
              <form onSubmit={submit} className="mt-4 space-y-4">
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Cost centre
                  <select
                    required
                    name="costCentreId"
                    value={form.costCentreId}
                    onChange={change}
                    className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                  >
                    <option value="">Select cost centre</option>
                    {centres.map((cc) => (
                      <option key={cc._id || cc.id} value={cc._id || cc.id}>
                        {cc.code ? `${cc.code} — ` : ''}
                        {cc.name || cc.department}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Type
                  <select
                    name="type"
                    value={form.type}
                    onChange={change}
                    className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 bg-[#ffffff] px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                  >
                    <option value="COMMITMENT">Commitment</option>
                    <option value="ACTUAL">Actual</option>
                    <option value="REVENUE">Revenue</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Date
                  <input
                    required
                    type="date"
                    name="txnDate"
                    value={form.txnDate}
                    onChange={change}
                    className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Amount (ZAR)
                  <input
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={change}
                    className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Description
                  <input
                    required
                    name="description"
                    value={form.description}
                    onChange={change}
                    className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                  />
                </label>
                <label className="block text-sm font-semibold text-[#1f1f1f]">
                  Reference (optional)
                  <input
                    name="reference"
                    value={form.reference}
                    onChange={change}
                    placeholder="PO / requisition no."
                    className="mt-1.5 block w-full rounded-lg border border-[#8b8b8b]/40 px-3 py-2 text-sm outline-none focus:border-[#e41e1f] focus:ring-2 focus:ring-[#e41e1f]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={saving || centres.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e41e1f] px-4 py-2.5 text-sm font-bold text-[#ffffff] hover:bg-[#e41e1f] disabled:bg-[#8b8b8b]"
                >
                  {saving && <LoaderCircle size={16} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Record transaction'}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm lg:col-span-3">
              <div className="border-b border-[#8b8b8b]/30 px-5 py-4">
                <h2 className="font-bold">Recent transactions</h2>
              </div>
              {transactions.length === 0 ? (
                <p className="px-5 py-16 text-center text-sm text-[#8b8b8b]">
                  No transactions recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-[#8b8b8b]/25">
                  {transactions.slice(0, 40).map((tx) => {
                    const id = tx._id || tx.id;
                    return (
                      <li
                        key={id}
                        className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-[#1f1f1f]">
                            {tx.description || 'Transaction'}
                          </p>
                          <p className="text-xs text-[#8b8b8b]">
                            {tx.costCentreName || tx.costCentreCode || 'Cost centre'} ·{' '}
                            {(tx.type || '').toUpperCase()}
                            {tx.reference ? ` · ${tx.reference}` : ''}
                          </p>
                        </div>
                        <p className="font-semibold text-[#e41e1f]">{formatMoney(tx.amount)}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </FinanceLayout>
  );
}
