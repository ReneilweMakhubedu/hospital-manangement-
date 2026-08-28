const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password, role } = req.body;
  const tables = [
    { name: 'users', role: 'patient' },
    { name: 'doctors', role: 'doctor' },
    { name: 'admins', role: 'admin' },
  ];

  const requestedRole = String(role || '').trim().toLowerCase();
  const emailValue = String(email || '').trim().toLowerCase();

  if (!emailValue || !password) return res.status(400).send({ error: 'Email and password are required' });

  try {
    const candidateTables = requestedRole
      ? [tables.find((entry) => entry.role === requestedRole) || tables[0], ...tables.filter((entry) => entry.role !== requestedRole)]
      : tables;

    for (const table of candidateTables) {
      const user = await db.prepare(`SELECT * FROM ${table.name} WHERE email = ?`).get(emailValue);
      if (!user) continue;
      if (!(await bcrypt.compare(password, user.password))) continue;

      const token = jwt.sign({ id: user.id, role: user.role || table.role }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '24h' });
      return res.send({
        token,
        role: user.role || table.role,
        onboardingComplete: user.role === 'patient' ? Boolean(user.onboardingComplete) : true,
      });
    }

    return res.status(400).send({ error: 'Invalid email or password' });
  } catch (error) {
    return res.status(500).send({ error: 'Server error' });
  }
});
module.exports = router;
