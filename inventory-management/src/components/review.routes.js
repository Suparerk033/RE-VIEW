const upload = require('../middleware/upload');

// เพิ่ม endpoint อัปโหลดภาพ
router.post('/upload', upload.array('images', 5), async (req, res) => {
  const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
  res.json({ images: imagePaths });
});
