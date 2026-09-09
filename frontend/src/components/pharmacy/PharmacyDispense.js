import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  LoaderCircle,
  PackagePlus,
  Pill,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getRole } from '../../auth';
import PharmacyLayout from './PharmacyLayout';

const emptyMedicine = { name: '', strength: '', form: 'Tablet', quantity: '', reorderLevel: '10' };

export default function PharmacyDispense() {
  const navigate = useNavigate();
  const role = getRole();
  const canManageStock = role === 'admin' || role === 'pharmacy' || role === 'super_admin';
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dispensations, setDispensations] = useState([]);
  const [medicineForm, setMedicineForm] = useState(emptyMedicine);
  const [stockValues, setStockValues] = useState({});
  const [dispenseForm, setDispenseForm] = useState({
    prescriptionId: '',
    medicineId: '',
    quantity: '1',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [medicineRes, prescriptionRes, dispensationRes] = await Promise.all([
        apiFetch('/pharmacy/medicines', { navigate }),
        apiFetch('/pharmacy/prescriptions', { navigate }),
        apiFetch('/pharmacy/dispensations', { navigate }),
      ]);
      const medicineData = await medicineRes.json().catch(() => []);
      const prescriptionData = await prescriptionRes.json().catch(() => []);
      const dispensationData = await dispensationRes.json().catch(() => []);
      if (!medicineRes.ok) throw new Error(medicineData.error || 'Unable to load medicines');
      if (!prescriptionRes.ok) {
        throw new Error(prescriptionData.error || 'Unable to load prescriptions');
      }
      if (!dispensationRes.ok) {
        throw new Error(dispensationData.error || 'Unable to load dispensations');
      }
      const meds = Array.isArray(medicineData) ? medicineData : [];
      setMedicines(meds);
      setPrescriptions(Array.isArray(prescriptionData) ? prescriptionData : []);
      setDispensations(Array.isArray(dispensationData) ? dispensationData : []);
      setStockValues(
        Object.fromEntries(meds.map((medicine) => [medicine._id || medicine.id, medicine.quantity]))
      );
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

  const submitMedicine = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiFetch('/pharmacy/medicines', {
        navigate,
        method: 'POST',
        body: JSON.stringify({
          ...medicineForm,
          quantity: Number(medicineForm.quantity),
          reorderLevel: Number(medicineForm.reorderLevel),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to add medicine');
      setMedicineForm(emptyMedicine);
      setStatus({ type: 'success', message: 'Medicine added to inventory.' });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const saveStock = async (medicine) => {
    const id = medicine._id || medicine.id;
    setSaving(true);
    try {
      const res = await apiFetch(`/pharmacy/medicines/${id}/stock`, {
        navigate,
        method: 'PATCH',
        body: JSON.stringify({ quantity: Number(stockValues[id]) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to update stock');
      setStatus({ type: 'success', message: `${medicine.name} stock updated.` });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const submitDispensation = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const selected = medicines.find(
        (m) => String(m._id || m.id) === String(dispenseForm.medicineId)
      );
      const qty = Number(dispenseForm.quantity);
      if (selected && qty > selected.quantity) {
        throw new Error(
          `Insufficient stock for ${selected.name}: only ${selected.quantity} available.`
        );
      }
      const res = await apiFetch('/pharmacy/dispensations', {
        navigate,
        method: 'POST',
        body: JSON.stringify({
          prescriptionId: Number(dispenseForm.prescriptionId),
          medicineId: Number(dispenseForm.medicineId),
          quantity: qty,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to dispense medication');
      setDispenseForm({ prescriptionId: '', medicineId: '', quantity: '1' });
      setStatus({ type: 'success', message: 'Medication dispensed and inventory updated.' });
      await loadData();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const lowStock = medicines.filter(
    (medicine) => Number(medicine.quantity) <= Number(medicine.reorderLevel)
  );
  const selectedMedicine = medicines.find(
    (medicine) => String(medicine._id || medicine.id) === String(dispenseForm.medicineId)
  );
  const insufficientSelected =
    selectedMedicine && Number(dispenseForm.quantity) > selectedMedicine.quantity;

  return (
    <PharmacyLayout
      title="Dispense desk"
      subtitle="Medicine inventory, prescription dispensing, and recent dispensation history."
      actions={
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#8b8b8b]/40 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#1f1f1f] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
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

      {lowStock.length > 0 && (
        <section className="mb-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#f8f8f8] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1f1f1f]">
              <AlertTriangle className="h-5 w-5 text-[#e41e1f]" />
              Low-stock alerts
              <span className="rounded-full bg-[#e41e1f] px-2.5 py-0.5 text-sm font-bold text-[#ffffff]">
                {lowStock.length}
              </span>
            </h2>
            <p className="text-sm text-[#8b8b8b]">
              Quantity at or below reorder level — action required before stock-out.
            </p>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((medicine) => (
              <li
                key={medicine._id || medicine.id}
                className="rounded-lg border border-[#8b8b8b]/30 bg-[#ffffff] px-3 py-2 text-sm text-[#1f1f1f]"
              >
                <span className="font-semibold">{medicine.name}</span>{' '}
                <span className="text-[#8b8b8b]">{medicine.strength}</span>
                <span className="mt-1 block font-bold text-[#e41e1f]">
                  {medicine.quantity} left · reorder at {medicine.reorderLevel}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Summary icon={ShoppingBag} label="Medicines in inventory" value={medicines.length} />
        <Summary
          icon={ClipboardList}
          label="Prescriptions awaiting dispensing"
          value={prescriptions.filter((item) => Number(item.dispensedQuantity || 0) === 0).length}
        />
        <Summary icon={AlertTriangle} label="Low-stock medicines" value={lowStock.length} />
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        {canManageStock && (
          <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-[#1f1f1f]">
              <PackagePlus className="h-5 w-5 text-[#e41e1f]" /> Add medicine
            </h2>
            <form onSubmit={submitMedicine} className="grid gap-4 sm:grid-cols-2">
              <Field label="Medicine name">
                <input
                  required
                  value={medicineForm.name}
                  onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
                  placeholder="e.g. Amoxicillin"
                />
              </Field>
              <Field label="Strength">
                <input
                  required
                  value={medicineForm.strength}
                  onChange={(e) => setMedicineForm({ ...medicineForm, strength: e.target.value })}
                  placeholder="e.g. 500 mg"
                />
              </Field>
              <Field label="Form">
                <select
                  value={medicineForm.form}
                  onChange={(e) => setMedicineForm({ ...medicineForm, form: e.target.value })}
                >
                  <option>Tablet</option>
                  <option>Capsule</option>
                  <option>Liquid</option>
                  <option>Injection</option>
                  <option>Cream</option>
                </select>
              </Field>
              <Field label="Opening stock">
                <input
                  required
                  min="0"
                  type="number"
                  value={medicineForm.quantity}
                  onChange={(e) => setMedicineForm({ ...medicineForm, quantity: e.target.value })}
                />
              </Field>
              <Field label="Reorder level">
                <input
                  required
                  min="0"
                  type="number"
                  value={medicineForm.reorderLevel}
                  onChange={(e) =>
                    setMedicineForm({ ...medicineForm, reorderLevel: e.target.value })
                  }
                />
              </Field>
              <button
                disabled={saving}
                className="self-end rounded-lg bg-[#e41e1f] px-4 py-2.5 font-semibold text-[#ffffff] disabled:opacity-50"
              >
                Add to inventory
              </button>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-[#1f1f1f]">
            <Pill className="h-5 w-5 text-[#e41e1f]" /> Dispense medication
          </h2>
          <form onSubmit={submitDispensation} className="grid gap-4">
            <Field label="Prescription">
              <select
                required
                value={dispenseForm.prescriptionId}
                onChange={(e) =>
                  setDispenseForm({ ...dispenseForm, prescriptionId: e.target.value })
                }
              >
                <option value="">Select a prescription</option>
                {prescriptions.map((item) => (
                  <option key={item._id || item.id} value={item._id || item.id}>
                    {item.patientName} — {item.medication} ({item.dosage})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Medicine from inventory">
              <select
                required
                value={dispenseForm.medicineId}
                onChange={(e) => setDispenseForm({ ...dispenseForm, medicineId: e.target.value })}
              >
                <option value="">Select medicine</option>
                {medicines.map((item) => (
                  <option key={item._id || item.id} value={item._id || item.id}>
                    {item.name} {item.strength} — {item.quantity} available
                    {item.quantity <= item.reorderLevel ? ' (LOW)' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={
                selectedMedicine
                  ? `Quantity (up to ${selectedMedicine.quantity})`
                  : 'Quantity'
              }
            >
              <input
                required
                min="1"
                max={selectedMedicine?.quantity}
                type="number"
                value={dispenseForm.quantity}
                onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: e.target.value })}
              />
            </Field>
            {insufficientSelected && (
              <p className="rounded-lg border border-[#e41e1f]/40 bg-[#f8f8f8] px-3 py-2 text-sm text-[#e41e1f]">
                Cannot dispense: requested quantity exceeds available stock (
                {selectedMedicine.quantity}).
              </p>
            )}
            <button
              disabled={
                saving ||
                medicines.length === 0 ||
                prescriptions.length === 0 ||
                Boolean(insufficientSelected)
              }
              className="rounded-lg bg-[#e41e1f] px-4 py-2.5 font-semibold text-[#ffffff] disabled:opacity-50"
            >
              Dispense medication
            </button>
          </form>
        </section>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] shadow-sm">
        <div className="border-b border-[#8b8b8b]/30 p-6">
          <h2 className="text-xl font-bold text-[#1f1f1f]">Inventory</h2>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-[#8b8b8b]">
            <LoaderCircle className="animate-spin" size={18} /> Loading pharmacy data…
          </div>
        ) : medicines.length === 0 ? (
          <p className="p-6 text-[#8b8b8b]">No medicines have been added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8f8f8] text-[#8b8b8b]">
                <tr>
                  <th className="px-6 py-3">Medicine</th>
                  <th className="px-6 py-3">Form</th>
                  <th className="px-6 py-3">Stock</th>
                  {canManageStock && <th className="px-6 py-3">Update stock</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8b8b8b]/30">
                {medicines.map((medicine) => {
                  const id = medicine._id || medicine.id;
                  return (
                    <tr key={id}>
                      <td className="px-6 py-4 font-medium text-[#1f1f1f]">
                        {medicine.name}
                        <span className="ml-2 font-normal text-[#8b8b8b]">{medicine.strength}</span>
                        {medicine.quantity <= medicine.reorderLevel && (
                          <span className="ml-2 rounded bg-[#f5f5f5] px-1.5 py-0.5 text-xs font-semibold text-[#e41e1f]">
                            Low
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#8b8b8b]">{medicine.form}</td>
                      <td
                        className={`px-6 py-4 font-semibold ${
                          medicine.quantity <= medicine.reorderLevel
                            ? 'text-[#e41e1f]'
                            : 'text-[#1f1f1f]'
                        }`}
                      >
                        {medicine.quantity}{' '}
                        <span className="font-normal text-[#8b8b8b]">
                          (reorder at {medicine.reorderLevel})
                        </span>
                      </td>
                      {canManageStock && (
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <input
                              aria-label={`Stock for ${medicine.name}`}
                              min="0"
                              type="number"
                              className="w-20 rounded border border-[#8b8b8b]/40 px-2 py-1"
                              value={stockValues[id] ?? ''}
                              onChange={(e) =>
                                setStockValues({ ...stockValues, [id]: e.target.value })
                              }
                            />
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => saveStock(medicine)}
                              className="rounded bg-[#e41e1f] px-3 py-1 text-[#ffffff] disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-[#1f1f1f]">Recent dispensations</h2>
        {dispensations.length === 0 ? (
          <p className="text-[#8b8b8b]">No medication has been dispensed yet.</p>
        ) : (
          <ul className="divide-y divide-[#8b8b8b]/30">
            {dispensations.map((item) => (
              <li
                key={item._id || item.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between"
              >
                <span className="text-[#1f1f1f]">
                  <strong>{item.patientName}</strong> received {item.quantity} × {item.medicineName}{' '}
                  {item.strength}
                </span>
                <time className="text-sm text-[#8b8b8b]">
                  {item.dispensedAt ? new Date(item.dispensedAt).toLocaleString() : '—'}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PharmacyLayout>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-[#1f1f1f]">
      {label}
      <span className="mt-1 block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-[#8b8b8b]/40 [&_input]:px-3 [&_input]:py-2 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-[#8b8b8b]/40 [&_select]:px-3 [&_select]:py-2">
        {children}
      </span>
    </label>
  );
}

function Summary({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#8b8b8b]/30 bg-[#ffffff] p-5 shadow-sm">
      <Icon className="mb-3 h-6 w-6 text-[#e41e1f]" />
      <p className="text-3xl font-bold text-[#1f1f1f]">{value}</p>
      <p className="mt-1 text-sm text-[#8b8b8b]">{label}</p>
    </div>
  );
}
