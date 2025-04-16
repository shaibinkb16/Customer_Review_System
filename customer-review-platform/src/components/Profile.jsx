import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Avatar, 
  Divider, 
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Rating
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserReviews = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/reviews?userId=${user.id}`);
        setUserReviews(response.data.reviews);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user reviews:', err);
        setError('Failed to load your reviews');
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, [user, navigate]);

  // Function to handle the date formatting properly
  const formatDate = (date) => {
    const formattedDate = new Date(date);
    return !isNaN(formattedDate) ? formattedDate.toLocaleDateString() : 'Date unavailable';
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Loading profile...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              fontSize: '2rem',
              mr: 3
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>{user.name}</Typography>
            <Typography variant="body1" color="text.secondary">{user.email}</Typography>
            <Typography variant="body2" color="text.secondary">
              Member since {formatDate(user.created_at)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>Your Reviews</Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        )}

        {userReviews.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ my: 2 }}>
            You haven't written any reviews yet.
          </Typography>
        ) : (
          <List>
            {userReviews.map((review) => (
              <ListItem 
                key={review.id} 
                alignItems="flex-start"
                divider
                sx={{ py: 2 }}
              >
                <ListItemAvatar>
                  <Rating value={review.rating} readOnly />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" component="span" sx={{ mr: 2 }}>
                        {review.comment.substring(0, 50)}{review.comment.length > 50 ? '...' : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(review.created_at)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        Sentiment: {review.sentiment_label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Likes: {review.likes} | Dislikes: {review.dislikes}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/add')}
          >
            Write a New Review
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Profile;
