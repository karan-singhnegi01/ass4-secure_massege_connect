const jwt = require('jsonwebtoken');
const { load } = require('../store');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = load().users.find(u => u.id === payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = { id: user.id, username: user.username, email: user.email, role: user.role };
    next();
  } catch { return res.status(401).json({ message: 'Invalid or expired token' }); }
}
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
}
module.exports = { authenticate, requireAdmin };
