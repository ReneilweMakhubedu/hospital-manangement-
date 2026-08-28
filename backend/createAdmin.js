const bcrypt = require('bcrypt');
const db = require('./database');

async function createAdmin() {
  const password = await bcrypt.hash('xyz123', 10);
  try {
    db.prepare('INSERT INTO admins (firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?)').run('abc', 'xyz', 'abc@gmail.com', password, 'admin');
    console.log('Admin created successfully');
  } catch (error) {
    console.error(error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Admin already exists' : `Error creating admin: ${error.message}`);
  }
}
createAdmin();
