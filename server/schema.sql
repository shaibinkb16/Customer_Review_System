CREATE DATABASE IF NOT EXISTS customer_reviews;
USE customer_reviews;

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS review_reactions;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  sentiment_score FLOAT,
  sentiment_label ENUM('positive', 'negative', 'neutral'),
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create review_reactions table
CREATE TABLE review_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  review_id INT NOT NULL,
  user_id INT NOT NULL,
  reaction_type ENUM('like', 'dislike') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_reaction (review_id, user_id)
);

-- Insert default admin user
-- Password is 'admin123' (hashed with bcrypt)
INSERT INTO users (name, email, password, role) 
VALUES ('Shaibin K B', 'shaibinkb16@gmail.com', '$2b$10$Inhm9Tg/JRrkPLs5g/26QOXacMK0gsnVoNUvHbSVZ.fzCAD/L7xOS', 'admin');

-- Insert some sample users
INSERT INTO users (name, email, password, role) 
VALUES 
('John Doe', 'john@example.com', '$2a$10$X7UrE2JgX9Y9Y9Y9Y9Y9Y.9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y', 'user'),
('Jane Smith', 'jane@example.com', '$2a$10$X7UrE2JgX9Y9Y9Y9Y9Y9Y.9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y', 'user');

-- Insert some sample reviews
INSERT INTO reviews (user_id, rating, comment, sentiment_score, sentiment_label) 
VALUES 
(2, 5, 'This product exceeded my expectations! The quality is outstanding and the service was excellent.', 0.85, 'positive'),
(3, 4, 'Good product overall, but shipping took a bit longer than expected.', 0.65, 'positive'),
(2, 3, 'The product is okay, but there are better options available for the same price.', 0.45, 'neutral'),
(3, 2, 'I was disappointed with the quality. It didn\'t last as long as I expected.', 0.25, 'negative');

-- Insert some sample reactions
INSERT INTO review_reactions (review_id, user_id, reaction_type) 
VALUES 
(1, 3, 'like'),
(1, 2, 'like'),
(2, 2, 'like'),
(3, 3, 'dislike'),
(4, 2, 'dislike'); 