const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL manquant dans les variables d\'environnement');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Sans ce listener, une erreur réseau crash le process entier
pool.on('error', (err) => {
  console.error('Erreur pool DB:', err.message);
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      bio TEXT DEFAULT '',
      skills TEXT DEFAULT '[]',
      avatar_color TEXT DEFAULT '#8b5cf6',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      code_language TEXT DEFAULT '',
      resource_url TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS likes (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      post_id INTEGER,
      read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content   TEXT DEFAULT '',
      file_url  TEXT DEFAULT '',
      file_type TEXT DEFAULT '',
      file_name TEXT DEFAULT '',
      read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Migrations colonnes manquantes
  await pool.query(`
    ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id) ON DELETE SET NULL;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS file_url  TEXT DEFAULT '';
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT '';
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT '';
  `);
  console.log('✅ Base de données prête');
}

initDB().catch(err => {
  console.error('❌ Impossible de connecter à la base de données:', err.message);
  process.exit(1);
});

module.exports = pool;
