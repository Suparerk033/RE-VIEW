require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require("bcryptjs");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const reviewRoutes = require('./routes/review.routes');

const app = express();
const port = process.env.PORT || 5000;

// 📁 Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// 🔐 Rate limiters
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: 'คุณพยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง' },
});
const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { message: 'คุณสมัครสมาชิกหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง' },
});

// 🌐 Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// 🛢️ PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// 🔑 Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/auth/google/callback'
}, async (token, tokenSecret, profile, done) => {
  const { id: googleId, displayName, emails } = profile;
  const email = emails[0].value;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];

      if (!user.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1, login_method = $2 WHERE email = $3',
          [googleId, 'google', email]
        );
      }

      const updatedUser = await pool.query(`
        SELECT u.*, r.role_name FROM users u
        LEFT JOIN roles r ON u.role_id = r.role_id
        WHERE u.email = $1
      `, [email]);

      return done(null, updatedUser.rows[0]);
    }

    const defaultRoleId = email === 's6602041520250@email.kmutnb.ac.th' ? 1 : 3;

    const newUser = await pool.query(`
      INSERT INTO users (google_id, name, email, role_id, login_method)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [googleId, displayName, email, defaultRoleId, 'google']);

    const fullUser = await pool.query(`
      SELECT u.*, r.role_name FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = $1
    `, [newUser.rows[0].user_id]);

    return done(null, fullUser.rows[0]);
  } catch (err) {
    console.error('Google Login Error:', err);
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await pool.query(`
      SELECT u.*, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = $1
    `, [id]);

    done(null, user.rows[0]);
  } catch (error) {
    console.error('Deserialize Error:', error);
    done(error, null);
  }
});

// 🔐 Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect('http://localhost:3000/')
);

app.get('/api/me', (req, res) => {
  if (req.isAuthenticated()) res.json({ user: req.user });
  else res.status(401).json({ message: 'Unauthorized' });
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// 🔐 Middleware ตรวจ role
const ensureRole = (roleName) => async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
  if (req.user.role_name.toLowerCase() === roleName.toLowerCase()) return next();
  res.status(403).send('Forbidden');
};

// ✅ Register
app.post('/api/register', registerLimiter, async (req, res) => {
  const { name, email, password, role_id = 3 } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'กรอกข้อมูลให้ครบ' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
  }

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'อีเมลนี้มีในระบบแล้ว' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(`
      INSERT INTO users (name, email, password, role_id, login_method)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [name, email.toLowerCase(), hashedPassword, role_id, 'local']);

    res.json({ message: '✅ เพิ่มผู้ใช้สำเร็จ', user: newUser.rows[0] });

  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ server' });
  }
});

// ✅ Login
app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1 AND login_method = $2', [email, 'local']);
    if (userResult.rows.length === 0) return res.status(400).json({ message: 'ไม่พบผู้ใช้งานนี้' });

    const user = userResult.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

    const fullUser = await pool.query(`
      SELECT u.*, r.role_name FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = $1
    `, [user.user_id]);

    req.login(fullUser.rows[0], (err) => {
      if (err) return res.status(500).json({ message: 'เข้าสู่ระบบล้มเหลว' });
      res.json({ message: 'เข้าสู่ระบบสำเร็จ', user: fullUser.rows[0] });
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// ✅ Get all users (Admin only)
app.get('/api/users', ensureRole('admin'), async (req, res) => {
  const users = await pool.query(`
    SELECT u.user_id, u.name, u.email, u.login_method, u.profile_pic, u.role_id, r.role_name
    FROM users u LEFT JOIN roles r ON u.role_id = r.role_id
  `);
  res.json(users.rows);
});

// ✅ Update user info (name, role_id, profile_pic)
app.put('/api/users/:id', upload.single('profile_pic'), async (req, res) => {
  const userId = req.params.id;
  const { name, role_id } = req.body;
  const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !role_id) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อและสิทธิ์ผู้ใช้' });
  }

  try {
    const query = profilePic
      ? 'UPDATE users SET name = $1, profile_pic = $2, role_id = $3 WHERE user_id = $4'
      : 'UPDATE users SET name = $1, role_id = $2 WHERE user_id = $3';

    const values = profilePic
      ? [name, profilePic, role_id, userId]
      : [name, role_id, userId];

    await pool.query(query, values);
    res.json({ message: '✅ อัปเดตข้อมูลผู้ใช้สำเร็จ', profilePic });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(500).json({ message: '❌ อัปเดตผู้ใช้ไม่สำเร็จ' });
  }
});

// ✅ Delete user (Admin only)
app.delete('/api/users/:id', ensureRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ต้องการลบ' });
    res.json({ message: '✅ ลบผู้ใช้สำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: '❌ ลบผู้ใช้ไม่สำเร็จ' });
  }
});

// ✅ Reset Password
app.post('/api/reset-password', async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
  }

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND login_method = $2',
      [email.toLowerCase(), 'local']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้นี้' });
    }

    const user = userResult.rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1 WHERE user_id = $2',
      [hashedNew, user.user_id]
    );

    res.json({ message: '✅ เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ server' });
  }
});
// ✅ Dashboard Stats API (Admin & staff)
app.get('/api/stats', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });

  const role = req.user.role_name?.toLowerCase();
  if (!['admin', 'staff'].includes(role)) return res.status(403).json({ message: 'Forbidden' });

  try {
    const [reviewCount, userCount, recentReviews] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM reviews'),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query(`
        SELECT r.review_id, r.title, r.created_at, u.name
        FROM reviews r
        JOIN users u ON r.user_id = u.user_id
        ORDER BY r.created_at DESC
        LIMIT 5
      `)
    ]);

    res.json({
      totalReviews: Number(reviewCount.rows[0].count),
      totalUsers: Number(userCount.rows[0].count),
      recentReviews: recentReviews.rows,
    });
  } catch (err) {
    console.error('❌ Error fetching stats:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่ server' });
  }
});

// ✨ รีวิวสินค้า
app.use('/api/reviews', reviewRoutes);

// 🚀 Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
