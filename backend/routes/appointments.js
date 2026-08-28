const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();
const secret = process.env.JWT_SECRET || 'your_jwt_secret';
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send({ error: 'No token provided' });
  try { req.user = jwt.verify(token, secret); next(); } catch { res.status(401).send({ error: 'Invalid token' }); }
};
const staffOnly = (req, res, next) => ['admin', 'doctor'].includes(req.user.role) ? next() : res.status(403).send({ error: 'Only clinic staff can manage appointments' });
const appointmentQuery = `SELECT a.id AS _id, a.patientId, a.doctorId, a.date, a.time, a.reason, a.status, a.createdAt,
  p.firstName || ' ' || p.lastName AS patientName, d.firstName || ' ' || d.lastName AS doctorName, d.specialty
  FROM appointments a JOIN users p ON p.id = a.patientId JOIN doctors d ON d.id = a.doctorId`;

router.get('/', auth, staffOnly, (req, res) => {
  try { res.json(db.prepare(`${appointmentQuery} ORDER BY a.date ASC, a.time ASC`).all()); }
  catch { res.status(500).send({ error: 'Unable to load appointments' }); }
});

router.post('/', auth, staffOnly, (req, res) => {
  const { patientId, doctorId, date, time, reason } = req.body;
  if (![patientId, doctorId, date, time, reason].every(Boolean)) return res.status(400).send({ error: 'Patient, doctor, date, time, and reason are required' });
  const patient = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'patient'").get(patientId);
  const doctor = db.prepare('SELECT id FROM doctors WHERE id = ?').get(doctorId);
  if (!patient || !doctor) return res.status(400).send({ error: 'Select a valid patient and doctor' });
  try {
    const result = db.prepare('INSERT INTO appointments (patientId, doctorId, date, time, reason) VALUES (?, ?, ?, ?, ?)').run(patientId, doctorId, date, time, reason.trim());
    res.status(201).json({ message: 'Appointment scheduled successfully', appointment: db.prepare(`${appointmentQuery} WHERE a.id = ?`).get(result.lastInsertRowid) });
  } catch (error) {
    res.status(400).send({ error: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'That doctor already has an appointment at this time' : 'Unable to schedule appointment' });
  }
});

module.exports = router;
