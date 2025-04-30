import api from '../services/api';
import { setLoading, setError } from '../reducers/uiReducer';

// Action types
export const CHAT_SEND_MESSAGE = 'CHAT_SEND_MESSAGE';
export const CHAT_RECEIVE_MESSAGE = 'CHAT_RECEIVE_MESSAGE';
export const CHAT_SET_HISTORY = 'CHAT_SET_HISTORY';
export const CHAT_CLEAR_HISTORY = 'CHAT_CLEAR_HISTORY';
export const CHAT_SET_LOADING = 'CHAT_SET_LOADING';
export const CHAT_SET_ERROR = 'CHAT_SET_ERROR';
export const CHAT_SET_VISUALIZATION = 'CHAT_SET_VISUALIZATION';

// Action creators
export const sendMessage = (message) => ({
  type: CHAT_SEND_MESSAGE,
  payload: message
});

export const receiveMessage = (message) => ({
  type: CHAT_RECEIVE_MESSAGE,
  payload: message
});

export const setHistory = (history) => ({
  type: CHAT_SET_HISTORY,
  payload: history
});

export const clearHistory = () => ({
  type: CHAT_CLEAR_HISTORY
});

export const setChatLoading = (loading) => ({
  type: CHAT_SET_LOADING,
  payload: loading
});

export const setChatError = (error) => ({
  type: CHAT_SET_ERROR,
  payload: error
});

export const setChatVisualization = (visualization) => ({
  type: CHAT_SET_VISUALIZATION,
  payload: visualization
});

/**
 * Send a message to the LLM and get a response
 * @param {string} content - User message content
 * @param {Object} spatialContext - Optional spatial context
 * @param {boolean} includeVisualization - Whether to include visualization data
 * @returns {Function} - Thunk action
 */
export const sendMessageToLLM = (content, spatialContext = null, includeVisualization = false) => async (dispatch, getState) => {
  const userMessage = {
    role: 'user',
    content
  };
  
  // Add user message to chat history
  dispatch(sendMessage(userMessage));
  dispatch(setChatLoading(true));
  dispatch(setLoading(true));
  
  try {
    // Get chat history from state
    const { chat } = getState();
    const messages = [...(chat.history || []), userMessage];
    
    // Prepare request payload
    const payload = {
      messages,
      spatial_context: spatialContext,
      include_visualization: includeVisualization
    };
    
    // Call API
    const response = await api.chatWithGeoInsights(payload);
    
    // Process response
    dispatch(receiveMessage(response.message));
    
    // Set visualization data if available
    if (response.visualization) {
      dispatch(setChatVisualization(response.visualization));
    }
    
    dispatch(setChatError(null));
    dispatch(setError(null));
    
    return response;
  } catch (error) {
    const errorMessage = {
      role: 'assistant',
      content: 'Sorry, there was an error processing your request. Please try again.'
    };
    
    dispatch(receiveMessage(errorMessage));
    dispatch(setChatError(error.message));
    dispatch(setError('Chat error: ' + error.message));
    
    return { message: errorMessage };
  } finally {
    dispatch(setChatLoading(false));
    dispatch(setLoading(false));
  }
};

/**
 * Execute a spatial query using natural language
 * @param {string} query - Natural language query
 * @param {boolean} includeGeojson - Whether to include GeoJSON in the response
 * @returns {Function} - Thunk action
 */
export const executeSpatialQuery = (query, includeGeojson = true) => async (dispatch) => {
  dispatch(setLoading(true));
  
  try {
    const response = await api.spatialQuery({
      query,
      include_geojson: includeGeojson
    });
    
    dispatch(setError(null));
    return response;
  } catch (error) {
    dispatch(setError('Spatial query error: ' + error.message));
    return { answer: 'Error executing query', error: error.message };
  } finally {
    dispatch(setLoading(false));
  }
}; 