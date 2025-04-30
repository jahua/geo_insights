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
  center: [8.2275, 46.8182], // Switzerland center
  zoom: 7,
  mapStyle: 'mapbox://styles/mapbox/light-v10',
  isMapLoaded: false,
  visibleLayers: {
    landmarks: true,
    boundaries: true,
    ticino: false,
    tourismRegions: false
  },
  is3DMode: false,
  isRotating: false,
  rotationSpeed: 0.5,
  pitch: 60,
  bearing: 0,
  landmarks: [],
  loading: false,
  error: null
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
      state.isMapLoaded = action.payload;
    },
    
    // Layer visibility actions
    toggleLayer: (state, action) => {
      const { layerName, visible } = action.payload;
      if (typeof visible === 'boolean') {
        state.visibleLayers[layerName] = visible;
      } else {
        state.visibleLayers[layerName] = !state.visibleLayers[layerName];
      }
    },
    
    setLayerVisibility: (state, action) => {
      state.visibleLayers = { ...action.payload };
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
      state.is3DMode = !state.is3DMode;
    },
    
    toggleRotation: (state) => {
      state.isRotating = !state.isRotating;
    },
    
    // Reset map view
    resetMapView: (state) => {
      state.center = initialState.center;
      state.zoom = initialState.zoom;
      state.is3DMode = initialState.is3DMode;
      state.pitch = initialState.pitch;
      state.bearing = initialState.bearing;
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
    },
    setLandmarks: (state, action) => {
      state.landmarks = action.payload;
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
  fetchBusinessInsightsFailure,
  setLandmarks
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