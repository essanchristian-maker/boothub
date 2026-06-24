const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'boothub_jwt_secret_2024';
const AVATAR_COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#f97316', '#14b8a6', '#3b82f6', '#ef4444', '#a855f7'];

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(400).json({ error: 'Cet email est déjà utilisé' });

    const hash = bcrypt.hashSync(password, 10);
    const avatar_color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const { rows } = await db.query(
      'INSERT INTO users (name, email, password, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, name, email, bio, skills, avatar_color, created_at',
      [name, email, hash, avatar_color]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...user, skills: JSON.parse(user.skills || '[]') } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Champs manquants' });

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const { password: _, ...safe } = user;
    const token = jwt.sign({ id: safe.id, name: safe.name, email: safe.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { ...safe, skills: JSON.parse(safe.skills || '[]') } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
