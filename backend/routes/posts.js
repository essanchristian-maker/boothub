const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { tag } = req.query;
    const { rows } = await db.query(
      `SELECT p.*, u.name as user_name, u.avatar_color,
              CASE WHEN l.user_id IS NOT NULL THEN 1 ELSE 0 END as liked_by_me
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    let result = rows.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]') }));
    if (tag) result = result.filter(p => p.tags.includes(tag));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { content, type, code_language, resource_url, tags } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Le contenu est requis' });

    const { rows } = await db.query(
      `INSERT INTO posts (user_id, content, type, code_language, resource_url, tags)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [req.user.id, content.trim(), type || 'text', code_language || '', resource_url || '', JSON.stringify(tags || [])]
    );

    const { rows: postRows } = await db.query(
      `SELECT p.*, u.name as user_name, u.avatar_color FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = $1`,
      [rows[0].id]
    );
    const newPost = { ...postRows[0], tags: JSON.parse(postRows[0].tags || '[]'), liked_by_me: 0 };

    const io = req.app.get('io');
    if (io) io.emit('new_post', newPost);
    res.json(newPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Post introuvable' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

    await db.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    const io = req.app.get('io');
    if (io) io.emit('delete_post', { id: parseInt(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.user.id;
  try {
    const { rows: ex } = await db.query('SELECT 1 FROM likes WHERE user_id=$1 AND post_id=$2', [userId, postId]);
    if (ex.length) {
      await db.query('DELETE FROM likes WHERE user_id=$1 AND post_id=$2', [userId, postId]);
      await db.query('UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id=$1', [postId]);
      return res.json({ liked: false });
    }

    await db.query('INSERT INTO likes (user_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, postId]);
    await db.query('UPDATE posts SET likes_count = likes_count + 1 WHERE id=$1', [postId]);

    const { rows: p } = await db.query('SELECT user_id FROM posts WHERE id=$1', [postId]);
    if (p.length && p[0].user_id !== userId) {
      await db.query(
        'INSERT INTO notifications (user_id, from_user_id, type, post_id) VALUES ($1,$2,$3,$4)',
        [p[0].user_id, userId, 'like', postId]
      );
      const io = req.app.get('io');
      if (io) io.to(`user_${p[0].user_id}`).emit('notification', { type: 'like' });
    }
    res.json({ liked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id/comments', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, u.name as user_name, u.avatar_color,
              pu.name as parent_user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN comments pc ON c.parent_id = pc.id
       LEFT JOIN users pu ON pc.user_id = pu.id
       WHERE c.post_id = $1
       ORDER BY COALESCE(c.parent_id, c.id), c.created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content, parent_id } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Commentaire vide' });

    const { rows } = await db.query(
      'INSERT INTO comments (post_id, user_id, content, parent_id) VALUES ($1,$2,$3,$4) RETURNING id',
      [req.params.id, req.user.id, content.trim(), parent_id || null]
    );
    await db.query('UPDATE posts SET comments_count = comments_count + 1 WHERE id=$1', [req.params.id]);

    const { rows: cRows } = await db.query(
      `SELECT c.*, u.name as user_name, u.avatar_color,
              pu.name as parent_user_name
       FROM comments c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN comments pc ON c.parent_id = pc.id
       LEFT JOIN users pu ON pc.user_id = pu.id
       WHERE c.id = $1`,
      [rows[0].id]
    );

    const comment = cRows[0];
    const io = req.app.get('io');

    // Notifie l'auteur du post
    const { rows: p } = await db.query('SELECT user_id FROM posts WHERE id=$1', [req.params.id]);
    if (p.length && p[0].user_id !== req.user.id) {
      await db.query(
        'INSERT INTO notifications (user_id, from_user_id, type, post_id) VALUES ($1,$2,$3,$4)',
        [p[0].user_id, req.user.id, 'comment', req.params.id]
      );
      if (io) io.to(`user_${p[0].user_id}`).emit('notification', { type: 'comment' });
    }

    // Notifie aussi l'auteur du commentaire parent (si c'est une réponse et pas soi-même)
    if (parent_id) {
      const { rows: parentRows } = await db.query('SELECT user_id FROM comments WHERE id=$1', [parent_id]);
      if (parentRows.length && parentRows[0].user_id !== req.user.id && parentRows[0].user_id !== p[0]?.user_id) {
        await db.query(
          'INSERT INTO notifications (user_id, from_user_id, type, post_id) VALUES ($1,$2,$3,$4)',
          [parentRows[0].user_id, req.user.id, 'reply', req.params.id]
        );
        if (io) io.to(`user_${parentRows[0].user_id}`).emit('notification', { type: 'reply' });
      }
    }

    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
