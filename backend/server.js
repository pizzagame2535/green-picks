require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // จำกัดขนาดไฟล์ 5MB
  },
});



const Game = require('./models/Game');
const FootballTip = require('./models/FootballTip');
const LotteryItem = require('./models/LotteryItem');

const app = express();
app.use(cors());
app.use(express.json());

// อัปโหลดรูปไป Cloudinary
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'ไม่พบไฟล์ที่อัปโหลด' });
    }

    // แปลง buffer → data URI ให้ Cloudinary ใช้
    const fileStr =
      'data:' +
      req.file.mimetype +
      ';base64,' +
      req.file.buffer.toString('base64');

    const result = await cloudinary.uploader.upload(fileStr, {
      folder: 'green-picks', // ตั้งชื่อโฟลเดอร์ใน Cloudinary ตามใจคุณ
    });

    return res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Upload error:', err);
    return res
      .status(500)
      .json({ message: 'อัปโหลดรูปไม่สำเร็จ', error: err.message });
  }
});


const PORT = process.env.PORT || 4000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// ---------- connect MongoDB ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ---------- admin middleware ----------
function checkAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// ================= PUBLIC API =================

// เกมแตกดี
app.get('/api/games', async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 }).limit(5);
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ทีเด็ดบอล
app.post('/api/football-tips', async (req, res) => {
  try {
    const { confidence, imageUrl } = req.body;
    const tip = new FootballTip({ confidence, imageUrl });
    await tip.save();
    res.json(tip);
  } catch (err) {
    console.error('create football tip error', err);
    res.status(500).json({ error: 'Failed to create football tip' });
  }
});


// เลขเด็ด
app.get('/api/lottery', async (req, res) => {
  try {
    const items = await LotteryItem.find().sort({ createdAt: -1 }).limit(5);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================= ADMIN API =================

// -------- GAMes ----------
app.get('/api/admin/games', checkAdmin, async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/games', checkAdmin, async (req, res) => {
  try {
    const { name, imageUrl, winRate } = req.body;
    const game = await Game.create({ name, imageUrl, winRate });
    res.json(game);
  } catch (err) {
    res.status(400).json({ message: 'Bad request', error: err.message });
  }
});

app.put('/api/admin/games/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, imageUrl, winRate } = req.body;
    const game = await Game.findByIdAndUpdate(
      id,
      { name, imageUrl, winRate },
      { new: true }
    );
    res.json(game);
  } catch (err) {
    res.status(400).json({ message: 'Bad request', error: err.message });
  }
});

app.delete('/api/admin/games/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Game.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Bad request', error: err.message });
  }
});

// -------- FOOTBALL ----------
app.get('/api/admin/football', checkAdmin, async (req, res) => {
  try {
    const tips = await FootballTip.find().sort({ createdAt: -1 });
    res.json(tips);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/football', checkAdmin, async (req, res) => {
  try {
    const { league, matchTime, homeTeam, awayTeam, pick, confidence } = req.body;
    const tip = await FootballTip.create({
      league,
      matchTime,
      homeTeam,
      awayTeam,
      pick,
      confidence
    });
    res.json(tip);
  } catch (err) {
    res.status(400).json({ message: 'Bad request', error: err.message });
  }
});

app.put('/api/admin/football/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { league, matchTime, homeTeam, awayTeam, pick, confidence } = req.body;
    const tip = await FootballTip.findByIdAndUpdate(
      id,
      { league, matchTime, homeTeam, awayTeam, pick, confidence },
      { new: true }
    );
    res.json(tip);
  } catch (err) {
    res.status(400).json({ message: 'Bad request', error: err.message });
  }
});

app.delete('/api/admin/football/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await FootballTip.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Bad request', error: err.message });
  }
});

// -------- LOTTERY ----------
app.get('/api/admin/lottery', checkAdmin, async (req, res) => {
  try {
    const items = await LotteryItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/lottery', checkAdmin, async (req, res) => {
  try {
    const { type, imageUrl, caption } = req.body;
    const item = await LotteryItem.create({ type, imageUrl, caption });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: 'Bad request', error: err.message });
  }
});

app.put('/api/admin/lottery/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, imageUrl, caption } = req.body;
    const item = await LotteryItem.findByIdAndUpdate(
      id,
      { type, imageUrl, caption },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: 'Bad request', error: err.message });
  }
});

app.delete('/api/admin/lottery/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await LotteryItem.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Bad request', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
