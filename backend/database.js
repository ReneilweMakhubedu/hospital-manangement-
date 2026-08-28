const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dataDirectory = path.join(__dirname, 'data');
const dbPath = path.join(dataDirectory, 'hospital.db');

let SQL;
let db;
let isInitialized = false;

// ======================================================
// INITIALIZE DATABASE
// ======================================================

async function initDatabase() {
  if (isInitialized) return;

  SQL = await initSqlJs();

  // Create data folder
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  // Load existing database or create a new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // ======================================================
  // USERS TABLE
  // ======================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'patient',
      idNumber TEXT UNIQUE,
      phoneNumber TEXT,
      address TEXT,
      dob TEXT,
      gender TEXT,
      emergencyContact TEXT,
      allergies TEXT,
      existingConditions TEXT,
      currentMedications TEXT,
      previousMedicalInfo TEXT,
      nextOfKin TEXT,
      documents TEXT NOT NULL DEFAULT '[]',
      onboardingComplete INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ======================================================
  // DOCTORS TABLE
  // ======================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      specialty TEXT NOT NULL,
      licenseNumber TEXT NOT NULL UNIQUE,
      phoneNumber TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'doctor',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ======================================================
  // ADMINS TABLE
  // ======================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ======================================================
  // APPOINTMENTS TABLE
  // ======================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      doctorId INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ======================================================
  // PRESCRIPTIONS TABLE
  // ======================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      doctorId INTEGER NOT NULL,
      medication TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ======================================================
  // MEDICINES TABLE
  // ======================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      strength TEXT NOT NULL,
      form TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      reorderLevel INTEGER NOT NULL DEFAULT 10,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ======================================================
  // DISPENSATIONS TABLE
  // ======================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS dispensations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescriptionId INTEGER NOT NULL,
      medicineId INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      dispensedBy INTEGER NOT NULL,
      dispensedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prescriptionId) REFERENCES prescriptions(id),
      FOREIGN KEY (medicineId) REFERENCES medicines(id)
    )
  `);

  // ======================================================
  // QUEUE TABLE
  // ======================================================

  db.run(`
    CREATE TABLE IF NOT EXISTS queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      queueNumber INTEGER NOT NULL,
      queueDate TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'waiting',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      calledAt TEXT,
      completedAt TEXT,
      FOREIGN KEY (patientId) REFERENCES users(id)
    )
  `);

  // ======================================================
  // QUEUE INDEX
  // ======================================================

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_queue_number_per_day
    ON queue (queueDate, queueNumber)
  `);

  // ======================================================
  // APPOINTMENT INDEX
  // ======================================================

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_doctor_appointment_slot
    ON appointments (doctorId, date, time)
  `);

  // ======================================================
  // CHECK AND ADD MISSING USER COLUMNS
  // ======================================================

  const result = db.exec('PRAGMA table_info(users)');

  const existingColumns = new Set();

  if (
    result.length > 0 &&
    result[0].values &&
    result[0].values.length > 0
  ) {
    result[0].values.forEach((column) => {
      existingColumns.add(column[1]);
    });
  }

  const addColumnIfMissing = (name, definition) => {
    if (!existingColumns.has(name)) {
      try {
        db.run(
          `ALTER TABLE users ADD COLUMN ${name} ${definition}`
        );

        console.log(`Added missing users column: ${name}`);
      } catch (error) {
        console.log(
          `Could not add column ${name}:`,
          error.message
        );
      }
    }
  };

  addColumnIfMissing('dob', 'TEXT');
  addColumnIfMissing('gender', 'TEXT');
  addColumnIfMissing('emergencyContact', 'TEXT');
  addColumnIfMissing('allergies', 'TEXT');
  addColumnIfMissing('existingConditions', 'TEXT');
  addColumnIfMissing('currentMedications', 'TEXT');
  addColumnIfMissing('previousMedicalInfo', 'TEXT');
  addColumnIfMissing('nextOfKin', 'TEXT');
  addColumnIfMissing(
    'documents',
    "TEXT NOT NULL DEFAULT '[]'"
  );
  addColumnIfMissing(
    'onboardingComplete',
    'INTEGER NOT NULL DEFAULT 0'
  );

  // Save everything
  saveDatabase();

  isInitialized = true;

  console.log('======================================');
  console.log('Database initialized successfully');
  console.log('Users table: OK');
  console.log('Doctors table: OK');
  console.log('Appointments table: OK');
  console.log('Prescriptions table: OK');
  console.log('Pharmacy tables: OK');
  console.log('Queue table: OK');
  console.log('======================================');
}

// ======================================================
// SAVE DATABASE
// ======================================================

function saveDatabase() {
  if (!db) return;

  try {
    const data = db.export();
    const buffer = Buffer.from(data);

    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    console.error(
      'Error saving database:',
      error.message
    );
  }
}

// ======================================================
// DATABASE WRAPPER
// ======================================================

const dbWrapper = {
  prepare: (sql) => ({
    // ====================================================
    // RUN
    // ====================================================

    run: (...params) => {
      try {
        const stmt = db.prepare(sql);

        if (params && params.length > 0) {
          stmt.bind(params);
        }

        stmt.step();

        // Get last inserted ID
        let lastInsertRowid = 0;

        const idStmt = db.prepare(
          'SELECT last_insert_rowid() AS id'
        );

        if (idStmt.step()) {
          const row = idStmt.getAsObject();

          lastInsertRowid = row.id || 0;
        }

        idStmt.free();
        stmt.free();

        saveDatabase();

        return {
          lastInsertRowid,
          changes: 1
        };
      } catch (error) {
        console.error(
          'Database run error:',
          error.message
        );

        throw error;
      }
    },

    // ====================================================
    // ALL
    // ====================================================

    all: (...params) => {
      try {
        const results = [];

        const stmt = db.prepare(sql);

        if (params && params.length > 0) {
          stmt.bind(params);
        }

        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }

        stmt.free();

        return results;
      } catch (error) {
        console.error(
          'Database all error:',
          error.message
        );

        throw error;
      }
    },

    // ====================================================
    // GET
    // ====================================================

    get: (...params) => {
      try {
        const stmt = db.prepare(sql);

        if (params && params.length > 0) {
          stmt.bind(params);
        }

        let result;

        if (stmt.step()) {
          result = stmt.getAsObject();
        }

        stmt.free();

        return result;
      } catch (error) {
        console.error(
          'Database get error:',
          error.message
        );

        throw error;
      }
    }
  }),

  // ======================================================
  // EXEC
  // ======================================================

  exec: (sql) => {
    try {
      db.run(sql);

      saveDatabase();
    } catch (error) {
      console.error(
        'Database exec error:',
        error.message
      );

      throw error;
    }
  },

  // ======================================================
  // PRAGMA
  // ======================================================

  pragma: (pragma) => {
    try {
      db.run(`PRAGMA ${pragma}`);
    } catch (error) {
      console.error(
        'Database pragma error:',
        error.message
      );

      throw error;
    }
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = dbWrapper;
module.exports.initDatabase = initDatabase;