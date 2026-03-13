import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(process.env.DATABASE_URL || "database.sqlite");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    full_name TEXT,
    password TEXT,
    role TEXT DEFAULT 'user',
    strikes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    image_url TEXT,
    location TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    content TEXT,
    is_flagged BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    violation_id TEXT,
    content TEXT,
    confidence REAL,
    action_taken TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Seed initial data
  INSERT OR IGNORE INTO users (id, username, email, full_name, password, role, strikes, status) 
  VALUES (1, 'alex_safe', 'alex@example.com', 'Alex Johnson', 'password', 'user', 1, 'active');
  
  INSERT OR IGNORE INTO users (id, username, email, full_name, password, role, strikes, status) 
  VALUES (2, 'nature_lover', 'nature@example.com', 'Sarah Green', 'password', 'user', 0, 'active');

  INSERT OR IGNORE INTO users (id, username, email, full_name, password, role, strikes, status) 
  VALUES (3, 'admin', 'admin@safespace.com', 'SafeSpace Admin', 'admin123', 'admin', 0, 'active');

  INSERT OR IGNORE INTO posts (id, user_id, content, image_url, location, likes_count, comments_count)
  VALUES (1, 2, 'Sunny afternoon at the park! Finding peace in the middle of the city. 🌿✨', 'https://picsum.photos/seed/nature/800/800', 'San Francisco, CA', 1200, 45);

  INSERT OR IGNORE INTO posts (id, user_id, content, image_url, location, likes_count, comments_count)
  VALUES (2, 1, 'The future of AI in content moderation. How machine learning helps maintain healthy community standards.', 'https://picsum.photos/seed/ai/800/450', 'Tech Hub', 842, 12);

  INSERT OR IGNORE INTO violations (user_id, violation_id, content, confidence, action_taken, type)
  VALUES (1, '#MOD-9821', 'I hope your system crashes and you lose everything, you absolute waste of space.', 0.984, '24-hour Suspension', 'Strike Recorded');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock Auth for demo purposes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user) {
      res.json({ user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/register", (req, res) => {
    const { full_name, email, username, password } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (full_name, email, username, password) VALUES (?, ?, ?, ?)").run(full_name, email, username, password);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
      res.json({ user });
    } catch (e) {
      res.status(400).json({ error: "User already exists" });
    }
  });

  app.get("/api/posts", (req, res) => {
    const posts = db.prepare(`
      SELECT posts.*, users.username, users.full_name 
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      ORDER BY created_at DESC
    `).all();
    res.json(posts);
  });

  app.get("/api/users/:userId/strikes", (req, res) => {
    const violations = db.prepare("SELECT * FROM violations WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
    res.json(violations);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
