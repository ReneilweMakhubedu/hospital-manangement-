const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

const secret =
  process.env.JWT_SECRET || 'clinicflow_secret_2026';

// =====================================
// AUTHENTICATION
// =====================================
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: 'No token provided'
    });
  }

  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
};

// =====================================
// STAFF ONLY
// =====================================
const staffOnly = (req, res, next) => {
  if (!['admin', 'doctor'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Only clinic staff can manage the queue'
    });
  }

  next();
};

// =====================================
// GET TODAY'S QUEUE
// IMPORTANT: This is /api/queue
// =====================================
router.get('/', auth, staffOnly, async (req, res) => {
  try {
    const queue = await db.prepare(`
      SELECT
        q.id AS _id,
        q.queueNumber,
        q.queueDate,
        q.reason,
        q.status,
        q.createdAt,
        q.calledAt,
        q.completedAt,
        u.id AS patientId,
        u.firstName,
        u.lastName,
        u.idNumber,
        u.phoneNumber
      FROM queue q
      JOIN users u ON u.id = q.patientId
      WHERE q.queueDate = date('now', 'localtime')
      ORDER BY q.queueNumber ASC
    `).all();

    res.json(queue);
  } catch (error) {
    console.error('Queue fetch error:', error.message);

    res.status(500).json({
      error: 'Unable to fetch queue'
    });
  }
});

// =====================================
// GET TODAY'S QUEUE - /today
// =====================================
router.get('/today', auth, staffOnly, async (req, res) => {
  try {
    const queue = await db.prepare(`
      SELECT
        q.id AS _id,
        q.queueNumber,
        q.queueDate,
        q.reason,
        q.status,
        q.createdAt,
        q.calledAt,
        q.completedAt,
        u.id AS patientId,
        u.firstName,
        u.lastName,
        u.idNumber,
        u.phoneNumber
      FROM queue q
      JOIN users u ON u.id = q.patientId
      WHERE q.queueDate = date('now', 'localtime')
      ORDER BY q.queueNumber ASC
    `).all();

    res.json(queue);
  } catch (error) {
    console.error('Queue fetch error:', error.message);

    res.status(500).json({
      error: 'Unable to fetch queue'
    });
  }
});

// =====================================
// GET PATIENTS
// =====================================
router.get('/patients', auth, staffOnly, async (req, res) => {
  try {
    const patients = await db.prepare(`
      SELECT
        id,
        firstName,
        lastName,
        idNumber,
        phoneNumber
      FROM users
      WHERE role = 'patient'
      ORDER BY firstName ASC
    `).all();

    res.json(patients);
  } catch (error) {
    console.error('Patient fetch error:', error.message);

    res.status(500).json({
      error: 'Unable to fetch patients'
    });
  }
});

