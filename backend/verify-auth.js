const bcrypt = require('bcrypt');
const db = require('./database');

(async () => {
  const email = 'authcheck' + Date.now() + '@example.com';
  const hash = await bcrypt.hash('secret123', 10);

  db.prepare('INSERT INTO users (firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?)')
    .run('Test', 'User', email.toLowerCase(), hash, 'patient');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  const verified = user && (await bcrypt.compare('secret123', user.password));

  console.log(JSON.stringify({ found: !!user, role: user && user.role, compare: verified }));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
