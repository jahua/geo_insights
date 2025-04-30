import { createSlice } from '@reduxjs/toolkit';
import { 
  UPDATE_VIEWPORT, 
  CHANGE_MAP_STYLE, 
  UPDATE_MAP_LOADED,
  TOGGLE_LAYER,
  SET_LAYER_VISIBILITY,
  FLY_TO_LOCATION,
  FIT_BOUNDS,
  TOGGLE_ROTATION,
  FETCH_BUSINESS_INSIGHTS_REQUEST,
  FETCH_BUSINESS_INSIGHTS_SUCCESS,
  FETCH_BUSINESS_INSIGHTS_FAILURE
} from '../actions/mapActions';

// Action types
const SET_CENTER = 'SET_CENTER';
const SET_ZOOM = 'SET_ZOOM';
const SET_VIEWPORT = 'SET_VIEWPORT';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';
const SET_VISIBLE_LAYERS = 'SET_VISIBLE_LAYERS';

// Initial state for the map
const initialState = {
  // Viewport settings
  center: [7.4417, 46.9477], // Bern, Switzerland
  zoom: 8,
  
  // Map style
  mapStyle: 'mapbox://styles/mapbox/light-v11',
  
  // UI state
  loading: false,
  error: null,
  
  // Map loaded state
  mapLoaded: false,
  
  // Visible layers
  layers: {
    landmarks: true,
    heatmap: false,
    clusters: false,
    '3d': false,
    regions: false,
    labels: true,
    baseLayer: true
  },
  
  // 3D view settings
  enable3D: false,
  enablePitch: true,
  pitchValue: 0, // Degrees (0-60)
  bearingValue: 0, // Degrees (0-360)
  
  // Rotation enabled state
  rotationEnabled: false,
  
  // Business insights state
  businessInsights: {
    loading: false,
    data: null,
    error: null
  }
};

// Create the map slice with reducers
const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    // Viewport actions
    setCenter: (state, action) => {
      state.center = action.payload;
    },
    setZoom: (state, action) => {
      state.zoom = action.payload;
    },
    setViewport: (state, action) => {
      const { center, zoom } = action.payload;
      state.center = center || state.center;
      state.zoom = zoom || state.zoom;
    },
    
    // Map style actions
    changeMapStyle: (state, action) => {
      state.mapStyle = action.payload;
    },
    
    // Loading state actions
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // Error state actions
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    // Map loaded state actions
    updateMapLoaded: (state, action) => {
      state.mapLoaded = action.payload;
    },
    
    // Layer visibility actions
    toggleLayer: (state, action) => {
      const { layerName, visible } = action.payload;
      if (typeof visible === 'boolean') {
        state.layers[layerName] = visible;
      } else {
        state.layers[layerName] = !state.layers[layerName];
      }
    },
    
    setLayerVisibility: (state, action) => {
      state.layers = { ...action.payload };
    },
    
    // Location actions
    flyToLocation: (state, action) => {
      const { longitude, latitude, zoom } = action.payload;
      state.center = [longitude, latitude];
      if (zoom) state.zoom = zoom;
    },
    
    // Bounds actions
    fitBounds: (state, action) => {
      // This action is handled by the map component directly
      // We just pass through the bounds to fit to
    },
    
    // 3D view actions
    toggle3D: (state) => {
      state.enable3D = !state.enable3D;
    },
    
    toggleRotation: (state) => {
      state.rotationEnabled = !state.rotationEnabled;
    },
    
    // Reset map view
    resetMapView: (state) => {
      state.center = initialState.center;
      state.zoom = initialState.zoom;
      state.enable3D = initialState.enable3D;
      state.pitchValue = initialState.pitchValue;
      state.bearingValue = initialState.bearingValue;
    },
    
    // Business insights actions
    fetchBusinessInsightsRequest: (state) => {
      state.businessInsights = {
        ...state.businessInsights,
        loading: true,
        error: null
      };
    },
    fetchBusinessInsightsSuccess: (state, action) => {
      state.businessInsights = {
        loading: false,
        data: action.payload,
        error: null
      };
    },
    fetchBusinessInsightsFailure: (state, action) => {
      state.businessInsights = {
        ...state.businessInsights,
        loading: false,
        error: action.payload
      };
    }
  }
});

// Export action creators for use in components
export const {
  setCenter,
  setZoom,
  setViewport,
  changeMapStyle,
  updateMapLoaded,
  toggleLayer,
  setLayerVisibility,
  flyToLocation,
  fitBounds,
  toggle3D,
  toggleRotation,
  setLoading,
  setError,
  resetMapView,
  fetchBusinessInsightsRequest,
  fetchBusinessInsightsSuccess,
  fetchBusinessInsightsFailure
} = mapSlice.actions;

// Map action creator to Redux action
export function updateViewport(viewport) {
  return setViewport({
    center: [viewport.longitude, viewport.latitude],
    zoom: viewport.zoom
  });
}

// Toggle layer visibility
export function toggleLayerReducer(layerName, visible) {
  return toggleLayer({
    layerName,
    visible
  });
}

// Set visible layers
export function setVisibleLayers(layers) {
  return setLayerVisibility({
    payload: layers
  });
}

// Convert Redux Toolkit actions to regular Redux actions
// Map actions from other files to our slice actions
export function mapActionToReducer(action) {
  switch (action.type) {
    case FETCH_BUSINESS_INSIGHTS_REQUEST:
      return fetchBusinessInsightsRequest();
    case FETCH_BUSINESS_INSIGHTS_SUCCESS:
      return fetchBusinessInsightsSuccess(action.payload);
    case FETCH_BUSINESS_INSIGHTS_FAILURE:
      return fetchBusinessInsightsFailure(action.payload);
    case TOGGLE_ROTATION:
      return toggleRotation();
    case UPDATE_MAP_LOADED:
      return updateMapLoaded(action.payload);
    default:
      return action;
  }
}

// Export the reducer
export default mapSlice.reducer; 