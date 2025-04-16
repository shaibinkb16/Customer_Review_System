import { useState } from 'react';
import { 
  TextField, 
  Button, 
  Rating, 
  Box, 
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function AddReview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    rating: 0,
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentiment, setSentiment] = useState(null);

  const analyzeSentiment = async (text) => {
    try {
      // Using a mock sentiment analysis API for demonstration
      // In production, replace with a real API like Azure Cognitive Services
      const response = await axios.post('http://localhost:5000/api/sentiment/analyze', {
        text
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First analyze the sentiment
      const sentimentResult = await analyzeSentiment(formData.comment);
      setSentiment(sentimentResult);

      // Then submit the review with sentiment data
      await axios.post('http://localhost:5000/api/reviews', {
        ...formData,
        sentiment_score: sentimentResult?.score,
        sentiment_label: sentimentResult?.label
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Error submitting review');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Add a Review
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          margin="normal"
          required
          disabled={!!user}
        />
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
          disabled={!!user}
        />
        <Box sx={{ my: 2 }}>
          <Typography component="legend">Rating</Typography>
          <Rating
            name="rating"
            value={formData.rating}
            onChange={(event, newValue) => {
              setFormData(prev => ({ ...prev, rating: newValue }));
            }}
            size="large"
          />
        </Box>
        <TextField
          fullWidth
          label="Comment"
          name="comment"
          value={formData.comment}
          onChange={handleChange}
          margin="normal"
          multiline
          rows={4}
          required
        />
        {sentiment && (
          <Alert 
            severity={
              sentiment.label === 'positive' ? 'success' : 
              sentiment.label === 'negative' ? 'error' : 'info'
            }
            sx={{ mt: 2 }}
          >
            Sentiment Analysis: {sentiment.label} (Score: {sentiment.score.toFixed(2)})
          </Alert>
        )}
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          fullWidth
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit Review'}
        </Button>
      </Box>
    </Paper>
  );
}

export default AddReview; 