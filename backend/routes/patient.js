const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../database');
const router = express.Router();
const secret = process.env.JWT_SECRET || 'your_jwt_secret';

const uploadDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: () => uploadDirectory,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`),
});
const upload = multer({ storage });

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send({ error: 'No token provided' });
  try { req.user = jwt.verify(token, secret); next(); } catch { res.status(401).send({ error: 'Invalid token' }); }
};
const staffOnly = (req, res, next) => ['admin', 'doctor'].includes(req.user.role) ? next() : res.status(403).send({ error: 'Only clinic staff can manage patient records' });
const patientFields = 'id AS _id, firstName, lastName, email, idNumber, phoneNumber, address, dob, gender, emergencyContact, allergies, existingConditions, currentMedications, previousMedicalInfo, nextOfKin, documents, onboardingComplete, createdAt';

router.get('/records', auth, staffOnly, async (req, res) => {
  try { res.json(await db.prepare(`SELECT ${patientFields} FROM users WHERE role = 'patient' ORDER BY datetime(createdAt) DESC`).all()); }
  catch (error) { res.status(500).send({ error: 'Unable to fetch patient records' }); }
});

router.post('/records', auth, staffOnly, async (req, res) => {
  const { firstName, lastName, email, password, idNumber, phoneNumber, address } = req.body;
  if (![firstName, lastName, email, password, idNumber, phoneNumber, address].every(Boolean)) return res.status(400).send({ error: 'All patient details are required' });
  if (password.length < 6) return res.status(400).send({ error: 'Temporary password must be at least 6 characters' });
  try {
    const result = await db.prepare('INSERT INTO users (firstName, lastName, email, password, role, idNumber, phoneNumber, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(firstName.trim(), lastName.trim(), email.trim().toLowerCase(), await bcrypt.hash(password, 10), 'patient', idNumber.trim(), phoneNumber.trim(), address.trim());
    const patient = await db.prepare(`SELECT ${patientFields} FROM users WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ message: 'Patient registered successfully', patient });
  } catch (error) { res.status(400).send({ error: error.code === '23505' ? 'A patient with that email address or ID number already exists' : 'Unable to register patient' }); }
});

router.get('/profile', auth, async (req, res) => {
  const patient = await db.prepare(`SELECT ${patientFields} FROM users WHERE id = ? AND role = 'patient'`).get(req.user.id);
  patient ? res.json(patient) : res.status(404).send({ error: 'Patient not found' });
});

router.put('/profile', auth, async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    idNumber,
    phoneNumber,
    address,
    dob,
    gender,
    emergencyContact,
    allergies,
    existingConditions,
    currentMedications,
    previousMedicalInfo,
    nextOfKin,
    onboardingComplete,
  } = req.body;
  const normalizedIdNumber = typeof idNumber === 'string' && idNumber.trim() ? idNumber.trim() : null;

  try {
    // Check if email is being changed and already exists for another user
    if (email) {
      const existingEmail = await db.prepare(`SELECT id FROM users WHERE email = ? AND id != ? AND role = 'patient'`).get(email.toLowerCase(), req.user.id);
      if (existingEmail) {
        return res.status(400).send({ error: 'Email already in use by another patient' });
      }
    }

    // Check if idNumber is being changed and already exists for another user
    if (normalizedIdNumber) {
      const existingIdNumber = await db.prepare(`SELECT id FROM users WHERE idNumber = ? AND id != ? AND role = 'patient'`).get(normalizedIdNumber, req.user.id);
      if (existingIdNumber) {
        return res.status(400).send({ error: 'ID number already in use by another patient' });
      }
    }

    // Execute UPDATE
    await db.prepare(
      `UPDATE users SET firstName = ?, lastName = ?, email = ?, idNumber = ?, phoneNumber = ?, address = ?, dob = ?, gender = ?, emergencyContact = ?, allergies = ?, existingConditions = ?, currentMedications = ?, previousMedicalInfo = ?, nextOfKin = ?, onboardingComplete = ? WHERE id = ? AND role = ?`
    ).run(
      firstName,
      lastName,
      email?.toLowerCase(),
      normalizedIdNumber,
      phoneNumber,
      address,
      dob,
      gender,
      emergencyContact,
      allergies,
      existingConditions,
      currentMedications,
      previousMedicalInfo,
      nextOfKin,
      onboardingComplete ? 1 : 0,
      req.user.id,
      'patient'
    );

    // Fetch and return updated user
    const updatedUser = await db.prepare(`SELECT ${patientFields} FROM users WHERE id = ?`).get(req.user.id);
    if (!updatedUser) {
      return res.status(404).send({ error: 'Patient not found after update' });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error('Patient profile update error:', error.message);
    if (error.code === '23505' || error.message.includes('UNIQUE constraint')) {
      return res.status(400).send({ error: 'Email or ID number already exists' });
    }
    res.status(400).send({ error: 'Unable to update profile: ' + error.message });
  }
});

router.post('/documents', auth, upload.array('documents', 10), async (req, res) => {
  try {
    const patient = await db.prepare(`SELECT documents FROM users WHERE id = ? AND role = 'patient'`).get(req.user.id);
    if (!patient) return res.status(404).send({ error: 'Patient not found' });

    const existingDocs = Array.isArray(patient.documents) ? patient.documents : JSON.parse(patient.documents || '[]');
    const newDocs = (req.files || []).map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      uploadedAt: new Date().toISOString(),
    }));
    const mergedDocs = [...existingDocs, ...newDocs];

    await db.prepare('UPDATE users SET documents = ? WHERE id = ? AND role = ?').run(JSON.stringify(mergedDocs), req.user.id, 'patient');
    res.json({ documents: mergedDocs });
  } catch (error) {
    res.status(500).send({ error: 'Unable to upload documents' });
  }
});

