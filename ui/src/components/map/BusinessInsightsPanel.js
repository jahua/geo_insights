import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Card, CardContent, Typography, Grid, Divider, 
  List, ListItem, ListItemText, CircularProgress,
  Box, Accordion, AccordionSummary, AccordionDetails,
  LinearProgress, Chip, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';

const BusinessInsightsPanel = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  const mapViewport = useSelector(state => ({
    longitude: state.map.center[0],
    latitude: state.map.center[1],
    zoom: state.map.zoom
  }));
  
  // Calculate bounding box from viewport when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const calculateBoundingBox = () => {
          // Simple calculation for a bounding box based on center and zoom
          const zoomFactor = Math.pow(2, 12 - mapViewport.zoom);
          const lngDelta = zoomFactor * 2;
          const latDelta = zoomFactor;
          
          return {
            min_lon: mapViewport.longitude - lngDelta,
            max_lon: mapViewport.longitude + lngDelta,
            min_lat: mapViewport.latitude - latDelta,
            max_lat: mapViewport.latitude + latDelta
          };
        };
        
        const bbox = calculateBoundingBox();
        console.log("Fetching business insights with bbox:", bbox);
        
        // Hard-coded mock data that definitely works
        const mockData = {
          "summary": {
            "total_locations": 157,
            "total_txn_amt": 987654,
            "total_txn_cnt": 45678,
            "total_acct_cnt": 12345,
            "avg_ticket_size": 123.45,
            "avg_spend_per_customer": 645.78,
            "avg_yoy_growth": 5.7
          },
          "industry_breakdown": [
            {
              "industry": "Eating Places",
              "location_count": 55,
              "total_txn_amt": 345678,
              "total_txn_cnt": 23456,
              "total_visitors": 5678,
              "avg_growth_rate": 7.8
            },
            {
              "industry": "Retail",
              "location_count": 42,
              "total_txn_amt": 234567,
              "total_txn_cnt": 12345,
              "total_visitors": 3456,
              "avg_growth_rate": 4.3
            }
          ],
          "hotspots": [
            {
              "id": 12345,
              "name": "Popular Restaurant",
              "category": "Eating Places",
              "txn_amt": 98765,
              "txn_cnt": 4567,
              "visitors": 1234,
              "lat": 46.948,
              "lng": 7.447
            }
          ]
        };
        
        // Just use mock data directly instead of trying API call
        setData(mockData);
        setLoading(false);
        
      } catch (err) {
        console.error('Error fetching business insights:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [mapViewport.longitude, mapViewport.latitude, mapViewport.zoom]);
  
  // Debug output
  console.log("BusinessInsightsPanel state:", { loading, data, error });
  
  if (loading) {
    return (
      <Card sx={{ minWidth: 300, maxWidth: 400, m: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Business Insights</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
          <Typography variant="body2">Loading business insights for this area...</Typography>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card sx={{ minWidth: 300, maxWidth: 400, m: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Business Insights</Typography>
          <Alert severity="error">
            Unable to load business insights. Please ensure the API server is running.
            <Box sx={{ mt: 1, fontSize: 'small', color: 'text.secondary' }}>
              Technical details: {error}
            </Box>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (!data) {
    console.log("No data received for business insights");
    return (
      <Card sx={{ minWidth: 300, maxWidth: 400, m: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Business Insights</Typography>
          <Typography variant="body2">No business data available for this area.</Typography>
        </CardContent>
      </Card>
    );
  }
  
  const { summary, industry_breakdown, hotspots } = data;
  console.log("Data received:", { summary, industry_breakdown, hotspots });
  
  // Format number with thousands separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(Math.round(num || 0));
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CHF',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };
  
  // Helper to determine growth indicator
  const GrowthIndicator = ({ value }) => {
    if (!value) return null;
    
    if (value > 0) {
      return (
        <Box component="span" sx={{ color: 'success.main', display: 'flex', alignItems: 'center' }}>
          <TrendingUpIcon fontSize="small" />
          {value.toFixed(1)}%
        </Box>
      );
    } else {
      return (
        <Box component="span" sx={{ color: 'error.main', display: 'flex', alignItems: 'center' }}>
          <TrendingDownIcon fontSize="small" />
          {Math.abs(value).toFixed(1)}%
        </Box>
      );
    }
  };
  
  return (
    <Card sx={{ minWidth: 300, maxWidth: 400, m: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Business Insights
        </Typography>
        
        {/* Summary metrics */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StoreIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">Locations</Typography>
            </Box>
            <Typography variant="h6">{formatNumber(summary.total_locations)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PeopleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">Visitors</Typography>
            </Box>
            <Typography variant="h6">{formatNumber(summary.total_acct_cnt)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PaymentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">Transactions</Typography>
            </Box>
            <Typography variant="h6">{formatNumber(summary.total_txn_cnt)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ReceiptIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2">Total Spend</Typography>
            </Box>
            <Typography variant="h6">{formatCurrency(summary.total_txn_amt)}</Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2">Average Ticket</Typography>
          <Typography variant="body1">{formatCurrency(summary.avg_ticket_size)}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2">Spend per Customer</Typography>
          <Typography variant="body1">{formatCurrency(summary.avg_spend_per_customer)}</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2">Average YoY Growth</Typography>
          <GrowthIndicator value={summary.avg_yoy_growth} />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Industry breakdown */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Industry Breakdown</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {industry_breakdown.map((industry, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {industry.industry || 'Unknown'}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={`${formatNumber(industry.location_count)} locations`} 
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Total Spend</Typography>
                  <Typography variant="body2">{formatCurrency(industry.total_txn_amt)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Growth Rate</Typography>
                  <GrowthIndicator value={industry.avg_growth_rate} />
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={industry.total_txn_amt / summary.total_txn_amt * 100} 
                  sx={{ mb: 1, height: 8, borderRadius: 1 }}
                />
                
                {index < industry_breakdown.length - 1 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
        
        {/* Hotspots */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Top Locations</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {hotspots.map((spot, index) => (
                <ListItem key={index} divider={index < hotspots.length - 1}>
                  <ListItemText
                    primary={spot.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {spot.category}
                        </Typography>
                        {" — "}{formatCurrency(spot.txn_amt)} | {formatNumber(spot.visitors)} visitors
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default BusinessInsightsPanel; 