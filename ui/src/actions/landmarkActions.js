import api from '../services/api';
import {
  fetchLandmarksRequest,
  fetchLandmarksSuccess,
  fetchLandmarksFailure,
  setActiveLandmark,
  setLandmarkFilter,
  setBboxFilter
} from '../reducers/landmarksReducer';
import { setLoading, setError } from '../reducers/uiReducer';

/**
 * Fetch landmarks with optional filters
 * @param {Object} params - Query parameters
 * @returns {Function} - Thunk action
 */
export const fetchLandmarks = (params = {}) => async (dispatch) => {
  dispatch(fetchLandmarksRequest());
  dispatch(setLoading(true));
  
  try {
    const landmarks = await api.getLandmarks(params);
    dispatch(fetchLandmarksSuccess(landmarks));
    dispatch(setError(null));
    return landmarks;
  } catch (error) {
    dispatch(fetchLandmarksFailure(error.message));
    dispatch(setError('Failed to fetch landmarks: ' + error.message));
    return [];
  } finally {
    dispatch(setLoading(false));
  }
};

/**
 * Fetch landmarks within a bounding box
 * @param {Object} bbox - Bounding box coordinates
 * @returns {Function} - Thunk action
 */
export const fetchLandmarksInBBox = (bbox) => async (dispatch) => {
  dispatch(fetchLandmarksRequest());
  dispatch(setLoading(true));
  dispatch(setBboxFilter(bbox));
  
  try {
    const landmarks = await api.getLandmarksInBBox(bbox);
    dispatch(fetchLandmarksSuccess(landmarks));
    dispatch(setError(null));
    return landmarks;
  } catch (error) {
    dispatch(fetchLandmarksFailure(error.message));
    dispatch(setError('Failed to fetch landmarks in bbox: ' + error.message));
    return [];
  } finally {
    dispatch(setLoading(false));
  }
};

/**
 * Select a landmark
 * @param {Object} landmark - Landmark data
 * @returns {Function} - Thunk action
 */
export const selectLandmark = (landmark) => (dispatch) => {
  dispatch(setActiveLandmark(landmark));
};

/**
 * Set landmark filter
 * @param {Object} filter - Filter parameters
 * @returns {Function} - Thunk action
 */
export const updateLandmarkFilter = (filter) => (dispatch) => {
  dispatch(setLandmarkFilter(filter));
};

/**
 * Clear filter and fetch all landmarks
 * @returns {Function} - Thunk action
 */
export const clearFilters = () => (dispatch) => {
  dispatch(setLandmarkFilter({
    geoType: null,
    category: null,
    minScore: 0
  }));
  dispatch(setBboxFilter(null));
  dispatch(fetchLandmarks());
};

/**
 * Fetch heatmap data
 * @param {Object} params - Query parameters
 * @returns {Function} - Thunk action
 */
export const fetchHeatmapData = (params = {}) => async (dispatch) => {
  dispatch(setLoading(true));
  
  try {
    const heatmapData = await api.getHeatmapData(params);
    dispatch(setError(null));
    return heatmapData;
  } catch (error) {
    dispatch(setError('Failed to fetch heatmap data: ' + error.message));
    return [];
  } finally {
    dispatch(setLoading(false));
  }
};

/**
 * Fetch cluster data
 * @param {Object} params - Query parameters
 * @returns {Function} - Thunk action
 */
export const fetchClusters = (params = {}) => async (dispatch) => {
  dispatch(setLoading(true));
  
  try {
    const clusters = await api.getClusters(params);
    dispatch(setError(null));
    return clusters;
  } catch (error) {
    dispatch(setError('Failed to fetch clusters: ' + error.message));
    return { type: 'FeatureCollection', features: [] };
  } finally {
    dispatch(setLoading(false));
  }
}; 