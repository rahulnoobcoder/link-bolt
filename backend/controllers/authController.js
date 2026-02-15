const User = require('../models/User');
const { signToken } = require('../middlewares/auth');
const { validateRegister } = require('../middlewares/validation');

/**
 * POST /api/auth/register
 */
exports.register = (req, res) => {
  try {
    const { username, password } = req.body;

    const check = validateRegister({ username, password });
    if (!check.valid) return res.status(400).json({ error: check.error });

    if (User.findByUsername(username)) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const user = User.create({ username, password });
    const token = signToken(user);

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/login
 */
exports.login = (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const user = User.findByUsername(username.trim());
    if (!user || !User.verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = signToken(user);
    return res.json({
      message: 'Logged in successfully.',
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/auth/me
 */
exports.me = (req, res) => {
  return res.json({ user: req.user });
};

/**
 * GET /api/auth/users/search?q=query
 */
exports.searchUsers = (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 1) {
      return res.json({ users: [] });
    }
    const users = User.search(q, req.user?.id);
    return res.json({ users });
  } catch (err) {
    console.error('Search users error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
