import {
  setViewport,
  changeMapStyle as changeMapStyleReducer,
  updateMapLoaded as updateMapLoadedReducer,
  toggleLayer as toggleLayerReducer
} from '../reducers/mapReducer';

// Action types
export const UPDATE_VIEWPORT = 'UPDATE_VIEWPORT';
export const CHANGE_MAP_STYLE = 'CHANGE_MAP_STYLE';
export const UPDATE_MAP_LOADED = 'UPDATE_MAP_LOADED';
export const TOGGLE_LAYER = 'TOGGLE_LAYER';
export const SET_LAYER_VISIBILITY = 'SET_LAYER_VISIBILITY';
export const FLY_TO_LOCATION = 'FLY_TO_LOCATION';
export const FIT_BOUNDS = 'FIT_BOUNDS';
export const TOGGLE_ROTATION = 'TOGGLE_ROTATION';
export const FETCH_BUSINESS_INSIGHTS_REQUEST = 'FETCH_BUSINESS_INSIGHTS_REQUEST';
export const FETCH_BUSINESS_INSIGHTS_SUCCESS = 'FETCH_BUSINESS_INSIGHTS_SUCCESS';
export const FETCH_BUSINESS_INSIGHTS_FAILURE = 'FETCH_BUSINESS_INSIGHTS_FAILURE';

/**
 * Update map viewport
 * @param {Object} viewport - New viewport settings
 * @returns {Function} - Thunk action
 */
export const updateViewport = (viewport) => ({
  type: 'map/setViewport',
  payload: viewport
});

/**
 * Change the map style
 * @param {string} style - Map style URL
 * @returns {Function} - Thunk action
 */
export const changeMapStyle = (style) => ({
  type: 'map/setMapStyle',
  payload: style
});

/**
 * Set map as loaded
 * @param {boolean} loaded - Map loaded state
 * @returns {Function} - Thunk action
 */
export const updateMapLoaded = (loaded) => ({
  type: 'map/updateMapLoaded',
  payload: loaded
});

/**
 * Toggle a map layer
 * @param {string} layerName - Name of the layer to toggle
 * @returns {Function} - Thunk action
 */
export const toggleLayer = (layerName, visible) => ({
  type: 'map/toggleLayer',
  payload: { layerName, visible }
});

/**
 * Set all layer visibility
 * @param {Object} layers - Layer visibility settings
 * @returns {Function} - Thunk action
 */
export const setLayerVisibility = (layers) => ({
  type: 'map/setLayerVisibility',
  payload: layers
});

/**
 * Fly to a specific location
 * @param {Object} location - Location with lat, lng, zoom
 * @returns {Function} - Thunk action
 */
export const flyToLocation = (location) => ({
  type: 'map/flyToLocation',
  payload: location
});

/**
 * Fit map to bounds
 * @param {Array} bounds - Bounds as [[minLng, minLat], [maxLng, maxLat]]
 * @returns {Function} - Thunk action
 */
export const fitBounds = (bounds) => ({
  type: 'map/fitBounds',
  payload: bounds
});

/**
 * Toggle map rotation functionality
 * @returns {Object} Action object
 */
export const toggleRotation = () => ({
  type: 'map/toggleRotation'
});

export const setLandmarks = (landmarks) => ({
  type: 'map/setLandmarks',
  payload: landmarks
});

export const fetchBusinessInsights = (bbox) => async (dispatch) => {
  dispatch({ type: FETCH_BUSINESS_INSIGHTS_REQUEST });
  console.log("fetchBusinessInsights action with bbox:", bbox);
  
  try {
    const response = await fetch('/api/v1/landmarks/business-insights/bbox', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bbox),
    });
    
    console.log("API response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`Error fetching business insights: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("API response data:", data);
    console.log("Summary data:", data.summary);
    console.log("Industry breakdown:", data.industry_breakdown);
    console.log("Hotspots:", data.hotspots);
    
    dispatch({ 
      type: FETCH_BUSINESS_INSIGHTS_SUCCESS, 
      payload: data 
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching business insights:', error);
    dispatch({ 
      type: FETCH_BUSINESS_INSIGHTS_FAILURE, 
      payload: error.message 
    });
    
    throw error;
  }
}; 