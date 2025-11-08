
const express = require('express');
const cors = require('cors');
const db = require('./db');
const detectAttacks = require('./detectionMiddleware');
const { blockAttacker } = require('./ipBlocker');
const xss = require('xss');

const http = require('http');
const { Server } = require("socket.io");

const app = express();
const PORT = 3001;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
const socketIoInstance = { io: io };

// --- Middleware ---
app.use(blockAttacker);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(detectAttacks(socketIoInstance));

// --- "FAKE" AUTH MIDDLEWARE ---
const fakeAuth = (req, res, next) => {
    req.user = { id: 1, username: 'normal_user', is_admin: false };
    next();
};
const fakeAuthAdmin = (req, res, next) => {
    req.user = { id: 2, username: 'admin', is_admin: true };
    next();
};

// --- Test Route ---
app.get('/api/test', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ message: 'Server is running!', db_time: result.rows[0].now });
  } catch (err) {
    console.error('Error connecting to database:', err);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// ===================================
// --- VULNERABLE ROUTES (Unchanged) ---
// ===================================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const queryText = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    console.log(`[SQLi ATTEMPT]: Executing query: ${queryText}`);
    const result = await db.query(queryText);
    if (result.rows.length > 0) {
      res.json({ message: `Welcome, ${result.rows[0].username}!`, user: result.rows[0] });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred', details: err.message });
  }
});

app.post('/api/products/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, comment_text } = req.body;
    const queryText = 'INSERT INTO comments (product_id, username, comment_text) VALUES ($1, $2, $3) RETURNING *';
    const newComment = await db.query(queryText, [id, username, comment_text]);
    res.status(201).json(newComment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/api/admin/all_users', async (req, res) => {
  try {
    console.log('[BAC ATTEMPT]: Accessing admin route');
    const result = await db.query('SELECT id, username, is_admin FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[IDOR ATTEMPT]: Accessing user profile for ID: ${id}`);
    const result = await db.query('SELECT id, username, password, is_admin FROM users WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// This route *still* gets product details AND comments from the DB
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productResult = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      // Fallback for new hardcoded products
      const newProducts = getNewProducts();
      const product = newProducts.find(p => p.id == id);
      if (product) {
        // Get comments for product 1 as a demo for all
        const commentsResult = await db.query('SELECT * FROM comments WHERE product_id = 1 ORDER BY created_at DESC');
        res.json({ product: product, comments: commentsResult.rows });
      } else {
        return res.status(404).json({ error: 'Product not found' });
      }
    } else {
      const commentsResult = await db.query('SELECT * FROM comments WHERE product_id = $1 ORDER BY created_at DESC', [id]);
      res.json({ product: productResult.rows[0], comments: commentsResult.rows });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// --- NEW HARDCODED PRODUCT LIST ---
const getNewProducts = () => [
  { id: 1, name: 'CyberGlove 3000', description: 'A glove for all your cyber needs. Really.', price: 99.99 },
  { id: 2, name: 'Stealth-Mode USB', description: 'A USB that totally makes you invisible.', price: 25.50 },
  { id: 3, name: 'Samsung S24 Ultra', description: 'The new standard in mobile AI.', price: 1299.99 },
  { id: 4, name: 'Pro Gamer Keyboard', description: 'Clicky, clacky, and full of RGB.', price: 149.99 },
  { id: 5, name: 'HyperLite Gaming Mouse', description: 'So light, it feels like nothing.', price: 89.99 },
  { id: 6, name: 'Hot Wheels "The Cybertruck"', description: 'A 1:64 scale model of the future.', price: 5.99 }
];

// --- MODIFIED ROUTE ---
// This route now returns our new hardcoded list
app.get('/api/products', async (req, res) => {
  res.json(getNewProducts());
});

// ===================================
// --- SECURE ROUTES (Unchanged) ---
// ===================================
app.post('/api/login-secure', async (req, res) => {
  const { username, password } = req.body;
  const queryText = 'SELECT * FROM users WHERE username = $1 AND password = $2';
  try {
    const result = await db.query(queryText, [username, password]);
    if (result.rows.length > 0) {
      const user = { id: result.rows[0].id, username: result.rows[0].username, is_admin: result.rows[0].is_admin };
      res.json({ message: `Welcome, ${user.username}! (Secure Login)`, user: user });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error("Secure login error:", err.message);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/api/products/:id/comments-secure', fakeAuth, async (req, res) => {
  const { id } = req.params;
  const { comment_text } = req.body;
  const username = req.user.username;
  const sanitizedComment = xss(comment_text);
  try {
    const queryText = 'INSERT INTO comments (product_id, username, comment_text) VALUES ($1, $2, $3) RETURNING *';
    const newComment = await db.query(queryText, [id, username, sanitizedComment]);
    res.status(201).json(newComment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/api/admin/all_users-secure', fakeAuthAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, is_admin FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/api/users/my-profile-secure', fakeAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query('SELECT id, username, is_admin FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// --- Server Startup ---
io.on('connection', (socket) => {
  console.log(`[SOCKET.IO]: User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[SOCKET.IO]: User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`[CERBERUS_SERVER]: Running on http://localhost:${PORT}`);
});

module.exports = socketIoInstance;