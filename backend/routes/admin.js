const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();
const secret = process.env.JWT_SECRET || 'your_jwt_secret';
const auth = (req, res, next) => { const token = req.header('Authorization')?.replace('Bearer ', ''); if (!token) return res.status(401).send({ error: 'No token provided' }); try { req.user = jwt.verify(token, secret); next(); } catch { res.status(401).send({ error: 'Invalid token' }); } };
const adminOnly = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).send({ error: 'Not authorized' });

router.post('/add-doctor', auth, adminOnly, async (req, res) => {
  const { firstName, lastName, email, specialty, licenseNumber, phoneNumber, password } = req.body;
  if (![firstName, lastName, email, specialty, licenseNumber, phoneNumber, password].every(Boolean)) return res.status(400).send({ error: 'All doctor details are required' });
  try {
    db.prepare('INSERT INTO doctors (firstName, lastName, email, specialty, licenseNumber, phoneNumber, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(firstName.trim(), lastName.trim(), email.trim().toLowerCase(), specialty.trim(), licenseNumber.trim(), phoneNumber.trim(), await bcrypt.hash(password, 10), 'doctor');
    res.status(201).send({ message: 'Doctor added successfully' });
  } catch (error) { res.status(400).send({ error: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Email or license number already exists' : 'Unable to add doctor' }); }
});
router.post('/add-admin', auth, adminOnly, async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try { db.prepare('INSERT INTO admins (firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?)').run(firstName, lastName, email.toLowerCase(), await bcrypt.hash(password, 10), 'admin'); res.status(201).send({ message: 'Admin added successfully' }); }
  catch (error) { res.status(400).send({ error: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Email already exists' : 'Unable to add admin' }); }
});
router.get('/profile', auth, adminOnly, (req, res) => { const admin = db.prepare('SELECT id AS _id, firstName, lastName, email, role FROM admins WHERE id = ?').get(req.user.id); admin ? res.json(admin) : res.status(404).send({ error: 'Admin not found' }); });
router.put('/profile', auth, adminOnly, (req, res) => { const { firstName, lastName, email } = req.body; try { const result = db.prepare('UPDATE admins SET firstName = ?, lastName = ?, email = ? WHERE id = ?').run(firstName, lastName, email.toLowerCase(), req.user.id); if (!result.changes) return res.status(404).send({ error: 'Admin not found' }); res.json({ message: 'Profile updated successfully', admin: db.prepare('SELECT id AS _id, firstName, lastName, email, role FROM admins WHERE id = ?').get(req.user.id) }); } catch { res.status(400).send({ error: 'Unable to update profile' }); } });
router.get('/total-doctors', auth, adminOnly, (req, res) => res.json({ totalDoctors: db.prepare('SELECT COUNT(*) AS count FROM doctors').get().count }));
router.get('/total-patients', auth, adminOnly, (req, res) => res.json({ totalPatients: db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'patient'").get().count }));
router.get('/doctor-overview', auth, adminOnly, (req, res) => res.json(db.prepare(`SELECT d.firstName || ' ' || d.lastName AS name, d.specialty, COUNT(DISTINCT a.patientId) AS patients FROM doctors d LEFT JOIN appointments a ON a.doctorId = d.id GROUP BY d.id`).all()));
router.get('/patient-overview', auth, adminOnly, (req, res) => res.json(db.prepare(`SELECT u.firstName || ' ' || u.lastName AS name, COUNT(a.id) AS appointments FROM users u LEFT JOIN appointments a ON a.patientId = u.id WHERE u.role = 'patient' GROUP BY u.id`).all()));
module.exports = router;
