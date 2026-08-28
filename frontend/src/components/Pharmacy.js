import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, ClipboardList, PackagePlus, Pill, RefreshCw, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api/pharmacy';
const emptyMedicine = { name: '', strength: '', form: 'Tablet', quantity: '', reorderLevel: '10' };

export default function Pharmacy() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dispensations, setDispensations] = useState([]);
  const [medicineForm, setMedicineForm] = useState(emptyMedicine);
  const [stockValues, setStockValues] = useState({});
  const [dispenseForm, setDispenseForm] = useState({ prescriptionId: '', medicineId: '', quantity: '1' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const request = useCallback(async (path, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
    if (response.status === 401) {
      navigate('/login');
      throw new Error('Please sign in to use the pharmacy');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  }, [navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [medicineData, prescriptionData, dispensationData] = await Promise.all([
        request('/medicines'), request('/prescriptions'), request('/dispensations')
      ]);
      setMedicines(medicineData);
      setPrescriptions(prescriptionData);
      setDispensations(dispensationData);
      setStockValues(Object.fromEntries(medicineData.map((medicine) => [medicine._id, medicine.quantity])));
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { loadData(); }, [loadData]);

  const submitMedicine = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      await request('/medicines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...medicineForm, quantity: Number(medicineForm.quantity), reorderLevel: Number(medicineForm.reorderLevel) }) });
      setMedicineForm(emptyMedicine);
      setStatus({ type: 'success', message: 'Medicine added to inventory.' });
      loadData();
    } catch (error) { setStatus({ type: 'error', message: error.message }); }
    finally { setSaving(false); }
  };

  const saveStock = async (medicine) => {
    setSaving(true);
    try {
      await request(`/medicines/${medicine._id}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: Number(stockValues[medicine._id]) }) });
      setStatus({ type: 'success', message: `${medicine.name} stock updated.` });
      loadData();
    } catch (error) { setStatus({ type: 'error', message: error.message }); }
    finally { setSaving(false); }
  };

  const submitDispensation = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await request('/dispensations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...dispenseForm, prescriptionId: Number(dispenseForm.prescriptionId), medicineId: Number(dispenseForm.medicineId), quantity: Number(dispenseForm.quantity) }) });
      setDispenseForm({ prescriptionId: '', medicineId: '', quantity: '1' });
      setStatus({ type: 'success', message: 'Medication dispensed and inventory updated.' });
      loadData();
    } catch (error) { setStatus({ type: 'error', message: error.message }); }
    finally { setSaving(false); }
  };

  const lowStock = medicines.filter((medicine) => medicine.quantity <= medicine.reorderLevel);
  const selectedMedicine = medicines.find((medicine) => medicine._id === Number(dispenseForm.medicineId));

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate('/')} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"><ArrowLeft className="h-4 w-4" /> Back to home</button>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900"><Pill className="h-9 w-9 text-teal-600" /> Pharmacy</h1>
            <p className="mt-1 text-slate-600">Manage medicine stock and dispense prescribed medication.</p>
          </div>
          <button onClick={loadData} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-600 px-4 py-2 font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>

        {status.message && <div className={`mb-6 rounded-lg border px-4 py-3 ${status.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{status.message}</div>}

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <Summary icon={ShoppingBag} label="Medicines in inventory" value={medicines.length} tone="text-teal-700" />
          <Summary icon={ClipboardList} label="Prescriptions awaiting dispensing" value={prescriptions.filter((item) => item.dispensedQuantity === 0).length} tone="text-blue-700" />
          <Summary icon={AlertTriangle} label="Low-stock medicines" value={lowStock.length} tone="text-amber-700" />
        </section>

        {lowStock.length > 0 && <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5"><h2 className="flex items-center gap-2 font-bold text-amber-900"><AlertTriangle className="h-5 w-5" /> Reorder attention needed</h2><p className="mt-2 text-sm text-amber-800">{lowStock.map((medicine) => `${medicine.name} (${medicine.quantity} left)`).join(', ')}</p></section>}

        <div className="grid gap-8 xl:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900"><PackagePlus className="h-5 w-5 text-teal-600" /> Add medicine</h2>
            <form onSubmit={submitMedicine} className="grid gap-4 sm:grid-cols-2">
              <Field label="Medicine name"><input required value={medicineForm.name} onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })} placeholder="e.g. Amoxicillin" /></Field>
              <Field label="Strength"><input required value={medicineForm.strength} onChange={(e) => setMedicineForm({ ...medicineForm, strength: e.target.value })} placeholder="e.g. 500 mg" /></Field>
              <Field label="Form"><select value={medicineForm.form} onChange={(e) => setMedicineForm({ ...medicineForm, form: e.target.value })}><option>Tablet</option><option>Capsule</option><option>Liquid</option><option>Injection</option><option>Cream</option></select></Field>
              <Field label="Opening stock"><input required min="0" type="number" value={medicineForm.quantity} onChange={(e) => setMedicineForm({ ...medicineForm, quantity: e.target.value })} /></Field>
              <Field label="Reorder level"><input required min="0" type="number" value={medicineForm.reorderLevel} onChange={(e) => setMedicineForm({ ...medicineForm, reorderLevel: e.target.value })} /></Field>
              <button disabled={saving} className="self-end rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">Add to inventory</button>
            </form>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900"><Pill className="h-5 w-5 text-teal-600" /> Dispense medication</h2>
            <form onSubmit={submitDispensation} className="grid gap-4">
              <Field label="Prescription"><select required value={dispenseForm.prescriptionId} onChange={(e) => setDispenseForm({ ...dispenseForm, prescriptionId: e.target.value })}><option value="">Select a prescription</option>{prescriptions.map((item) => <option key={item._id} value={item._id}>{item.patientName} — {item.medication} ({item.dosage})</option>)}</select></Field>
              <Field label="Medicine from inventory"><select required value={dispenseForm.medicineId} onChange={(e) => setDispenseForm({ ...dispenseForm, medicineId: e.target.value })}><option value="">Select medicine</option>{medicines.map((item) => <option key={item._id} value={item._id}>{item.name} {item.strength} — {item.quantity} available</option>)}</select></Field>
              <Field label={selectedMedicine ? `Quantity (up to ${selectedMedicine.quantity})` : 'Quantity'}><input required min="1" max={selectedMedicine?.quantity} type="number" value={dispenseForm.quantity} onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: e.target.value })} /></Field>
              <button disabled={saving || medicines.length === 0 || prescriptions.length === 0} className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Dispense medication</button>
            </form>
          </section>
        </div>

        <section className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 p-6"><h2 className="text-xl font-bold text-slate-900">Inventory</h2></div>
          {loading ? <p className="p-6 text-slate-600">Loading pharmacy data…</p> : medicines.length === 0 ? <p className="p-6 text-slate-600">No medicines have been added yet.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-6 py-3">Medicine</th><th className="px-6 py-3">Form</th><th className="px-6 py-3">Stock</th><th className="px-6 py-3">Update stock</th></tr></thead><tbody className="divide-y divide-slate-200">{medicines.map((medicine) => <tr key={medicine._id}><td className="px-6 py-4 font-medium text-slate-900">{medicine.name}<span className="ml-2 font-normal text-slate-500">{medicine.strength}</span></td><td className="px-6 py-4 text-slate-600">{medicine.form}</td><td className={`px-6 py-4 font-semibold ${medicine.quantity <= medicine.reorderLevel ? 'text-amber-700' : 'text-teal-700'}`}>{medicine.quantity} <span className="font-normal text-slate-500">(reorder at {medicine.reorderLevel})</span></td><td className="px-6 py-4"><div className="flex gap-2"><input aria-label={`Stock for ${medicine.name}`} min="0" type="number" className="w-20 rounded border border-slate-300 px-2 py-1" value={stockValues[medicine._id] ?? ''} onChange={(e) => setStockValues({ ...stockValues, [medicine._id]: e.target.value })} /><button disabled={saving} onClick={() => saveStock(medicine)} className="rounded bg-slate-800 px-3 py-1 text-white hover:bg-slate-700 disabled:opacity-50">Save</button></div></td></tr>)}</tbody></table></div>}
        </section>

        <section className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="mb-4 text-xl font-bold text-slate-900">Recent dispensations</h2>{dispensations.length === 0 ? <p className="text-slate-600">No medication has been dispensed yet.</p> : <ul className="divide-y divide-slate-200">{dispensations.map((item) => <li key={item._id} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between"><span><strong>{item.patientName}</strong> received {item.quantity} × {item.medicineName} {item.strength}</span><time className="text-sm text-slate-500">{new Date(item.dispensedAt).toLocaleString()}</time></li>)}</ul>}</section>
      </div>
    </main>
  );
}

function Field({ label, children }) { return <label className="block text-sm font-medium text-slate-700">{label}<span className="mt-1 block [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_input]:py-2 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-300 [&_select]:px-3 [&_select]:py-2">{children}</span></label>; }
function Summary({ icon: Icon, label, value, tone }) { return <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><Icon className={`mb-3 h-6 w-6 ${tone}`} /><p className="text-3xl font-bold text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-600">{label}</p></div>; }
