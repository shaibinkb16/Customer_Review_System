# Customer Review Platform

A full-stack application for managing customer reviews with sentiment analysis, user authentication, and admin features.

## Features

- **User Reviews Module**
  - Submit reviews with ratings and comments
  - View all reviews with pagination
  - Like/dislike reviews
  - Sentiment analysis for each review

- **Admin Module**
  - Admin login with JWT authentication
  - View and manage all reviews
  - Delete or flag inappropriate reviews
  - Search functionality

- **Authentication**
  - User registration and login
  - JWT-based authentication
  - Role-based access control

## Tech Stack

- **Frontend**: React (Vite), Material-UI
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Authentication**: JWT, bcrypt

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Database Setup

1. Create a MySQL database named `customer_reviews`
2. Import the schema from `server/schema.sql`

```bash
mysql -u root -p < server/schema.sql
```

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   # Database configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=customer_reviews

   # Server configuration
   PORT=5000

   # JWT configuration
   JWT_SECRET=your_jwt_secret_key_here

   # Sentiment analysis API (if using a real API)
   SENTIMENT_API_KEY=your_api_key_here
   SENTIMENT_API_URL=https://api.example.com/sentiment
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Default Admin Account

- Email: admin@example.com
- Password: admin123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user information

### Reviews
- `GET /api/reviews` - Get all reviews (paginated)
- `POST /api/reviews` - Create a new review
- `DELETE /api/reviews/:id` - Delete a review
- `POST /api/reviews/:id/reactions` - Like/dislike a review

### Admin
- `GET /api/admin/reviews` - Get all reviews (admin view)
- `PUT /api/admin/reviews/:id/flag` - Flag/unflag a review

## Sentiment Analysis

The application includes a mock sentiment analysis implementation. In a production environment, you would replace this with a call to a real sentiment analysis API. 