router.post('/book-appointment', auth, async (req, res) => {
  const { doctorId, date, time, reason } = req.body;
  try {
    const result = await db.prepare('INSERT INTO appointments (patientId, doctorId, date, time, reason) VALUES (?, ?, ?, ?, ?)').run(req.user.id, doctorId, date, time, reason);
    res.status(201).json({ message: 'Appointment booked successfully', appointment: await db.prepare('SELECT id AS _id, * FROM appointments WHERE id = ?').get(result.lastInsertRowid) });
  } catch { res.status(500).send({ error: 'Server error' }); }
});

router.get('/available-slots', auth, async (req, res) => {
  const booked = (await db.prepare('SELECT time FROM appointments WHERE doctorId = ? AND date = ?').all(req.query.doctorId, req.query.date)).map((row) => row.time);
  res.json(['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].filter((time) => !booked.includes(time)));
});

router.get('/appointments', auth, async (req, res) => {
  const appointments = await db.prepare(`SELECT a.id AS _id, a.*, d.firstName AS doctorFirstName, d.lastName AS doctorLastName FROM appointments a JOIN doctors d ON d.id = a.doctorId WHERE a.patientId = ? AND date(a.date) = date('now') ORDER BY a.time`).all(req.user.id);
  res.json(appointments);
});
router.get('/care-team', auth, async (req, res) => res.json(await db.prepare(`SELECT DISTINCT d.id AS _id, d.firstName, d.lastName, d.specialty FROM doctors d JOIN appointments a ON a.doctorId = d.id WHERE a.patientId = ?`).all(req.user.id)));
router.get('/prescriptions', auth, async (req, res) => res.json(await db.prepare(`SELECT p.id AS _id, p.*, d.firstName AS doctorFirstName, d.lastName AS doctorLastName FROM prescriptions p JOIN doctors d ON d.id = p.doctorId WHERE p.patientId = ?`).all(req.user.id)));

// Get all patient's appointments (for dashboard)
router.get('/my-appointments', auth, async (req, res) => {
  try {
    const appointments = await db.prepare(`
      SELECT a.id AS _id, a.patientId, a.doctorId, a.date, a.time, a.reason, a.status, a.createdAt,
      d.firstName || ' ' || d.lastName AS doctorName, d.specialty
      FROM appointments a 
      JOIN doctors d ON d.id = a.doctorId 
      WHERE a.patientId = ? 
      ORDER BY a.date DESC, a.time DESC
    `).all(req.user.id);
    res.json(appointments);
  } catch (error) {
    res.status(500).send({ error: 'Unable to fetch appointments' });
  }
});

// Reschedule patient's appointment
router.put('/appointments/:id/reschedule', auth, async (req, res) => {
  const { date, time } = req.body;
  const appointmentId = parseInt(req.params.id);

  if (!date || !time) {
    return res.status(400).send({ error: 'Date and time are required' });
  }

  try {
    // Verify the appointment belongs to the patient
    const appointment = await db.prepare('SELECT * FROM appointments WHERE id = ? AND patientId = ?').get(appointmentId, req.user.id);
    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found' });
    }

    // Check if the new slot is available (no other appointment at that time with that doctor)
    const conflict = await db.prepare('SELECT id FROM appointments WHERE doctorId = ? AND date = ? AND time = ? AND id != ?').get(appointment.doctorId, date, time, appointmentId);
    if (conflict) {
      return res.status(400).send({ error: 'That time slot is not available. Please choose another.' });
    }

    // Update the appointment
    await db.prepare('UPDATE appointments SET date = ?, time = ? WHERE id = ?').run(date, time, appointmentId);

    // Return updated appointment
    const updated = await db.prepare(`
      SELECT a.id AS _id, a.patientId, a.doctorId, a.date, a.time, a.reason, a.status, a.createdAt,
      d.firstName || ' ' || d.lastName AS doctorName, d.specialty
      FROM appointments a 
      JOIN doctors d ON d.id = a.doctorId 
      WHERE a.id = ?
    `).get(appointmentId);

    res.json(updated);
  } catch (error) {
    console.error('Reschedule error:', error.message);
    res.status(500).send({ error: 'Unable to reschedule appointment' });
  }
});

// Cancel patient's appointment (frees up the slot)
router.delete('/appointments/:id', auth, async (req, res) => {
  const appointmentId = parseInt(req.params.id);

  try {
    // Verify the appointment belongs to the patient
    const appointment = await db.prepare('SELECT * FROM appointments WHERE id = ? AND patientId = ?').get(appointmentId, req.user.id);
    if (!appointment) {
      return res.status(404).send({ error: 'Appointment not found' });
    }

    // Delete the appointment (frees up the slot for others)
    await db.prepare('DELETE FROM appointments WHERE id = ?').run(appointmentId);

    res.json({ message: 'Appointment cancelled. The time slot is now available for other patients.' });
  } catch (error) {
    console.error('Cancel error:', error.message);
    res.status(500).send({ error: 'Unable to cancel appointment' });
  }
});

module.exports = router;
