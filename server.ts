import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import crypto from "crypto";
import { spawn } from "child_process";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(process.env.DATABASE_URL || "database.sqlite");

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// ─── Helper: Hash password ──────────────────────────────────────────────────
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// ─── Helper: Call ML API ────────────────────────────────────────────────────
const ML_API_URL = process.env.ML_API_URL || "http://localhost:5000";

async function analyzeText(text: string) {
  try {
    const res = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("ML API error");
    return await res.json();
  } catch (err) {
    console.error("ML API unavailable:", err);
    throw new Error("Cyberbullying detection service is currently unavailable. Please try again later.");
  }
}

// ─── Initialize Database ────────────────────────────────────────────────────
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
    blocked_until DATETIME,
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
    confidence REAL DEFAULT 0,
    bullying_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id),
    FOREIGN KEY(post_id) REFERENCES posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    comment_id INTEGER,
    content TEXT,
    confidence REAL,
    action_taken TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// ─── Seed Initial Data ──────────────────────────────────────────────────────
const seedAdmin = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!seedAdmin) {
  db.prepare(
    "INSERT INTO users (username, email, full_name, password, role, strikes, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run("admin", "admin@safespace.com", "SafeSpace Admin", hashPassword("admin123"), "admin", 0, "active");
}
const seedUser1 = db.prepare("SELECT id FROM users WHERE username = 'alex_safe'").get();
if (!seedUser1) {
  db.prepare(
    "INSERT INTO users (username, email, full_name, password, role, strikes, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run("alex_safe", "alex@example.com", "Alex Johnson", hashPassword("password"), "user", 1, "active");
}
const seedUser2 = db.prepare("SELECT id FROM users WHERE username = 'nature_lover'").get();
if (!seedUser2) {
  db.prepare(
    "INSERT INTO users (username, email, full_name, password, role, strikes, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run("nature_lover", "nature@example.com", "Sarah Green", hashPassword("password"), "user", 0, "active");
}

// Seed posts
const postCount = (db.prepare("SELECT COUNT(*) as count FROM posts").get() as any).count;
if (postCount === 0) {
  const user2 = db.prepare("SELECT id FROM users WHERE username = 'nature_lover'").get() as any;
  const user1 = db.prepare("SELECT id FROM users WHERE username = 'alex_safe'").get() as any;
  if (user2) {
    db.prepare(
      "INSERT INTO posts (user_id, content, image_url, location, likes_count, comments_count) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(user2.id, "Sunny afternoon at the park! Finding peace in the middle of the city. 🌿✨", "https://picsum.photos/seed/nature/800/800", "San Francisco, CA", 1200, 45);
  }
  if (user1) {
    db.prepare(
      "INSERT INTO posts (user_id, content, image_url, location, likes_count, comments_count) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(user1.id, "The future of AI in content moderation. How machine learning helps maintain healthy community standards.", "https://picsum.photos/seed/ai/800/450", "Tech Hub", 842, 12);
  }
}

// ─── Moderation Logic ───────────────────────────────────────────────────────
function handleModeration(userId: number): { action: string; blocked: boolean } {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!user) return { action: "User not found", blocked: false };

  const newStrikes = user.strikes + 1;
  let action = "";
  let blocked = false;
  let blockedUntil: string | null = null;
  let newStatus = 'active';

  if (newStrikes === 1) {
    action = "this content is cyberbullying warning";
  } else if (newStrikes === 2) {
    action = "10-minute block";
    blocked = true;
    blockedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    newStatus = "restricted";
  } else {
    action = "Permanent block";
    blocked = true;
    blockedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    newStatus = "banned";
  }

  // Update user
  if (blockedUntil) {
    db.prepare("UPDATE users SET strikes = ?, status = ?, blocked_until = ? WHERE id = ?").run(
      newStrikes, newStatus, blockedUntil, userId
    );
  } else {
    db.prepare("UPDATE users SET strikes = ? WHERE id = ?").run(newStrikes, userId);
  }

  return { action, blocked };
}

function isUserBlocked(userId: number): { blocked: boolean; message: string } {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
  if (!user) return { blocked: true, message: "User not found" };

  if (user.status === "banned") {
    return { blocked: true, message: "Your account has been permanently banned." };
  }

  if (user.blocked_until) {
    const blockedUntil = new Date(user.blocked_until);
    if (blockedUntil > new Date()) {
      const mins = Math.ceil((blockedUntil.getTime() - Date.now()) / 60000);
      return {
        blocked: true,
        message: `Your account is temporarily blocked. Try again in ${mins > 60 ? Math.ceil(mins / 60) + " hours" : mins + " minutes"}.`,
      };
    } else {
      // Unblock the user (block expired)
      db.prepare("UPDATE users SET status = 'active', blocked_until = NULL WHERE id = ?").run(userId);
    }
  }

  return { blocked: false, message: "" };
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVER SETUP
// ═══════════════════════════════════════════════════════════════════════════
async function startServer() {
  const app = express();
  const PORT = 3000;

  // ─── Start ML API ──────────────────────────────────────────────────────
  const mlProcess = spawn("python", ["ml/api.py"], { stdio: "inherit" });
  mlProcess.on("error", (err) => {
    console.error("Failed to start ML API:", err);
  });
  mlProcess.on("close", (code) => {
    console.warn(`ML API stopped with code ${code}`);
  });

  // Ensure mlProcess is killed when node exits
  process.on("exit", () => mlProcess.kill());
  process.on("SIGINT", () => { mlProcess.kill(); process.exit(); });
  process.on("SIGTERM", () => { mlProcess.kill(); process.exit(); });

  app.use(express.json({ limit: "10mb" }));

  // ─── Health Check ──────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", database: "connected" });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // AUTH ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const identifier = email.trim().toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?").get(identifier, identifier) as any;
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password (support both hashed and plain for legacy)
    const hashedPw = hashPassword(password);
    if (user.password !== hashedPw && user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if blocked
    const blockStatus = isUserBlocked(user.id);
    if (blockStatus.blocked) {
      return res.status(403).json({ error: blockStatus.message });
    }

    // Don't send password back
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.post("/api/register", (req, res) => {
    const { full_name, email, username, password } = req.body;
    if (!full_name || !email || !username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const hashedPw = hashPassword(password);
      const info = db
        .prepare("INSERT INTO users (full_name, email, username, password) VALUES (?, ?, ?, ?)")
        .run(full_name, email, username, hashedPw);
      const user = db.prepare("SELECT id, username, email, full_name, role, strikes, status, joined_at FROM users WHERE id = ?").get(info.lastInsertRowid);
      res.json({ user });
    } catch (e: any) {
      if (e.message?.includes("UNIQUE")) {
        res.status(400).json({ error: "Username or email already exists" });
      } else {
        res.status(500).json({ error: "Registration failed" });
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // POST ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  app.get("/api/posts", (_req, res) => {
    const posts = db
      .prepare(
        `SELECT posts.*, users.username, users.full_name 
         FROM posts 
         JOIN users ON posts.user_id = users.id 
         ORDER BY posts.created_at DESC`
      )
      .all();
    res.json(posts);
  });

  app.post("/api/posts", (req, res) => {
    const { user_id, content, image_url, location } = req.body;
    if (!user_id || (!content && !image_url)) {
      return res.status(400).json({ error: "user_id and either content or an image are required" });
    }

    // Check if user is blocked
    const blockStatus = isUserBlocked(user_id);
    if (blockStatus.blocked) {
      return res.status(403).json({ error: blockStatus.message });
    }

    try {
      const info = db
        .prepare("INSERT INTO posts (user_id, content, image_url, location) VALUES (?, ?, ?, ?)")
        .run(user_id, content, image_url || `https://picsum.photos/seed/${Date.now()}/800/800`, location || "Global");

      const post = db
        .prepare(
          `SELECT posts.*, users.username, users.full_name 
           FROM posts 
           JOIN users ON posts.user_id = users.id 
           WHERE posts.id = ?`
        )
        .get(info.lastInsertRowid);

      res.json(post);
    } catch (e) {
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // ─── Like/Unlike Post ─────────────────────────────────────────────────
  app.post("/api/posts/:postId/like", (req, res) => {
    const { postId } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const existing = db.prepare("SELECT id FROM likes WHERE post_id = ? AND user_id = ?").get(postId, user_id);

    if (existing) {
      // Unlike
      db.prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?").run(postId, user_id);
      db.prepare("UPDATE posts SET likes_count = MAX(likes_count - 1, 0) WHERE id = ?").run(postId);
      res.json({ liked: false });
    } else {
      // Like
      db.prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)").run(postId, user_id);
      db.prepare("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?").run(postId);
      res.json({ liked: true });
    }
  });

  // ─── Delete Post ──────────────────────────────────────────────────────
  app.delete("/api/posts/:postId", (req, res) => {
    const { postId } = req.params;
    try {
      db.prepare("DELETE FROM comments WHERE post_id = ?").run(postId);
      db.prepare("DELETE FROM likes WHERE post_id = ?").run(postId);
      db.prepare("DELETE FROM posts WHERE id = ?").run(postId);
      res.json({ success: true, message: "Post deleted successfully" });
    } catch (err: any) {
      console.error("Delete post error:", err);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // COMMENT ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  app.get("/api/posts/:postId/comments", (req, res) => {
    const { postId } = req.params;
    const comments = db
      .prepare(
        `SELECT comments.*, users.username, users.full_name 
         FROM comments 
         JOIN users ON comments.user_id = users.id 
         WHERE comments.post_id = ? 
         ORDER BY comments.created_at DESC`
      )
      .all(postId);
    res.json(comments);
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    const { postId } = req.params;
    const { user_id, content } = req.body;

    if (!user_id || !content) {
      return res.status(400).json({ error: "user_id and content are required" });
    }

    // Check if user is blocked
    const blockStatus = isUserBlocked(user_id);
    if (blockStatus.blocked) {
      return res.status(403).json({ error: blockStatus.message });
    }

    try {
      // Analyze comment with ML model
      const analysis = await analyzeText(content);
      const isFlagged = analysis.is_cyberbullying;
      const confidence = analysis.confidence || 0;

      // ─── BLOCK harmful comments — do NOT save them ─────────────────
      if (isFlagged) {
        const moderationResult = handleModeration(user_id);

        // Record violation (but no comment saved)
        db.prepare(
          "INSERT INTO violations (user_id, content, confidence, action_taken, type) VALUES (?, ?, ?, ?, ?)"
        ).run(user_id, content, confidence, moderationResult.action, "cyberbullying");

        return res.status(400).json({
          blocked: true,
          error: "⚠️ This comment was blocked because it contains harmful or cyberbullying content. A strike has been added to your account.",
          moderation: moderationResult,
          analysis: { is_cyberbullying: true, confidence, prediction: analysis.prediction },
        });
      }

      // ─── Safe comment — insert normally ────────────────────────────
      const info = db
        .prepare(
          "INSERT INTO comments (post_id, user_id, content, is_flagged, confidence, bullying_type) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .run(postId, user_id, content, 0, confidence, analysis.prediction);

      // Update comment count
      db.prepare("UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?").run(postId);

      const comment = db
        .prepare(
          `SELECT comments.*, users.username, users.full_name 
           FROM comments 
           JOIN users ON comments.user_id = users.id 
           WHERE comments.id = ?`
        )
        .get(info.lastInsertRowid);

      res.json({
        comment,
        analysis: { is_cyberbullying: false, confidence, prediction: analysis.prediction },
        moderation: null,
      });
    } catch (e: any) {
      console.error("Comment error:", e);
      res.status(503).json({ error: e.message || "Failed to post comment" });
    }
  });

  // ─── Analyze Text (standalone, used by NewPost) ───────────────────────
  app.post("/api/comments/analyze", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    try {
      const analysis = await analyzeText(text);
      res.json({
        safe: !analysis.is_cyberbullying,
        is_cyberbullying: analysis.is_cyberbullying,
        confidence: analysis.confidence,
        prediction: analysis.prediction,
        reason: analysis.is_cyberbullying
          ? "This content may contain harmful or offensive language. Please revise your message."
          : "Content looks safe and positive! 🌟",
      });
    } catch (e: any) {
      res.status(503).json({ error: e.message || "ML API Unavailable" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // VIOLATION / STRIKE ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/violations", (req, res) => {
    const { user_id, type, content_preview } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const moderationResult = handleModeration(user_id);

    db.prepare(
      "INSERT INTO violations (user_id, content, confidence, action_taken, type) VALUES (?, ?, ?, ?, ?)"
    ).run(user_id, content_preview || "", 0.9, moderationResult.action, type || "harmful_content");

    res.json({ success: true, moderation: moderationResult });
  });

  app.get("/api/users/:userId/strikes", (req, res) => {
    const violations = db
      .prepare(
        `SELECT violations.*, users.username 
         FROM violations 
         JOIN users ON violations.user_id = users.id 
         WHERE violations.user_id = ? 
         ORDER BY violations.created_at DESC`
      )
      .all(req.params.userId);

    // Map to frontend expected format
    const mapped = violations.map((v: any) => ({
      id: v.id,
      user_id: v.user_id,
      type: v.type,
      content_preview: v.content,
      timestamp: v.created_at,
      action_taken: v.action_taken,
      confidence: v.confidence,
    }));

    res.json(mapped);
  });

  // Also support /api/user/:userId/strikes (used by StrikeHistory.tsx)
  app.get("/api/user/:userId/strikes", (req, res) => {
    const violations = db
      .prepare(
        `SELECT violations.*, users.username 
         FROM violations 
         JOIN users ON violations.user_id = users.id 
         WHERE violations.user_id = ? 
         ORDER BY violations.created_at DESC`
      )
      .all(req.params.userId);

    const mapped = violations.map((v: any) => ({
      id: v.id,
      user_id: v.user_id,
      type: v.type,
      content_preview: v.content,
      timestamp: v.created_at,
      action_taken: v.action_taken,
      confidence: v.confidence,
    }));

    res.json(mapped);
  });

  app.get("/api/users/:userId/safety-stats", (req, res) => {
    const { userId } = req.params;
    const user = db.prepare("SELECT strikes, status FROM users WHERE id = ?").get(userId) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    const receivedComments = db.prepare(
      `SELECT COUNT(comments.id) as total, 
              SUM(CASE WHEN is_flagged = 1 THEN 1 ELSE 0 END) as flagged
       FROM comments 
       JOIN posts ON comments.post_id = posts.id
       WHERE posts.user_id = ? AND comments.user_id != ?`
    ).get(userId, userId) as any;

    const totalPosts = (db.prepare("SELECT COUNT(*) as count FROM posts WHERE user_id = ?").get(userId) as any).count;
    
    // Global metric: total blocked users in the platform
    const blockedUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'restricted' OR status = 'banned'").get() as any).count;

    const receivedFlagged = receivedComments?.flagged || 0;
    
    let riskLevel = "Safe";
    if (receivedFlagged > 10) riskLevel = "High Risk";
    else if (receivedFlagged >= 3) riskLevel = "Medium";

    res.json({
        riskLevel,
        postsCount: totalPosts,
        receivedFlagged,
        userStrikes: user.strikes,
        blockedUsersCount: blockedUsers,
        status: user.status
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Admin Stats ──────────────────────────────────────────────────────
  app.get("/api/admin/stats", (_req, res) => {
    const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'admin'").get() as any).count;
    const totalPosts = (db.prepare("SELECT COUNT(*) as count FROM posts").get() as any).count;
    const totalComments = (db.prepare("SELECT COUNT(*) as count FROM comments").get() as any).count;
    const totalViolations = (db.prepare("SELECT COUNT(*) as count FROM violations").get() as any).count;
    const flaggedComments = (db.prepare("SELECT COUNT(*) as count FROM comments WHERE is_flagged = 1").get() as any).count;
    const activeStrikes = (db.prepare("SELECT SUM(strikes) as total FROM users WHERE strikes > 0").get() as any).total || 0;
    const blockedUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'restricted' OR status = 'banned'").get() as any).count;

    res.json({
      totalUsers,
      totalPosts,
      totalComments,
      totalViolations,
      flaggedComments,
      activeStrikes,
      blockedUsers,
      detectionRate: totalComments > 0 ? Math.round((flaggedComments / totalComments) * 100) : 0,
    });
  });

  // ─── Admin Users ──────────────────────────────────────────────────────
  app.get("/api/admin/users", (_req, res) => {
    const users = db
      .prepare(
        `SELECT users.id, users.username, users.email, users.full_name, users.role, 
                users.strikes, users.status, users.blocked_until, users.joined_at,
                COUNT(violations.id) as violation_count
         FROM users 
         LEFT JOIN violations ON users.id = violations.user_id
         GROUP BY users.id
         ORDER BY users.joined_at DESC`
      )
      .all();
    res.json(users);
  });

  // ─── Toggle User Status ───────────────────────────────────────────────
  app.patch("/api/admin/users/:userId/status", (req, res) => {
    const { userId } = req.params;
    const { status } = req.body; // 'active', 'restricted', 'banned'

    if (!["active", "restricted", "banned"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (status === "active") {
      db.prepare("UPDATE users SET status = 'active', blocked_until = NULL WHERE id = ?").run(userId);
    } else if (status === "banned") {
      db.prepare("UPDATE users SET status = 'banned', blocked_until = ? WHERE id = ?").run(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        userId
      );
    } else {
      db.prepare("UPDATE users SET status = 'restricted', blocked_until = ? WHERE id = ?").run(
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId
      );
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    res.json(user);
  });

  // ─── Admin Violations ─────────────────────────────────────────────────
  app.get("/api/admin/violations", (_req, res) => {
    const violations = db
      .prepare(
        `SELECT violations.*, users.username, users.full_name 
         FROM violations 
         JOIN users ON violations.user_id = users.id
         ORDER BY violations.created_at DESC
         LIMIT 50`
      )
      .all();

    const mapped = violations.map((v: any) => ({
      id: v.id,
      user_id: v.user_id,
      username: v.username,
      full_name: v.full_name,
      type: v.type,
      content_preview: v.content,
      timestamp: v.created_at,
      action_taken: v.action_taken,
      confidence: v.confidence,
    }));

    res.json(mapped);
  });

  // ─── Admin Analytics ──────────────────────────────────────────────────
  app.get("/api/admin/analytics", (_req, res) => {
    // Most toxic users
    const toxicUsers = db
      .prepare(
        `SELECT users.username, users.full_name, COUNT(violations.id) as violation_count, users.strikes
         FROM users 
         JOIN violations ON users.id = violations.user_id
         GROUP BY users.id
         ORDER BY violation_count DESC
         LIMIT 10`
      )
      .all();

    // Flagged comments word frequency (common toxic words)
    const flaggedComments = db
      .prepare("SELECT content FROM comments WHERE is_flagged = 1")
      .all() as { content: string }[];

    const wordCount: Record<string, number> = {};
    const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "shall", "may", "might", "can", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "about", "up", "out", "and", "but", "or", "not", "no", "it", "its", "this", "that", "i", "you", "he", "she", "they", "we", "me", "him", "her", "them", "us", "my", "your", "his"]);

    for (const row of flaggedComments) {
      const words = (row.content || "").toLowerCase().replace(/[^a-zA-Z\s]/g, "").split(/\s+/);
      for (const word of words) {
        if (word.length > 2 && !stopWords.has(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      }
    }

    const toxicWords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));

    // Daily violation trend (last 7 days)
    const dailyTrend = db
      .prepare(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM violations
         WHERE created_at >= DATE('now', '-7 days')
         GROUP BY DATE(created_at)
         ORDER BY date`
      )
      .all();

    res.json({
      toxicUsers,
      toxicWords,
      dailyTrend,
    });
  });

  // ─── Victim Detection ─────────────────────────────────────────────────
  app.get("/api/admin/victims", (_req, res) => {
    // Find users who receive the most flagged comments on their posts
    const victims = db
      .prepare(
        `SELECT 
           post_owners.id as user_id,
           post_owners.username,
           post_owners.full_name,
           COUNT(comments.id) as total_comments_received,
           SUM(CASE WHEN comments.is_flagged = 1 THEN 1 ELSE 0 END) as bullying_comments_received
         FROM comments
         JOIN posts ON comments.post_id = posts.id
         JOIN users AS post_owners ON posts.user_id = post_owners.id
         WHERE comments.user_id != posts.user_id
         GROUP BY post_owners.id
         HAVING bullying_comments_received > 0
         ORDER BY bullying_comments_received DESC
         LIMIT 10`
      )
      .all();

    const enriched = victims.map((v: any) => ({
      ...v,
      risk_level:
        v.bullying_comments_received >= 10
          ? "High"
          : v.bullying_comments_received >= 5
          ? "Medium"
          : "Low",
      bullying_percentage:
        v.total_comments_received > 0
          ? Math.round((v.bullying_comments_received / v.total_comments_received) * 100)
          : 0,
    }));

    res.json(enriched);
  });

  // ─── Model Metrics (from Flask API) ───────────────────────────────────
  app.get("/api/admin/model-metrics", async (_req, res) => {
    try {
      const mlRes = await fetch(`${ML_API_URL}/metrics`);
      if (!mlRes.ok) throw new Error("ML API error");
      const data = await mlRes.json();
      res.json(data);
    } catch {
      // Try reading from file as fallback
      try {
        const fs = await import("fs");
        const metricsPath = path.join(__dirname, "ml", "model", "metrics.json");
        const data = JSON.parse(fs.readFileSync(metricsPath, "utf-8"));
        res.json(data);
      } catch {
        res.status(503).json({ error: "Model metrics unavailable" });
      }
    }
  });

  // ─── Model Retrain ────────────────────────────────────────────────────
  app.post("/api/admin/model-retrain", async (_req, res) => {
    console.log("🔄 Requesting model retraining from ML API...");
    try {
      const mlRes = await fetch(`${ML_API_URL}/retrain`, { method: "POST" });
      if (!mlRes.ok) {
         const err = await mlRes.json().catch(() => ({}));
         throw new Error(err.error || "ML API training failed");
      }
      const data = await mlRes.json();
      res.json({ success: true, message: "Model retrained securely", metrics: data.metrics });
    } catch (err: any) {
      console.error("❌ Retrain error:", err.message);
      res.status(500).json({ error: "Training failed", details: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // VITE DEV MIDDLEWARE
  // ═══════════════════════════════════════════════════════════════════════

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 SafeSpace Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: SQLite (database.sqlite)`);
    console.log(`🤖 ML API: ${ML_API_URL}`);
    console.log(`\n📋 API Endpoints:`);
    console.log(`   POST /api/login`);
    console.log(`   POST /api/register`);
    console.log(`   GET  /api/posts`);
    console.log(`   POST /api/posts`);
    console.log(`   POST /api/posts/:id/like`);
    console.log(`   GET  /api/posts/:id/comments`);
    console.log(`   POST /api/posts/:id/comments`);
    console.log(`   POST /api/comments/analyze`);
    console.log(`   POST /api/violations`);
    console.log(`   GET  /api/users/:id/strikes`);
    console.log(`   GET  /api/admin/stats`);
    console.log(`   GET  /api/admin/users`);
    console.log(`   PATCH /api/admin/users/:id/status`);
    console.log(`   GET  /api/admin/violations`);
    console.log(`   GET  /api/admin/analytics`);
    console.log(`   GET  /api/admin/victims`);
    console.log(`   GET  /api/admin/model-metrics`);
  });
}

startServer();
