const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { load, save } = require('../store');
const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password || password.length < 6)
      return res.status(400).json({ message: 'Username, email and password (min 6 characters) are required' });
    const data = load();
    if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      return res.status(409).json({ message: 'Email already registered' });
    const user = { id: require('crypto').randomUUID(), username, email, password: await bcrypt.hash(password, 10), role: 'user' };
    data.users.push(user); save(data);
    res.status(201).json({ message: 'User registered', id: user.id, username: user.username, email: user.email });
  } catch { res.status(500).json({ message: 'Signup failed' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = load().users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user || !await bcrypt.compare(password || '', user.password)) return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch { res.status(500).json({ message: 'Login failed' }); }
});
module.exports = router;
