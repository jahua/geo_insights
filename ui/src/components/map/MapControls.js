import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Card, 
  Typography, 
  FormControlLabel, 
  Switch
} from '@mui/material';

// Import actions
import { toggleLayer } from '../../actions/mapActions';

const MapControls = () => {
  const dispatch = useDispatch();
  const layers = useSelector(state => state.map.layers);
  
  // Extract layer visibility
  const showLandmarks = layers?.landmarks;
  const showHeatmap = layers?.heatmap;
  const showClusters = layers?.clusters;
  
  // Handler for layer toggles
  const handleToggleLayer = (layerName) => {
    dispatch(toggleLayer(layerName));
  };
  
  return (
    <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
      <Card sx={{ p: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Map Layers</Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={showLandmarks}
              onChange={() => handleToggleLayer('landmarks')}
              color="primary"
              size="small"
            />
          }
          label="Landmarks"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={showHeatmap}
              onChange={() => handleToggleLayer('heatmap')}
              color="primary"
              size="small"
            />
          }
          label="Heatmap"
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={showClusters}
              onChange={() => handleToggleLayer('clusters')}
              color="primary"
              size="small"
            />
          }
          label="Clusters"
        />
      </Card>
    </Box>
  );
};

export default MapControls; 