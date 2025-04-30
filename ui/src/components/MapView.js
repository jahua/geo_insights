import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Paper, Fab, Menu, MenuItem, Tooltip, CircularProgress, Drawer, Switch, IconButton } from '@mui/material';
import { Map } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { MapboxLayer } from '@deck.gl/mapbox';
import { 
  Layers as LayersIcon, 
  AddLocation as AddLocationIcon,
  Refresh as RefreshIcon,
  ViewInAr as ViewInArIcon,
  Map as MapIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

// Import actions
import { updateViewport, toggleLayer, updateMapLoaded, changeMapStyle, fetchBusinessInsights } from '../actions/mapActions';
import { fetchLandmarks, fetchHeatmapData, fetchClusters, setLandmarks, setHeatmapData } from '../actions/landmarkActions';

// Import custom components
import MapControls from './map/MapControls';
import MapLegend from './map/MapLegend';
import LandmarkInfo from './map/LandmarkInfo';
import BusinessInsightsPanel from './map/BusinessInsightsPanel';

// Map styles
const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v10',
  light: 'mapbox://styles/mapbox/light-v10',
  streets: 'mapbox://styles/mapbox/streets-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v11'
};

// Mapbox token
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

// Optimize the MapView component with React.memo for better performance
const MapView = React.memo(() => {
  const dispatch = useDispatch();
  
  // Get state from Redux store
  const mapState = useSelector(state => state.map || {});
  const { 
    center,
    zoom,
    mapStyle = MAP_STYLES.light, 
    mapLoaded = false,
    // Layer visibility
    layers = {
      landmarks: true,
      heatmap: true,
      clusters: false,
      boundaries: false,
      ticinoBoundaries: false,
      ticinoTourismMap: false,
      '3dBuildings': false,
      terrain: false,
      satellite: false
    },
    // 3D settings
    enable3D,
    rotationEnabled
  } = mapState;
  
  // Optimize the calculation of viewport - only calculate when center or zoom changes
  const viewport = useMemo(() => ({
    longitude: 8.2275, // Center of Switzerland
    latitude: 46.8182,
    zoom: 7,
    bearing: 0,
    pitch: enable3D ? 45 : 0
  }), [enable3D]);

  // Derive layer visibility from layers object
  const showLandmarks = layers.landmarks;
  const showHeatmap = layers.heatmap;
  const showClusters = layers.clusters;
  const showBoundaries = layers.boundaries;
  const showTicinoBoundaries = layers.ticinoBoundaries;
  const showTicinoTourismMap = layers.ticinoTourismMap;
  const show3DBuildings = layers['3dBuildings'];
  const showTerrainLayer = layers.terrain;
  const showSatelliteLayer = layers.satellite;
  
  // Layer settings with defaults
  const heatmapIntensity = 5;
  const clusterRadius = 50;
  const buildingExtrusion = 1.0;

  const landmarkState = useSelector(state => state.landmarks || {});
  const { 
    data: landmarks = [], 
    activeLandmark = null, 
    loading: landmarksLoading = false 
  } = landmarkState;
  
  const { visualizationMode = '2d' } = useSelector(state => state.ui || {});
  
  // Local state
  const [heatmapData, setHeatmapData] = useState([]);
  const [clusterData, setClusterData] = useState({ type: 'FeatureCollection', features: [] });
  const [ticinoBoundariesData, setTicinoBoundariesData] = useState(null);
  const [ticinoTourismMapData, setTicinoTourismMapData] = useState(null);
  const [mapStyleMenuAnchor, setMapStyleMenuAnchor] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [showLayersDrawer, setShowLayersDrawer] = useState(false);
  const [showBusinessInsights, setShowBusinessInsights] = useState(false);
  
  // Keep track of the UI mode
  const [is3DMode, setIs3DMode] = useState(visualizationMode === '3d');
  
  // Make sure all functions are defined before they're used
  // Static data loading function
  const loadStaticData = useCallback(() => {
    // Fetch static GeoJSON files
    fetch('/ticino_boundaries.geojson') // Path relative to public/
      .then(response => response.json())
      .then(data => setTicinoBoundariesData(data))
      .catch(error => console.error("Error loading ticino_boundaries.geojson:", error));

    fetch('/ticinomap.geojson') // Path relative to public/
      .then(response => response.json())
      .then(data => setTicinoTourismMapData(data))
      .catch(error => console.error("Error loading ticinomap.geojson:", error));
  }, []);
  
  // Fetch landmarks function
  const loadLandmarksData = useCallback(() => {
    if (landmarks.length === 0 && !landmarksLoading) {
      setIsDataLoading(true);
      fetch('/api/v1/landmarks')
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch landmarks');
          return response.json();
        })
        .then(data => {
          // Update redux store with the data
          dispatch({ type: 'SET_LANDMARKS', payload: data });
          setIsDataLoading(false);
          console.log("Landmarks loaded:", data.length);
        })
        .catch(error => {
          console.error("Error loading landmarks:", error);
          setIsDataLoading(false);
        });
    }
  }, [dispatch, landmarks.length, landmarksLoading]);
  
  // Fetch heatmap data function
  const loadHeatmapData = useCallback(() => {
    if (heatmapData.length === 0 && !isHeatmapLoading) {
      setIsHeatmapLoading(true);
      // Direct API call if the action doesn't work
      fetch('/api/v1/heatmap')
        .then(response => response.json())
        .then(data => {
          setHeatmapData(data || []);
          setIsHeatmapLoading(false);
        })
        .catch(error => {
          console.error("Error loading heatmap data:", error);
          setIsHeatmapLoading(false);
        });
    }
  }, [heatmapData, isHeatmapLoading]);
  
  // Fetch cluster data function
  const loadClusterData = useCallback(() => {
    setIsDataLoading(true);
    fetch('/api/v1/clusters')
      .then(response => response.json())
      .then(data => {
        setClusterData(data || { type: 'FeatureCollection', features: [] });
        setIsDataLoading(false);
      })
      .catch(error => {
        console.error("Error loading clusters:", error);
        setIsDataLoading(false);
      });
  }, []);
  
  // Load all data
  const loadAllData = useCallback(() => {
    loadLandmarksData();
    loadHeatmapData();
    loadClusterData();
    loadStaticData();
  }, [loadLandmarksData, loadHeatmapData, loadClusterData, loadStaticData]);
  
  // Add fallback data if API responses are empty
  useEffect(() => {
    if ((!landmarks || landmarks.length === 0) && (!heatmapData || heatmapData.length === 0)) {
      // Swiss cities as fallback data
      const swissCities = [
        { name: "Zurich", lat: 47.3769, lng: 8.5417, amount: 1200 },
        { name: "Geneva", lat: 46.2044, lng: 6.1432, amount: 1000 },
        { name: "Basel", lat: 47.5596, lng: 7.5886, amount: 950 },
        { name: "Bern", lat: 46.9480, lng: 7.4474, amount: 800 },
        { name: "Lausanne", lat: 46.5197, lng: 6.6323, amount: 780 },
        { name: "Lucerne", lat: 47.0502, lng: 8.3093, amount: 650 },
        { name: "St. Gallen", lat: 47.4245, lng: 9.3767, amount: 600 },
        { name: "Lugano", lat: 46.0036, lng: 8.9510, amount: 580 },
        { name: "Biel", lat: 47.1368, lng: 7.2467, amount: 520 },
        { name: "Thun", lat: 46.7580, lng: 7.6280, amount: 480 }
      ];

      // Convert to GeoJSON for landmarks
      const mockLandmarks = swissCities.map((city, index) => ({
        type: 'Feature',
        id: `mock-${index}`,
        geometry: {
          type: 'Point',
          coordinates: [city.lng, city.lat]
        },
        properties: {
          name: city.name,
          txn_amt: city.amount,
          industry: 'Tourism'
        }
      }));

      // Generate mock heatmap data (more points around cities)
      const mockHeatmapData = [];
      swissCities.forEach(city => {
        // Add the city center with high weight
        mockHeatmapData.push({
          longitude: city.lng,
          latitude: city.lat,
          weight: city.amount / 50 // Increase weight for visibility
        });
        
        // Add 50 points around each city with varying weights
        for (let i = 0; i < 50; i++) {
          const offsetLat = (Math.random() - 0.5) * 0.5;
          const offsetLng = (Math.random() - 0.5) * 0.5;
          const randomWeight = (city.amount / 50) * Math.random() * 1.5;
          
          mockHeatmapData.push({
            longitude: city.lng + offsetLng,
            latitude: city.lat + offsetLat,
            weight: randomWeight
          });
        }
      });

      console.log('Adding mock data for visualization');
      dispatch(setLandmarks(mockLandmarks));
      dispatch(setHeatmapData(mockHeatmapData));
      
      // Still try to load real data
      loadLandmarksData();
      loadHeatmapData();
    }
  }, [landmarks, heatmapData, dispatch]);
  
  // Handle viewport changes
  const handleViewportChange = (newViewport) => {
    dispatch(updateViewport(newViewport));
  };
  
  // Handle map load
  const handleMapLoad = (event) => {
    dispatch(updateMapLoaded(true));
    setMapRef(event.target);
    
    // Add 3D building layer on map load if enabled
    if (show3DBuildings && event.target) {
      add3DBuildingsLayer(event.target);
    }
  };
  
  // Toggle layer visibility
  const handleToggleLayer = (layerName) => {
    // Dispatch toggle action to Redux
    dispatch(toggleLayer(layerName));
    
    // Load dynamic data if needed when toggled on
    if (layerName === 'heatmap' && !layers.heatmap) {
      loadHeatmapData();
    }
    
    if (layerName === 'clusters' && !layers.clusters && (!clusterData.features || clusterData.features.length === 0)) {
      loadClusterData();
    }
    
    // Handle 3D buildings toggle
    if (layerName === '3dBuildings' && mapRef) {
      if (!layers['3dBuildings']) {
        add3DBuildingsLayer(mapRef);
      } else {
        remove3DBuildingsLayer(mapRef);
      }
    }
  };
  
  // Toggle layers drawer
  const handleToggleLayersDrawer = () => {
    setShowLayersDrawer(!showLayersDrawer);
  };
  
  // Toggle 3D mode
  const handleToggle3DMode = () => {
    const new3DMode = !is3DMode;
    setIs3DMode(new3DMode);
    
    // Update viewport with new pitch
    dispatch(updateViewport({
      ...viewport,
      pitch: new3DMode ? 45 : 0,
      transitionDuration: 500
    }));
    
    // Toggle 3D in Redux state if available
    if (typeof mapState.toggle3D === 'function') {
      dispatch({ type: 'map/toggle3D' });
    }
  };
  
  // Handle refresh data
  const handleRefreshData = () => {
    loadAllData();
  };
  
  // Add 3D buildings layer to map
  const add3DBuildingsLayer = (map) => {
    if (!map) return;
    
    // Check if the layer already exists
    if (map.getLayer('3d-buildings')) return;
    
    // Check if the style is loaded
    if (!map.isStyleLoaded()) {
      map.once('style.load', () => add3DBuildingsLayer(map));
      return;
    }
    
    try {
      map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['*', ['get', 'height'], buildingExtrusion]
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            15, 0,
            15.05, ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      }, 'waterway-label');
    } catch (error) {
      console.error("Error adding 3D buildings layer:", error);
    }
  };
  
  // Remove 3D buildings layer from map
  const remove3DBuildingsLayer = (map) => {
    if (!map) return;
    
    if (map.getLayer('3d-buildings')) {
      map.removeLayer('3d-buildings');
    }
  };
  
  // Handle map style menu
  const handleMapStyleClick = (event) => {
    setMapStyleMenuAnchor(event.currentTarget);
  };
  
  const handleMapStyleClose = () => {
    setMapStyleMenuAnchor(null);
  };
  
  const handleMapStyleChange = (style) => {
    dispatch(changeMapStyle(MAP_STYLES[style]));
    handleMapStyleClose();
  };
  
  // Optimize layer creation with useMemo
  const deckLayers = useMemo(() => {
    const layers = [];

    // Add landmark layer if visible and data exists
    if (showLandmarks && landmarks && landmarks.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: 'landmark-layer',
          data: landmarks,
          pickable: true,
          opacity: 0.8,
          stroked: true,
          filled: true,
          radiusScale: 6,
          radiusMinPixels: 3,
          radiusMaxPixels: 30,
          lineWidthMinPixels: 1,
          getPosition: d => d.geometry?.coordinates || [0, 0],
          getRadius: d => Math.sqrt(d.properties?.txn_amt || 10) / 2,
          getFillColor: d => d.id === (activeLandmark?.id) ? [255, 140, 0, 200] : [255, 99, 71],
          getLineColor: [255, 255, 255],
          onClick: ({object}) => object && dispatch({ type: 'SET_ACTIVE_LANDMARK', payload: object }),
          updateTriggers: {
            getRadius: landmarks,
            getFillColor: [activeLandmark]
          }
        })
      );
    }

    // Add heatmap layer if visible
    if (showHeatmap && heatmapData?.length > 0) {
      const intensity = heatmapIntensity || 1;
      layers.push(
        new HeatmapLayer({
          id: 'heatmap-layer',
          data: heatmapData,
          getPosition: d => [d.longitude || d.lng || 0, d.latitude || d.lat || 0],
          getWeight: d => (d.weight || d.value || 1) * 2,
          radiusPixels: 40,
          intensity: 3,
          threshold: 0.01,
          colorRange: [
            [255, 255, 178, 50],
            [254, 204, 92, 100],
            [253, 141, 60, 150],
            [240, 59, 32, 200],
            [189, 0, 38, 250]
          ]
        })
      );
    }

    // Add cluster layer if visible and data exists
    if (showClusters && clusterData && clusterData.features && clusterData.features.length > 0) {
      layers.push(
        new GeoJsonLayer({
          id: 'cluster-layer',
          data: clusterData,
          pickable: true,
          stroked: false,
          filled: true,
          extruded: is3DMode,
          pointType: 'circle',
          lineWidthScale: 20,
          lineWidthMinPixels: 2,
          getFillColor: d => [
            255,
            (1 - Math.min(1, d.properties?.point_count / 100)) * 140 + 100,
            0
          ],
          getLineColor: [255, 140, 0],
          getPointRadius: d => 10 + (d.properties?.point_count / 100) * 20,
          getLineWidth: 1,
          getElevation: d => (d.properties?.point_count || 0) * 2,
          onClick: ({object}) => object && console.log('Cluster clicked:', object),
          updateTriggers: {
            getFillColor: clusterData,
            getPointRadius: clusterData,
            getElevation: clusterData
          }
        })
      );
    }

    // Add Ticino boundary layer if visible
    if ((showBoundaries || showTicinoBoundaries) && ticinoBoundariesData) {
      layers.push(
        new GeoJsonLayer({
          id: 'ticino-boundaries-layer',
          data: ticinoBoundariesData,
          pickable: true,
          stroked: true,
          filled: true,
          extruded: false,
          lineWidthScale: 20,
          lineWidthMinPixels: 2,
          getFillColor: [60, 60, 60, 20],
          getLineColor: [100, 100, 100, 200],
          getLineWidth: 1,
          onClick: ({object}) => object && console.log('Boundary clicked:', object),
          updateTriggers: {
            getFillColor: ticinoBoundariesData
          }
        })
      );
    }

    // Add Tourism Map Layer if visible
    if (showTicinoTourismMap && ticinoTourismMapData) {
      layers.push(
        new GeoJsonLayer({
          id: 'ticino-tourism-map-layer',
          data: ticinoTourismMapData,
          pickable: true,
          stroked: true,
          filled: true,
          lineWidthMinPixels: 1,
          getFillColor: [160, 160, 180, 100], // Semi-transparent purple/gray
          getLineColor: [0, 0, 0, 150],
          onClick: ({object}) => object && console.log('Tourism region clicked:', object)
        })
      );
    }

    return layers;
  }, [
    showLandmarks,
    showHeatmap,
    showClusters,
    showBoundaries,
    showTicinoBoundaries,
    showTicinoTourismMap,
    landmarks,
    heatmapData,
    clusterData,
    ticinoBoundariesData,
    ticinoTourismMapData,
    is3DMode,
    activeLandmark,
    heatmapIntensity,
    dispatch
  ]);
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Map container */}
      <DeckGL
        initialViewState={viewport}
        controller={true}
        layers={deckLayers}
      >
        <Map
          reuseMaps
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={(evt) => handleViewportChange(evt.viewState)}
          onLoad={handleMapLoad}
        />
      </DeckGL>
      
      {/* Map Controls - only show if map is loaded */}
      {mapRef && <MapControls />}
      
      {/* Loading Indicator Overlay */}
      {(landmarksLoading || isHeatmapLoading || isDataLoading) && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
          zIndex: 200 // Ensure it's above the map but below controls
        }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Map controls */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Map Style button */}
        <Tooltip title="Change Map Style">
          <Fab
            color="primary"
            size="small"
            onClick={handleMapStyleClick}
          >
            <MapIcon />
          </Fab>
        </Tooltip>
        
        {/* Business Insights button */}
        <Tooltip title="Business Insights">
          <Fab
            color={showBusinessInsights ? "secondary" : "primary"}
            size="small"
            onClick={() => setShowBusinessInsights(!showBusinessInsights)}
          >
            <AnalyticsIcon />
          </Fab>
        </Tooltip>
        
        {/* Toggle 3D Mode */}
        <Tooltip title={is3DMode ? "Switch to 2D" : "Switch to 3D"}>
          <Fab
            color={is3DMode ? "secondary" : "primary"}
            size="small"
            onClick={handleToggle3DMode}
          >
            <ViewInArIcon />
          </Fab>
        </Tooltip>
        
        {/* Layers */}
        <Tooltip title="Layers">
          <Fab
            color="primary"
            size="small"
            onClick={handleToggleLayersDrawer}
          >
            <LayersIcon />
          </Fab>
        </Tooltip>
        
        {/* Refresh Data */}
        <Tooltip title="Refresh Data">
          <Fab
            color="primary"
            size="small"
            onClick={handleRefreshData}
            disabled={isDataLoading}
          >
            {isDataLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </Fab>
        </Tooltip>
      </Box>
      
      {/* Layers Drawer */}
      <Drawer
        anchor="left"
        open={showLayersDrawer}
        onClose={handleToggleLayersDrawer}
        PaperProps={{
          sx: {
            backgroundColor: '#252525',
            color: '#FFFFFF'
          }
        }}
      >
        <Box sx={{ 
          width: 300, 
          padding: 3,
          backgroundColor: '#252525',
          color: '#FFFFFF',
          height: '100%'
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            color: '#FFFFFF', 
            fontWeight: 'bold',
            fontSize: '24px'
          }}>Map Layers</h2>
          
          <div style={{ marginBottom: '30px' }}>
            <div style={{ 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#323232',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <label 
                htmlFor="landmarks-toggle" 
                style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#FFFFFF'
                }}
              >
                Landmarks
              </label>
              <Switch
                id="landmarks-toggle"
                checked={showLandmarks}
                onChange={() => handleToggleLayer('landmarks')}
                color="primary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { 
                    color: '#4d7fff'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4d7fff'
                  }
                }}
              />
            </div>
            
            <div style={{ 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#323232',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <label 
                htmlFor="heatmap-toggle" 
                style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#FFFFFF'
                }}
              >
                Heat Map
              </label>
              <Switch
                id="heatmap-toggle"
                checked={showHeatmap}
                onChange={() => handleToggleLayer('heatmap')}
                color="primary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { 
                    color: '#4d7fff'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4d7fff'
                  }
                }}
              />
            </div>
            
            <div style={{ 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#323232',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <label 
                htmlFor="clusters-toggle" 
                style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#FFFFFF'
                }}
              >
                Clusters
              </label>
              <Switch
                id="clusters-toggle"
                checked={showClusters}
                onChange={() => handleToggleLayer('clusters')}
                color="primary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { 
                    color: '#4d7fff'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4d7fff'
                  }
                }}
              />
            </div>
            
            <div style={{ 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#323232',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <label 
                htmlFor="boundaries-toggle" 
                style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#FFFFFF'
                }}
              >
                Boundaries
              </label>
              <Switch
                id="boundaries-toggle"
                checked={showBoundaries}
                onChange={() => handleToggleLayer('boundaries')}
                color="primary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { 
                    color: '#4d7fff'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4d7fff'
                  }
                }}
              />
            </div>
            
            <div style={{ 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#323232',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <label 
                htmlFor="ticino-boundaries-toggle" 
                style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#FFFFFF'
                }}
              >
                Ticino Boundaries
              </label>
              <Switch
                id="ticino-boundaries-toggle"
                checked={showTicinoBoundaries}
                onChange={() => handleToggleLayer('ticinoBoundaries')}
                color="primary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { 
                    color: '#4d7fff'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4d7fff'
                  }
                }}
              />
            </div>
            
            <div style={{ 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#323232',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <label 
                htmlFor="ticino-tourism-toggle" 
                style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#FFFFFF'
                }}
              >
                Ticino Tourism Regions
              </label>
              <Switch
                id="ticino-tourism-toggle"
                checked={showTicinoTourismMap}
                onChange={() => handleToggleLayer('ticinoTourismMap')}
                color="primary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { 
                    color: '#4d7fff'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4d7fff'
                  }
                }}
              />
            </div>
          </div>
          
          <h2 style={{ 
            margin: '30px 0 20px 0', 
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: '24px'
          }}>3D View</h2>
          <div>
            <div style={{ 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#323232',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <label 
                htmlFor="3d-buildings-toggle" 
                style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#FFFFFF'
                }}
              >
                3D Buildings
              </label>
              <Switch
                id="3d-buildings-toggle"
                checked={show3DBuildings}
                onChange={() => handleToggleLayer('3dBuildings')}
                color="primary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { 
                    color: '#4d7fff'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4d7fff'
                  }
                }}
              />
            </div>
          </div>
          
          <h2 style={{ 
            margin: '30px 0 20px 0', 
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: '24px'
          }}>Camera Controls</h2>
          <div>
            <div style={{ 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#323232',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <label 
                htmlFor="enable-pitch-toggle" 
                style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: '#FFFFFF'
                }}
              >
                Enable Pitch
              </label>
              <Switch
                id="enable-pitch-toggle"
                checked={is3DMode}
                onChange={handleToggle3DMode}
                color="primary"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { 
                    color: '#4d7fff'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4d7fff'
                  }
                }}
              />
            </div>
          </div>
        </Box>
      </Drawer>
      
      {/* Map style menu */}
      <Menu
        anchorEl={mapStyleMenuAnchor}
        open={Boolean(mapStyleMenuAnchor)}
        onClose={handleMapStyleClose}
      >
        <MenuItem onClick={() => handleMapStyleChange('dark')}>Dark</MenuItem>
        <MenuItem onClick={() => handleMapStyleChange('light')}>Light</MenuItem>
        <MenuItem onClick={() => handleMapStyleChange('streets')}>Streets</MenuItem>
        <MenuItem onClick={() => handleMapStyleChange('satellite')}>Satellite</MenuItem>
      </Menu>
      
      {/* Map legend */}
      <Box sx={{ position: 'absolute', bottom: 32, left: 16, zIndex: 1000 }}>
        <MapLegend />
      </Box>
      
      {/* Landmark info */}
      {activeLandmark && (
        <Box sx={{ position: 'absolute', bottom: 32, right: 16, zIndex: 1000, width: 300 }}>
          <LandmarkInfo landmark={activeLandmark} />
        </Box>
      )}
      
      {/* Direct Business Insights Button */}
      <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        <Tooltip title="Show Business Insights">
          <IconButton
            onClick={() => setShowBusinessInsights(!showBusinessInsights)}
            color={showBusinessInsights ? "secondary" : "primary"}
            sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
          >
            <AnalyticsIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Business Insights Panel */}
      {showBusinessInsights && (
        <Box sx={{ position: 'absolute', top: 80, left: 20, zIndex: 100 }}>
          <BusinessInsightsPanel onClose={() => setShowBusinessInsights(false)} />
        </Box>
      )}
    </Box>
  );
});

export default MapView; 