import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Rating, 
  Grid, 
  IconButton,
  Box,
  Container,
  Paper,
  Button,
  Stack,
  Avatar,
  Pagination,
  Chip,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import FlagIcon from '@mui/icons-material/Flag';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ReviewList() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    fiveStarReviews: 0
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const reviewsPerPage = 6;

  useEffect(() => {
    fetchReviews();
  }, [page]);

  useEffect(() => {
    calculateStats();
  }, [reviews]);

  const calculateStats = () => {
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews || 0;
    const fiveStarReviews = reviews.filter(review => review.rating === 5).length;

    setStats({
      totalReviews,
      averageRating: averageRating.toFixed(1),
      fiveStarReviews
    });
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reviews?page=${page}&limit=${reviewsPerPage}`);
      setReviews(response.data.reviews);
      setTotalPages(Math.ceil(response.data.total / reviewsPerPage));
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/reviews/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleReaction = async (reviewId, type) => {
    try {
      await axios.post(`http://localhost:5000/api/reviews/${reviewId}/reactions`, 
        { type },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      fetchReviews();
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const handleFlag = async (reviewId) => {
    try {
      await axios.post(`http://localhost:5000/api/reviews/${reviewId}/flag`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      fetchReviews();
    } catch (error) {
      console.error('Error flagging review:', error);
    }
  };

  const getSentimentIcon = (label) => {
    switch (label) {
      case 'positive':
        return <SentimentVerySatisfiedIcon color="success" />;
      case 'neutral':
        return <SentimentSatisfiedIcon color="warning" />;
      case 'negative':
        return <SentimentDissatisfiedIcon color="error" />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Paper 
        elevation={0}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 4,
          borderRadius: 2
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Customer Reviews
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                See what our customers are saying about us
              </Typography>
              <Button 
                variant="contained" 
                color="secondary" 
                size="large"
                onClick={() => navigate('/add')}
              >
                Write a Review
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={4} justifyContent="center">
                <Box textAlign="center">
                  <Typography variant="h3" component="div">
                    {stats.totalReviews}
                  </Typography>
                  <Typography variant="subtitle1">Total Reviews</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h3" component="div">
                    {stats.averageRating}
                  </Typography>
                  <Typography variant="subtitle1">Average Rating</Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h3" component="div">
                    {stats.fiveStarReviews}
                  </Typography>
                  <Typography variant="subtitle1">5-Star Reviews</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* Reviews Grid */}
      <Container maxWidth="lg">
        <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 4 }}>
          Latest Reviews
        </Typography>
        <Grid container spacing={3}>
          {reviews.map((review) => (
            <Grid item xs={12} sm={6} md={4} key={review.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div">
                        {review.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    {isAdmin && (
                      <IconButton 
                        onClick={() => handleDelete(review.id)}
                        color="error"
                        size="small"
                        sx={{ ml: 'auto' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Rating 
                      value={review.rating} 
                      readOnly 
                      icon={<StarIcon fontSize="inherit" />}
                    />
                    {review.sentiment_label && (
                      <Tooltip title={`Sentiment: ${review.sentiment_label}`}>
                        <Box ml={1}>
                          {getSentimentIcon(review.sentiment_label)}
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {review.comment}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1}>
                      <Chip
                        icon={<ThumbUpIcon />}
                        label={review.likes}
                        size="small"
                        onClick={() => handleReaction(review.id, 'like')}
                        color={user ? 'primary' : 'default'}
                      />
                      <Chip
                        icon={<ThumbDownIcon />}
                        label={review.dislikes}
                        size="small"
                        onClick={() => handleReaction(review.id, 'dislike')}
                        color={user ? 'primary' : 'default'}
                      />
                    </Stack>
                    {user && !isAdmin && (
                      <IconButton 
                        size="small"
                        onClick={() => handleFlag(review.id)}
                        color={review.is_flagged ? 'error' : 'default'}
                      >
                        <FlagIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Container>
    </Box>
  );
}

export default ReviewList; 