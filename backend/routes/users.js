const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.bio, u.skills, u.avatar_color, u.created_at,
              COUNT(DISTINCT p.id)::int as posts_count
       FROM users u
       LEFT JOIN posts p ON p.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows.map(u => ({ ...u, skills: JSON.parse(u.skills || '[]') })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const userRes = await db.query(
      'SELECT id, name, email, bio, skills, avatar_color, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const user = userRes.rows[0];

    const { rows: posts } = await db.query(
      `SELECT p.*, u.name as user_name, u.avatar_color,
              CASE WHEN l.user_id IS NOT NULL THEN 1 ELSE 0 END as liked_by_me
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = $1
       WHERE p.user_id = $2
       ORDER BY p.created_at DESC`,
      [req.user.id, req.params.id]
    );

    res.json({
      ...user,
      skills: JSON.parse(user.skills || '[]'),
      posts: posts.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', auth, async (req, res) => {
  if (req.user.id !== parseInt(req.params.id))
    return res.status(403).json({ error: 'Action non autorisée' });
  try {
    const { name, bio, skills } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom est requis' });

    const { rows } = await db.query(
      'UPDATE users SET name=$1, bio=$2, skills=$3 WHERE id=$4 RETURNING id, name, email, bio, skills, avatar_color, created_at',
      [name, bio || '', JSON.stringify(skills || []), req.params.id]
    );
    res.json({ ...rows[0], skills: JSON.parse(rows[0].skills || '[]') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
