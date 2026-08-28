const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const secret = process.env.JWT_SECRET || 'your_jwt_secret';

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try { req.user = jwt.verify(token, secret); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};

const staffOnly = (req, res, next) => ['admin', 'doctor'].includes(req.user.role)
  ? next()
  : res.status(403).json({ error: 'Only clinic staff can access the pharmacy' });

router.get('/medicines', auth, staffOnly, async (req, res) => {
  res.json(await db.prepare('SELECT id AS _id, name, strength, form, quantity, reorderLevel, updatedAt FROM medicines ORDER BY name').all());
});

router.post('/medicines', auth, staffOnly, async (req, res) => {
  const { name, strength, form, quantity, reorderLevel } = req.body;
  const stock = Number(quantity);
  const threshold = Number(reorderLevel);
  if (![name, strength, form].every((value) => typeof value === 'string' && value.trim()) || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(threshold) || threshold < 0) {
    return res.status(400).json({ error: 'Enter a medicine name, strength, form, and valid stock levels' });
  }
  try {
    const result = await db.prepare('INSERT INTO medicines (name, strength, form, quantity, reorderLevel) VALUES (?, ?, ?, ?, ?)').run(name.trim(), strength.trim(), form.trim(), stock, threshold);
    res.status(201).json(await db.prepare('SELECT id AS _id, name, strength, form, quantity, reorderLevel, updatedAt FROM medicines WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) {
    res.status(400).json({ error: error.code === '23505' ? 'This medicine is already in inventory' : 'Unable to add medicine' });
  }
});

router.patch('/medicines/:id/stock', auth, staffOnly, async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ error: 'Stock quantity must be a whole number of zero or more' });
  const result = await db.prepare("UPDATE medicines SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?").run(quantity, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Medicine not found' });
  res.json(await db.prepare('SELECT id AS _id, name, strength, form, quantity, reorderLevel, updatedAt FROM medicines WHERE id = ?').get(req.params.id));
});

router.get('/prescriptions', auth, staffOnly, async (req, res) => {
  const prescriptions = await db.prepare(`SELECT p.id AS _id, p.medication, p.dosage, p.frequency, p.createdAt,
    u.firstName || ' ' || u.lastName AS patientName, d.firstName || ' ' || d.lastName AS doctorName,
    COALESCE(SUM(x.quantity), 0) AS dispensedQuantity
    FROM prescriptions p
    JOIN users u ON u.id = p.patientId
    JOIN doctors d ON d.id = p.doctorId
    LEFT JOIN dispensations x ON x.prescriptionId = p.id
    GROUP BY p.id ORDER BY datetime(p.createdAt) DESC`).all();
  res.json(prescriptions);
});

router.post('/dispensations', auth, staffOnly, async (req, res) => {
  const prescriptionId = Number(req.body.prescriptionId);
  const medicineId = Number(req.body.medicineId);
  const quantity = Number(req.body.quantity);
  if (![prescriptionId, medicineId, quantity].every(Number.isInteger) || quantity < 1) return res.status(400).json({ error: 'Select a prescription, medicine, and valid quantity' });
  const prescription = await db.prepare('SELECT id FROM prescriptions WHERE id = ?').get(prescriptionId);
  const medicine = await db.prepare('SELECT id, quantity FROM medicines WHERE id = ?').get(medicineId);
  if (!prescription || !medicine) return res.status(404).json({ error: 'Prescription or medicine not found' });
  if (medicine.quantity < quantity) return res.status(400).json({ error: `Only ${medicine.quantity} unit(s) are available` });
  await db.prepare('UPDATE medicines SET quantity = quantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(quantity, medicineId);
  const result = await db.prepare('INSERT INTO dispensations (prescriptionId, medicineId, quantity, dispensedBy) VALUES (?, ?, ?, ?)').run(prescriptionId, medicineId, quantity, req.user.id);
  res.status(201).json({ message: 'Medication dispensed successfully', id: result.lastInsertRowid });
});

router.get('/dispensations', auth, staffOnly, async (req, res) => {
  res.json(await db.prepare(`SELECT x.id AS _id, x.quantity, x.dispensedAt, m.name AS medicineName, m.strength,
    p.medication, u.firstName || ' ' || u.lastName AS patientName
    FROM dispensations x
    JOIN medicines m ON m.id = x.medicineId
    JOIN prescriptions p ON p.id = x.prescriptionId
    JOIN users u ON u.id = p.patientId
    ORDER BY datetime(x.dispensedAt) DESC LIMIT 20`).all());
});

module.exports = router;
