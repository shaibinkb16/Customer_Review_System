const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set');
  console.error('Please set JWT_SECRET in your .env file');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if user already exists
    const [existingUsers] = await db.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await db.promise().query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'user']
    );
    
    // Generate token
    const token = jwt.sign(
      { id: result.insertId, email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        name,
        email,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.promise().query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Review routes
app.get('/api/reviews', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const offset = (page - 1) * limit;
  const userId = req.query.userId;
  
  try {
    let query = 'SELECT r.*, u.name as user_name, ';
    let countQuery = 'SELECT COUNT(*) as total FROM reviews r';
    let params = [];
    
    // Add subqueries for likes and dislikes
    query += `(SELECT COUNT(*) FROM review_reactions WHERE review_id = r.id AND reaction_type = 'like') as likes, `;
    query += `(SELECT COUNT(*) FROM review_reactions WHERE review_id = r.id AND reaction_type = 'dislike') as dislikes `;
    query += 'FROM reviews r LEFT JOIN users u ON r.user_id = u.id';
    
    // Filter by user if userId is provided
    if (userId) {
      query += ' WHERE r.user_id = ?';
      countQuery += ' WHERE r.user_id = ?';
      params.push(userId);
    }
    
    // Add ordering and pagination
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // Get total count
    const [countResult] = await db.promise().query(countQuery, userId ? [userId] : []);
    const total = countResult[0].total;
    
    // Get reviews
    const [reviews] = await db.promise().query(query, params);
    
    res.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/reviews', authenticateToken, async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user.id;
  
  try {
    // Call sentiment analysis API (mock for now)
    // In production, replace with a real API call
    const sentimentResponse = await analyzeSentiment(comment);
    
    // Insert review with sentiment data
    const [result] = await db.promise().query(
      `INSERT INTO reviews (user_id, rating, comment, sentiment_score, sentiment_label) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, rating, comment, sentimentResponse.score, sentimentResponse.label]
    );
    
    // Get the created review with user info
    const [reviews] = await db.promise().query(
      `SELECT r.*, u.name as user_name 
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(reviews[0]);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
  const reviewId = req.params.id;
  
  try {
    // Check if user is admin or review owner
    const [reviews] = await db.promise().query(
      'SELECT user_id FROM reviews WHERE id = ?',
      [reviewId]
    );
    
    if (reviews.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    if (req.user.role !== 'admin' && reviews[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    // Delete review reactions first (due to foreign key constraint)
    await db.promise().query(
      'DELETE FROM review_reactions WHERE review_id = ?',
      [reviewId]
    );
    
    // Delete review
    await db.promise().query(
      'DELETE FROM reviews WHERE id = ?',
      [reviewId]
    );
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Review reactions
app.post('/api/reviews/:id/reactions', authenticateToken, async (req, res) => {
  const { reactionType } = req.body;
  const reviewId = req.params.id;
  const userId = req.user.id;
  
  if (!['like', 'dislike'].includes(reactionType)) {
    return res.status(400).json({ message: 'Invalid reaction type' });
  }
  
  try {
    // Check if review exists
    const [reviews] = await db.promise().query(
      'SELECT id FROM reviews WHERE id = ?',
      [reviewId]
    );
    
    if (reviews.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user already reacted
    const [existingReactions] = await db.promise().query(
      'SELECT * FROM review_reactions WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );
    
    if (existingReactions.length > 0) {
      // Update existing reaction
      await db.promise().query(
        'UPDATE review_reactions SET reaction_type = ? WHERE review_id = ? AND user_id = ?',
        [reactionType, reviewId, userId]
      );
    } else {
      // Create new reaction
      await db.promise().query(
        'INSERT INTO review_reactions (review_id, user_id, reaction_type) VALUES (?, ?, ?)',
        [reviewId, userId, reactionType]
      );
    }
    
    // Get updated reaction counts
    const [likes] = await db.promise().query(
      'SELECT COUNT(*) as count FROM review_reactions WHERE review_id = ? AND reaction_type = "like"',
      [reviewId]
    );
    
    const [dislikes] = await db.promise().query(
      'SELECT COUNT(*) as count FROM review_reactions WHERE review_id = ? AND reaction_type = "dislike"',
      [reviewId]
    );
    
    res.json({
      likes: likes[0].count,
      dislikes: dislikes[0].count
    });
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
app.get('/api/admin/reviews', authenticateToken, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  
  try {
    // Get total count with search
    const [countResult] = await db.promise().query(
      'SELECT COUNT(*) as total FROM reviews WHERE comment LIKE ?',
      [`%${search}%`]
    );
    const total = countResult[0].total;
    
    // Get reviews with user info and search
    const [reviews] = await db.promise().query(
      `SELECT r.*, u.name as user_name, u.email as user_email,
       (SELECT COUNT(*) FROM review_reactions WHERE review_id = r.id AND reaction_type = 'like') as likes,
       (SELECT COUNT(*) FROM review_reactions WHERE review_id = r.id AND reaction_type = 'dislike') as dislikes
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.comment LIKE ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [`%${search}%`, limit, offset]
    );
    
    res.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/reviews/:id/flag', authenticateToken, isAdmin, async (req, res) => {
  const reviewId = req.params.id;
  const { isFlagged } = req.body;
  
  try {
    await db.promise().query(
      'UPDATE reviews SET is_flagged = ? WHERE id = ?',
      [isFlagged, reviewId]
    );
    
    res.json({ message: 'Review flag status updated' });
  } catch (error) {
    console.error('Flag review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function for sentiment analysis (mock implementation)
async function analyzeSentiment(text) {
  // In a real implementation, this would call an external API
  // For now, we'll return a mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simple mock sentiment analysis
      const sentiment = Math.random();
      const label = sentiment > 0.7 ? 'positive' : sentiment < 0.3 ? 'negative' : 'neutral';
      
      resolve({
        score: sentiment,
        label
      });
    }, 500);
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


const password = 'Kl43e4175@';
bcrypt.hash(password, 10).then(hash => console.log(hash));
