const express = require('express');
const db   = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Nombre de messages non lus
router.get('/unread', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT COUNT(*)::int as count FROM messages WHERE to_user_id=$1 AND read=0',
      [req.user.id]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste des conversations (dernier message par utilisateur)
router.get('/conversations', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `WITH ranked AS (
         SELECT m.*,
                CASE WHEN m.from_user_id=$1 THEN m.to_user_id ELSE m.from_user_id END AS other_id,
                ROW_NUMBER() OVER (
                  PARTITION BY CASE WHEN m.from_user_id=$1 THEN m.to_user_id ELSE m.from_user_id END
                  ORDER BY m.created_at DESC
                ) AS rn
         FROM messages m
         WHERE m.from_user_id=$1 OR m.to_user_id=$1
       )
       SELECT r.id, r.from_user_id, r.to_user_id, r.content, r.file_name,
              r.file_type, r.created_at, r.other_id,
              u.name AS other_name, u.avatar_color AS other_color,
              (SELECT COUNT(*)::int FROM messages
               WHERE to_user_id=$1 AND from_user_id=r.other_id AND read=0) AS unread_count
       FROM ranked r
       JOIN users u ON u.id = r.other_id
       WHERE r.rn = 1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Messages avec un utilisateur précis
router.get('/:userId', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*, u.name AS from_name, u.avatar_color AS from_color
       FROM messages m
       JOIN users u ON u.id = m.from_user_id
       WHERE (m.from_user_id=$1 AND m.to_user_id=$2)
          OR (m.from_user_id=$2 AND m.to_user_id=$1)
       ORDER BY m.created_at ASC`,
      [req.user.id, req.params.userId]
    );

    // Marquer comme lus
    await db.query(
      'UPDATE messages SET read=1 WHERE from_user_id=$1 AND to_user_id=$2 AND read=0',
      [req.params.userId, req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Envoyer un message
router.post('/:userId', auth, async (req, res) => {
  try {
    const { content, file_url, file_type, file_name } = req.body;
    if (!content?.trim() && !file_url) return res.status(400).json({ error: 'Message vide' });

    const { rows } = await db.query(
      `INSERT INTO messages (from_user_id, to_user_id, content, file_url, file_type, file_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, req.params.userId, content?.trim() || '', file_url || '', file_type || '', file_name || '']
    );

    const msg = { ...rows[0], from_name: req.user.name };
    const io = req.app.get('io');
    if (io) io.to(`user_${req.params.userId}`).emit('new_message', msg);

    res.json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
