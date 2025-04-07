const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const upload = require('../uploads/upload');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

// ✅ สร้างรีวิวใหม่ พร้อมอัปโหลดรูป
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });

    const { title, content, rating } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      'INSERT INTO reviews (user_id, title, content, rating, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, title, content, rating, imagePath]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("🔥 Review Insert Error:", err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะบันทึกรีวิว' });
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

// ✅ ดึงคอมเมนต์ของรีวิว
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

// ✅ แก้ไขรีวิว (เจ้าของโพสต์, Admin, หรือ staff)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.user_id;
    const userRole = req.user?.role_name?.toLowerCase();

    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });

    const { title, content, rating } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const reviewRes = await pool.query('SELECT * FROM reviews WHERE review_id = $1', [reviewId]);

    if (reviewRes.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบรีวิวนี้' });
    }

    const review = reviewRes.rows[0];

    // ✅ อนุญาตเฉพาะเจ้าของโพสต์, admin หรือ staff
    if (review.user_id !== userId && userRole !== 'admin' && userRole !== 'staff') {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขรีวิวนี้' });
    }

    let query = 'UPDATE reviews SET title = $1, content = $2, rating = $3';
    const values = [title, content, Number(rating)];

    if (imagePath) {
      query += ', image_url = $4 WHERE review_id = $5';
      values.push(imagePath, reviewId);
    } else {
      query += ' WHERE review_id = $4';
      values.push(reviewId);
    }

    await pool.query(query, values);
    res.json({ message: '✅ แก้ไขรีวิวสำเร็จ' });
  } catch (err) {
    console.error('🔥 Review Update Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะอัปเดตรีวิว' });
  }
});

// ✅ ลบรีวิว (เจ้าของโพสต์, Admin หรือ staff)
router.delete('/:id', async (req, res) => {
  const reviewId = req.params.id;
  const userId = req.user?.user_id;
  const userRole = req.user?.role_name?.toLowerCase();

  if (!userId) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
  }

  try {
    const result = await pool.query('SELECT * FROM reviews WHERE review_id = $1', [reviewId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบโพสต์นี้' });
    }

    const review = result.rows[0];

    // ✅ อนุญาตเฉพาะเจ้าของโพสต์, admin หรือ staff
    if (review.user_id !== userId && userRole !== 'admin' && userRole !== 'staff') {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' });
    }

    await pool.query('DELETE FROM review_likes WHERE review_id = $1', [reviewId]);
    await pool.query('DELETE FROM comments WHERE review_id = $1', [reviewId]);
    await pool.query('DELETE FROM reviews WHERE review_id = $1', [reviewId]);

    res.json({ message: '✅ ลบโพสต์สำเร็จ' });
  } catch (err) {
    console.error('❌ Delete Review Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะลบโพสต์' });
  }
});

// ✅ อัปโหลดภาพโดยตรง (ใช้ในกรณีต้องการแยก endpoint สำหรับการอัปโหลดหลายไฟล์)
router.post('/upload', upload.array('images', 5), async (req, res) => {
  const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
  res.json({ images: imagePaths });
});

module.exports = router;
