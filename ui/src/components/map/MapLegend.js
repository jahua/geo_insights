import React from 'react';
import { useSelector } from 'react-redux';
import { Paper, Typography, Box, Divider } from '@mui/material';

const MapLegend = () => {
  // Get state from Redux store with a fallback for visibleLayers
  const { visibleLayers = {} } = useSelector(state => state.map || {});
  
  // Only show legend if at least one layer is visible
  const anyLayerVisible = Object.values(visibleLayers).some(visible => visible);
  
  if (!anyLayerVisible) {
    return null;
  }
  
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        maxWidth: 250,
        backgroundColor: 'background.paper',
        opacity: 0.9
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Legend
      </Typography>
      
      <Divider sx={{ mb: 1 }} />
      
      {/* Landmarks layer */}
      {visibleLayers.landmarks && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: 'rgb(255, 0, 128)',
              mr: 1
            }}
          />
          <Typography variant="body2">
            Landmarks
          </Typography>
        </Box>
      )}
      
      {/* Heatmap layer */}
      {visibleLayers.heatmap && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                background: 'linear-gradient(to right, rgb(1, 152, 189), rgb(73, 227, 206), rgb(216, 254, 181), rgb(254, 237, 177), rgb(254, 173, 84), rgb(209, 55, 78))',
                mr: 1
              }}
            />
            <Typography variant="body2">
              Transaction Heatmap
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 3, pr: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Low
            </Typography>
            <Typography variant="caption" color="text.secondary">
              High
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Clusters layer */}
      {visibleLayers.clusters && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: 'rgba(140, 170, 180, 0.7)',
              border: '1px solid rgba(0, 0, 0, 0.5)',
              mr: 1
            }}
          />
          <Typography variant="body2">
            Clusters
          </Typography>
        </Box>
      )}
      
      {/* Boundaries layer */}
      {visibleLayers.boundaries && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              border: '2px solid rgba(100, 100, 100, 0.8)',
              backgroundColor: 'transparent',
              mr: 1
            }}
          />
          <Typography variant="body2">
            Boundaries
          </Typography>
        </Box>
      )}
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        GeoLandmark Explorer
      </Typography>
    </Paper>
  );
};

export default MapLegend; 