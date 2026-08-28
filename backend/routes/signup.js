const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

router.post('/', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  const requestedRole = typeof role === 'string' && role.trim() ? role.trim().toLowerCase() : 'patient';

  if (!firstName || !lastName || !email || !password) return res.status(400).send({ error: 'First name, last name, email, and password are required' });
  if (password.length < 6) return res.status(400).send({ error: 'Password must be at least 6 characters' });
  if (!['patient', 'doctor', 'admin'].includes(requestedRole)) return res.status(400).send({ error: 'Invalid role' });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.prepare('INSERT INTO users (firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?)')
      .run(firstName.trim(), lastName.trim(), email.trim().toLowerCase(), passwordHash, requestedRole);

    const token = jwt.sign({ id: result.lastInsertRowid, role: requestedRole }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '24h' });

    res.status(201).send({ message: 'User registered successfully', patientId: result.lastInsertRowid, role: requestedRole, token, onboardingComplete: false });
  } catch (error) {
    res.status(400).send({ error: error.code === '23505' ? 'Email already exists' : error.message });
  }
});
module.exports = router;
