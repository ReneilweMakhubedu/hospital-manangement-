const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : undefined,
});

const camelCaseColumns = [
  'firstName', 'lastName', 'idNumber', 'phoneNumber', 'emergencyContact',
  'existingConditions', 'currentMedications', 'previousMedicalInfo',
  'nextOfKin', 'onboardingComplete', 'createdAt', 'patientId', 'doctorId',
  'queueNumber', 'queueDate', 'calledAt', 'completedAt', 'licenseNumber',
  'reorderLevel', 'updatedAt', 'prescriptionId', 'medicineId', 'dispensedBy',
  'dispensedAt',
];

function normalizeSql(sql) {
  let parameterIndex = 0;
  let normalized = sql.replace(/\?/g, () => `$${++parameterIndex}`);

  for (const column of camelCaseColumns) {
    normalized = normalized.replace(new RegExp(`\\b${column}\\b`, 'g'), `"${column}"`);
  }

  return normalized
    .replace(/date\('now',\s*'localtime'\)/gi, 'CURRENT_DATE')
    .replace(/date\('now'\)/gi, 'CURRENT_DATE')
    .replace(/datetime\(([^)]+)\)/gi, '$1');
}

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing. Add your Neon connection string to backend/.env');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'patient',
      "idNumber" TEXT UNIQUE, "phoneNumber" TEXT, address TEXT, dob TEXT, gender TEXT,
      "emergencyContact" TEXT, allergies TEXT, "existingConditions" TEXT,
      "currentMedications" TEXT, "previousMedicalInfo" TEXT, "nextOfKin" TEXT,
      documents TEXT NOT NULL DEFAULT '[]', "onboardingComplete" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS doctors (
      id SERIAL PRIMARY KEY, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, specialty TEXT NOT NULL,
      "licenseNumber" TEXT NOT NULL UNIQUE, "phoneNumber" TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'doctor', "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin',
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY, "patientId" INTEGER NOT NULL, "doctorId" INTEGER NOT NULL,
      date TEXT NOT NULL, time TEXT NOT NULL, reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled', "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS prescriptions (
      id SERIAL PRIMARY KEY, "patientId" INTEGER NOT NULL, "doctorId" INTEGER NOT NULL,
      medication TEXT NOT NULL, dosage TEXT NOT NULL, frequency TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS medicines (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, strength TEXT NOT NULL, form TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0, "reorderLevel" INTEGER NOT NULL DEFAULT 10,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS dispensations (
      id SERIAL PRIMARY KEY, "prescriptionId" INTEGER NOT NULL, "medicineId" INTEGER NOT NULL,
      quantity INTEGER NOT NULL, "dispensedBy" INTEGER NOT NULL,
      "dispensedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS queue (
      id SERIAL PRIMARY KEY, "patientId" INTEGER NOT NULL, "queueNumber" INTEGER NOT NULL,
      "queueDate" DATE NOT NULL, reason TEXT, status TEXT NOT NULL DEFAULT 'waiting',
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, "calledAt" TIMESTAMP,
      "completedAt" TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS unique_queue_number_per_day ON queue ("queueDate", "queueNumber");
    CREATE UNIQUE INDEX IF NOT EXISTS unique_doctor_appointment_slot ON appointments ("doctorId", date, time);
  `);
  console.log('PostgreSQL database initialized successfully');
}

const dbWrapper = {
  prepare(sql) {
    const text = normalizeSql(sql);
    return {
      async run(...params) {
        const result = await pool.query(`${text} RETURNING id`, params);
        return { lastInsertRowid: result.rows[0]?.id || 0, changes: result.rowCount };
      },
      async all(...params) { return (await pool.query(text, params)).rows; },
      async get(...params) { return (await pool.query(text, params)).rows[0]; },
    };
  },
  async exec(sql) { return pool.query(normalizeSql(sql)); },
  async transaction(callback) { return callback(); },
};

module.exports = dbWrapper;
module.exports.initDatabase = initDatabase;
