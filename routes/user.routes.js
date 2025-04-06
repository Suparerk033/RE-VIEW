const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ✅ Multer config: จำกัดไฟล์รูปและขนาด
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('ไฟล์ต้องเป็น JPG, PNG หรือ WEBP เท่านั้น'));
    }
  }
});

// ✅ ดึงรีวิวทั้งหมด
router.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT r.*, u.name, u.profile_pic,
           (SELECT COUNT(*) FROM review_likes WHERE review_id = r.review_id) AS likes,
           (SELECT COUNT(*) FROM comments WHERE review_id = r.review_id) AS comments
    FROM reviews r
    JOIN users u ON r.user_id = u.user_id
    ORDER BY r.created_at DESC
  `);
  res.json(result.rows);
});

// ✅ สร้างรีวิวใหม่ พร้อมรูป
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'ไฟล์ใหญ่เกิน 2MB' });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, content, rating } = req.body;
    const ratingNum = Number(rating); // ⭐ แปลงเป็นตัวเลข
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // ตรวจสอบ session
    if (!req.user || !req.user.user_id) {
      console.log("❌ ไม่พบ session หรือ req.user");
      return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนโพสต์รีวิว' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, title, content, rating, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.user_id, title, content, ratingNum, imagePath]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Review Insert Error:", err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะบันทึกรีวิว' });
  }
});

// ✅ อัปเดตรีวิว
router.put('/:id', (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'ไฟล์ใหญ่เกิน 2MB' });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  const reviewId = req.params.id;
  const { title, content, rating } = req.body;
  const ratingNum = Number(rating);
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const existing = await pool.query('SELECT * FROM reviews WHERE review_id = $1', [reviewId]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'ไม่พบรีวิว' });

    let query = 'UPDATE reviews SET title = $1, content = $2, rating = $3';
    const values = [title, content, ratingNum];

    if (imagePath) {
      query += ', image_url = $4 WHERE review_id = $5';
      values.push(imagePath, reviewId);
    } else {
      query += ' WHERE review_id = $4';
      values.push(reviewId);
    }

    await pool.query(query, values);
    res.json({ message: 'อัปเดตรีวิวสำเร็จ' });
  } catch (err) {
    console.error('Review Update Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// ✅ กด Like รีวิว
router.post('/:id/like', async (req, res) => {
  const userId = req.user?.user_id;
  const reviewId = req.params.id;
  if (!userId) return res.status(401).send('Unauthorized');

  await pool.query(
    'INSERT INTO review_likes (review_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [reviewId, userId]
  );
  res.json({ message: 'Liked' });
});

// ✅ คอมเมนต์
router.post('/:id/comment', async (req, res) => {
  const userId = req.user?.user_id;
  const reviewId = req.params.id;
  const { content } = req.body;
  if (!userId) return res.status(401).send('Unauthorized');

  const result = await pool.query(
    'INSERT INTO comments (review_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
    [reviewId, userId, content]
  );
  res.json(result.rows[0]);
});

// ✅ ดึงคอมเมนต์
router.get('/:id/comments', async (req, res) => {
  const reviewId = req.params.id;
  const result = await pool.query(`
    SELECT c.*, u.name, u.profile_pic
    FROM comments c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.review_id = $1
    ORDER BY c.created_at ASC
  `, [reviewId]);
  res.json(result.rows);
});

// routes/user.routes.js
router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});
module.exports = router;
