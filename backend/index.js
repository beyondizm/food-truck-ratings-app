const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

function computeStats(reviews) {
  const thresholds = [20, 50, 100, 200, 500];
  const map = {};
  for (const r of reviews) {
    if (!map[r.truck]) {
      map[r.truck] = { score: 0 };
    }
    if (r.rating === 10) {
      map[r.truck].score += 1;
    } else if (r.rating === 1) {
      map[r.truck].score -= 0.5;
    }
  }

  for (const name of Object.keys(map)) {
    let score = map[name].score;
    if (score < 0) score = 0;
    let stars = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (score >= thresholds[i]) {
        stars = i + 1;
      } else {
        break;
      }
    }
    if (stars >= 5) {
      map[name] = { stars: 5, progress: 1 };
    } else {
      const base = stars === 0 ? 0 : thresholds[stars - 1];
      const next = thresholds[stars];
      const progress = (score - base) / (next - base);
      map[name] = { stars, progress: Number(progress.toFixed(2)) };
    }
  }
  return map;
}

app.use(express.json());

const reviews = [];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/reviews', upload.single('photo'), (req, res) => {
  const { rating, comment, truck } = req.body;
  const parsed = parseInt(rating, 10);

  if (!req.file || !comment || !truck || isNaN(parsed) || parsed < 1 || parsed > 10) {
    return res.status(400).json({ error: 'Invalid review' });
  }

  const review = {
    id: reviews.length + 1,
    rating: parsed,
    comment,
    truck,
    photo: req.file.filename
  };

  reviews.push(review);
  res.status(201).json(review);
});

app.get('/api/reviews', (req, res) => {
  res.json({
    reviews,
    trucks: computeStats(reviews)
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
