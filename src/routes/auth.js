const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const bcrypt = require('bcrypt');

const router = express.Router();

// fixed — credentials from environment variables
//const JWT_SECRET = process.env.JWT_SECRET;

// helper for generating tokens
function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    //input validation — the registration endpoint currently lacks proper input validation, which could lead to issues like weak passwords or invalid email formats. To enhance security and data integrity, we should implement comprehensive validation checks for the user input.
    if (!username || !email || !password) {
  return res.status(400).json({ error: 'username, email and password are required' });
}
if (password.length < 8) {
  return res.status(400).json({ error: 'Password must be at least 8 characters' });
}
if (!/[A-Z]/.test(password)) {
  return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
}
if (!/[0-9]/.test(password)) {
  return res.status(400).json({ error: 'Password must contain at least one number' });
}
if (!/[!@#$%^&*]/.test(password)) {
  return res.status(400).json({ error: 'Password must contain at least one special character (!@#$%^&*)' });
}
// Simple email format check
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Please provide a valid email address' });
}
    //hash the password before storing it in the database to enhance security. This way, even if the database is compromised, the actual passwords won't be exposed.
 // fixed — hash password before saving
   const hashedPassword = await bcrypt.hash(password, 12);
   const result = await pool.query(
  'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
  [username, email, hashedPassword]
);
    const user = result.rows[0];
    const token = makeToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" }); //bug 9 --stack: err.stack exposes sensitive info, so we should remove it from the error response to avoid potential security risks.
  }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // Security Fix 8 — Input validation: check required fields before touching the database
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  // Security Fix 8 — Email validation: ensure valid email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  //security issue — the login endpoint is vulnerable to SQL injection because it constructs the query by directly concatenating user input (email and password) into the SQL string. An attacker could exploit this by providing specially crafted input to manipulate the query and potentially gain unauthorized access or damage the database. To fix this, we should use parameterized queries instead of string concatenation to safely handle user input.

  const query = "SELECT * FROM users WHERE email = $1";
  //fixed -fetch the user by email first, then compare the hashed password using bcrypt to enhance security and prevent SQL injection vulnerabilities.

  // Bug 9 Fix — Added try/catch to handle database errors gracefully
  try {
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = makeToken(user);
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
  } catch (err) {
   // console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
