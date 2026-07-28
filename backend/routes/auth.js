const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function publicUser(u) {
  return {
    id: u.id,
    first: u.first,
    last: u.last,
    email: u.email,
    country: u.country,
    discord: u.discord,
    rol: u.rol,
    created_at: u.created_at
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { first, last, email, country, password, discord } = req.body;

  if (!first || !last || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM public.users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    }

    const pass_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO public.users (first, last, email, country, pass_hash, created_at, discord, rol)
       VALUES ($1, $2, $3, $4, $5, now()::text, $6, 'cliente')
       RETURNING id, first, last, email, country, discord, rol, created_at`,
      [first.trim(), last.trim(), email.toLowerCase().trim(), country || null, pass_hash, discord || null]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno al registrar' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan email o contraseña' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM public.users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    if (!user || !user.pass_hash) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const valid = await bcrypt.compare(password, user.pass_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM public.users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Error en /me:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