// =====================================
// ADD PATIENT TO QUEUE
// POST /api/queue
// =====================================
router.post('/', auth, staffOnly, async (req, res) => {
  const { patientId, reason } = req.body;

  if (!patientId) {
    return res.status(400).json({
      error: 'Please select a patient'
    });
  }

  try {
    const patient = await db.prepare(`
      SELECT
        id,
        firstName,
        lastName,
        idNumber,
        phoneNumber
      FROM users
      WHERE id = ?
      AND role = 'patient'
    `).get(patientId);

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found'
      });
    }

    const today = (await db.prepare(`
      SELECT date('now', 'localtime') AS today
    `).get()).today;

    const existing = await db.prepare(`
      SELECT
        id,
        queueNumber,
        status
      FROM queue
      WHERE patientId = ?
      AND queueDate = ?
      AND status IN ('waiting', 'called', 'in_consultation')
    `).get(patientId, today);

    if (existing) {
      return res.status(400).json({
        error: `Patient is already in today's queue as number ${existing.queueNumber}`
      });
    }

    const last = await db.prepare(`
      SELECT MAX(queueNumber) AS lastNumber
      FROM queue
      WHERE queueDate = ?
    `).get(today);

    const queueNumber = (last?.lastNumber || 0) + 1;

    const result = await db.prepare(`
      INSERT INTO queue (
        patientId,
        queueNumber,
        queueDate,
        reason,
        status
      )
      VALUES (?, ?, ?, ?, 'waiting')
    `).run(
      patientId,
      queueNumber,
      today,
      reason || ''
    );

    const queueEntry = await db.prepare(`
      SELECT
        q.id AS _id,
        q.queueNumber,
        q.queueDate,
        q.reason,
        q.status,
        q.createdAt,
        q.calledAt,
        q.completedAt,
        u.id AS patientId,
        u.firstName,
        u.lastName,
        u.idNumber,
        u.phoneNumber
      FROM queue q
      JOIN users u ON u.id = q.patientId
      WHERE q.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Patient added to queue successfully',
      queue: queueEntry
    });

  } catch (error) {
    console.error('Add queue error:', error.message);

    res.status(500).json({
      error: 'Unable to add patient to queue'
    });
  }
});

// =====================================
// CALL NEXT PATIENT
// PUT /api/queue/next
// =====================================
router.put('/next', auth, staffOnly, async (req, res) => {
  try {
    const today = (await db.prepare(`
      SELECT date('now', 'localtime') AS today
    `).get()).today;

    const next = await db.prepare(`
      SELECT id
      FROM queue
      WHERE queueDate = ?
      AND status = 'waiting'
      ORDER BY queueNumber ASC
      LIMIT 1
    `).get(today);

    if (!next) {
      return res.status(404).json({
        error: 'There are no waiting patients'
      });
    }

    await db.prepare(`
      UPDATE queue
      SET
        status = 'called',
        calledAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(next.id);

    const updated = await db.prepare(`
      SELECT
        q.id AS _id,
        q.queueNumber,
        q.queueDate,
        q.reason,
        q.status,
        q.createdAt,
        q.calledAt,
        q.completedAt,
        u.id AS patientId,
        u.firstName,
        u.lastName,
        u.idNumber,
        u.phoneNumber
      FROM queue q
      JOIN users u ON u.id = q.patientId
      WHERE q.id = ?
    `).get(next.id);

    res.json({
      message: 'Next patient called',
      queue: updated
    });

  } catch (error) {
    console.error('Call next error:', error.message);

    res.status(500).json({
      error: 'Unable to call next patient'
    });
  }
});

// =====================================
// UPDATE QUEUE STATUS
// PUT /api/queue/:id/status
// =====================================
router.put('/:id/status', auth, staffOnly, async (req, res) => {
  const queueId = parseInt(req.params.id);
  const { status } = req.body;

  const allowedStatuses = [
    'waiting',
    'called',
    'in_consultation',
    'completed',
    'cancelled'
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid queue status'
    });
  }

  try {
    const existing = await db.prepare(`
      SELECT id
      FROM queue
      WHERE id = ?
    `).get(queueId);

    if (!existing) {
      return res.status(404).json({
        error: 'Queue entry not found'
      });
    }

    let completedAt = null;

    if (status === 'completed') {
      completedAt = new Date().toISOString();
    }

    await db.prepare(`
      UPDATE queue
      SET
        status = ?,
        completedAt = ?
      WHERE id = ?
    `).run(
      status,
      completedAt,
      queueId
    );

    const updated = await db.prepare(`
      SELECT
        q.id AS _id,
        q.queueNumber,
        q.queueDate,
        q.reason,
        q.status,
        q.createdAt,
        q.calledAt,
        q.completedAt,
        u.id AS patientId,
        u.firstName,
        u.lastName,
        u.idNumber,
        u.phoneNumber
      FROM queue q
      JOIN users u ON u.id = q.patientId
      WHERE q.id = ?
    `).get(queueId);

    res.json(updated);

  } catch (error) {
    console.error('Status update error:', error.message);

    res.status(500).json({
      error: 'Unable to update queue status'
    });
  }
});

// =====================================
// DELETE QUEUE ENTRY
// =====================================
router.delete('/:id', auth, staffOnly, async (req, res) => {
  const queueId = parseInt(req.params.id);

  try {
    const existing = await db.prepare(`
      SELECT id
      FROM queue
      WHERE id = ?
    `).get(queueId);

    if (!existing) {
      return res.status(404).json({
        error: 'Queue entry not found'
      });
    }

    await db.prepare(`
      DELETE FROM queue
      WHERE id = ?
    `).run(queueId);

    res.json({
      message: 'Queue entry removed successfully'
    });

  } catch (error) {
    console.error('Delete queue error:', error.message);

    res.status(500).json({
      error: 'Unable to remove queue entry'
    });
  }
});

module.exports = router;