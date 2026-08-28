const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const db = require('../database');
const signupRoute = require('../routes/signup');
const loginRoute = require('../routes/login');

before(async () => {
  await db.initDatabase();
});

function makeResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
}

function postHandler(router) {
  return router.stack.find((layer) => layer.route?.methods.post)?.route.stack[0].handle;
}

test('signup creates a patient account when no role is provided', async () => {
  const email = `signup-${Date.now()}@example.com`;
  const req = {
    body: {
      firstName: 'Jane',
      lastName: 'Doe',
      email,
      password: 'secret123',
    },
  };
  const res = makeResponse();

  await postHandler(signupRoute)(req, res);

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  assert.equal(res.statusCode, 201);
  assert.ok(user);
  assert.equal(user.role, 'patient');
});

test('login accepts a patient account even when role is omitted', async () => {
  const email = `login-${Date.now()}@example.com`;
  const hash = await bcrypt.hash('secret123', 10);

  db.prepare('INSERT INTO users (firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?)')
    .run('Login', 'User', email.toLowerCase(), hash, 'patient');

  const req = {
    body: {
      email,
      password: 'secret123',
    },
  };
  const res = makeResponse();

  await postHandler(loginRoute)(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body && res.body.token);
  assert.equal(res.body.role, 'patient');
});
