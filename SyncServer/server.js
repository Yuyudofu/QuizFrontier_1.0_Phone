require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || 'development-only-change-me';
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'quiz_forge',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'quiz_forge',
  waitForConnections: true,
  connectionLimit: 5,
  charset: 'utf8mb4'
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.WEB_ORIGIN ? process.env.WEB_ORIGIN.split(',').map(x => x.trim()) : true }));
app.use(express.json({ limit: '4mb' }));

const cleanEmail = (email) => String(email || '').trim().toLowerCase();
const tokenFor = (user) => jwt.sign({ sub: String(user.id), email: user.email, displayName: user.display_name }, jwtSecret, { expiresIn: '30d' });
const initialData = () => ({ decks: [], questions: [], history: [], settings: { theme: 'cute', defaultMode: 'button', defaultCount: '10', defaultSpeed: 38, animations: true } });

function auth(req, res, next) {
  const value = req.headers.authorization || '';
  const token = value.startsWith('Bearer ') ? value.slice(7) : '';
  try { req.user = jwt.verify(token, jwtSecret); next(); }
  catch { res.status(401).json({ error: 'ログインが必要です' }); }
}

async function documentFor(userId) {
  const [rows] = await pool.query('SELECT data, updated_at FROM quiz_documents WHERE user_id = ?', [userId]);
  if (!rows.length) return { data: initialData(), updatedAt: null };
  return { data: typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data, updatedAt: rows[0].updated_at };
}

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true }); }
  catch { res.status(503).json({ ok: false }); }
});

app.post('/api/auth/register', async (req, res) => {
  const email = cleanEmail(req.body.email), password = String(req.body.password || ''), displayName = String(req.body.displayName || email.split('@')[0]).trim().slice(0, 80);
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ error: 'メールアドレスと8文字以上のパスワードが必要です' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query('INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)', [email, hash, displayName || 'QUIZユーザー']);
    await pool.query('INSERT INTO quiz_documents (user_id, data) VALUES (?, ?)', [result.insertId, JSON.stringify(initialData())]);
    const user = { id: result.insertId, email, display_name: displayName || 'QUIZユーザー' };
    res.status(201).json({ token: tokenFor(user), user });
  } catch (error) { res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ error: error.code === 'ER_DUP_ENTRY' ? 'そのメールアドレスは登録済みです' : '登録に失敗しました' }); }
});

app.post('/api/auth/login', async (req, res) => {
  const email = cleanEmail(req.body.email), password = String(req.body.password || '');
  const [rows] = await pool.query('SELECT id, email, display_name, password_hash FROM users WHERE email = ?', [email]);
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) return res.status(401).json({ error: 'メールアドレスまたはパスワードが違います' });
  const user = rows[0];
  res.json({ token: tokenFor(user), user: { id: user.id, email: user.email, display_name: user.display_name } });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT id, email, display_name FROM users WHERE id = ?', [req.user.sub]);
  if (!rows.length) return res.status(404).json({ error: 'ユーザーが見つかりません' });
  res.json({ user: rows[0] });
});

app.get('/api/data', auth, async (req, res) => { res.json(await documentFor(req.user.sub)); });

app.put('/api/data', auth, async (req, res) => {
  const data = req.body?.data;
  if (!data || !Array.isArray(data.decks) || !Array.isArray(data.questions) || !Array.isArray(data.history)) return res.status(400).json({ error: 'クイズデータの形式が不正です' });
  if (JSON.stringify(data).length > 3900000) return res.status(413).json({ error: 'データが大きすぎます' });
  await pool.query('INSERT INTO quiz_documents (user_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)', [req.user.sub, JSON.stringify(data)]);
  res.json(await documentFor(req.user.sub));
});

app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.get('/', (_req, res) => res.redirect('/admin/'));

app.listen(port, () => console.log(`QUIZ FORGE sync server: http://localhost:${port}`));
