import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Paper,
  Typography,
  Box,
  Divider,
  Chip,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  BarChart as ChartIcon,
  Score as ScoreIcon,
  Layers as LayersIcon,
  Chat as ChatIcon
} from '@mui/icons-material';

// Import actions
import { setActiveLandmark } from '../../reducers/landmarksReducer';
import { sendMessageToLLM } from '../../actions/chatActions';
import { setActiveTab } from '../../reducers/uiReducer';
import { useNavigate } from 'react-router-dom';

const LandmarkInfo = ({ landmark }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Handle close
  const handleClose = () => {
    dispatch(setActiveLandmark(null));
  };
  
  // Handle asking about landmark
  const handleAskAbout = () => {
    // Navigate to chat and send a message
    dispatch(setActiveTab('chat'));
    navigate('/chat');
    
    setTimeout(() => {
      dispatch(sendMessageToLLM(`Tell me about the landmark ${landmark.name || 'at this location'}. What transaction patterns are observed here?`));
    }, 500);
  };
  
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        backgroundColor: 'background.paper',
        position: 'relative'
      }}
    >
      {/* Close button */}
      <IconButton
        size="small"
        onClick={handleClose}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      
      {/* Header */}
      <Typography variant="h6" gutterBottom>
        {landmark.name || 'Unnamed Landmark'}
      </Typography>
      
      {landmark.category && (
        <Chip
          icon={<CategoryIcon />}
          label={landmark.category}
          size="small"
          sx={{ mb: 2 }}
        />
      )}
      
      <Divider sx={{ my: 1 }} />
      
      {/* Details */}
      <List dense>
        <ListItem>
          <ListItemIcon>
            <LocationIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Location"
            secondary={`${landmark.geometry.coordinates[1].toFixed(5)}, ${landmark.geometry.coordinates[0].toFixed(5)}`}
          />
        </ListItem>
        
        {landmark.geo_type && (
          <ListItem>
            <ListItemIcon>
              <LayersIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Geographic Type"
              secondary={landmark.geo_type}
            />
          </ListItem>
        )}
        
        {landmark.score !== undefined && (
          <ListItem>
            <ListItemIcon>
              <ScoreIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Score"
              secondary={landmark.score.toFixed(2)}
            />
          </ListItem>
        )}
        
        {landmark.txn_amt !== undefined && (
          <ListItem>
            <ListItemIcon>
              <ChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Transaction Amount"
              secondary={`CHF ${landmark.txn_amt.toLocaleString()}`}
            />
          </ListItem>
        )}
      </List>
      
      <Divider sx={{ my: 1 }} />
      
      {/* Actions */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ChartIcon />}
        >
          View Stats
        </Button>
        
        <Button
          variant="contained"
          size="small"
          startIcon={<ChatIcon />}
          onClick={handleAskAbout}
        >
          Ask About
        </Button>
      </Box>
    </Paper>
  );
};

export default LandmarkInfo; 