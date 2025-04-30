import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
// import { keplerGlReducer } from '@kepler.gl/reducers'; // Removed Kepler.gl

// Application reducers
import mapReducer from './reducers/mapReducer';
import landmarksReducer from './reducers/landmarksReducer';
import uiReducer from './reducers/uiReducer';
import chatReducer from './reducers/chatReducer';

// Combine all reducers
const rootReducer = combineReducers({
  // Kepler.gl reducer - Removed
  // keplerGl: keplerGlReducer,
  
  // Custom application reducers
  map: mapReducer,
  landmarks: landmarksReducer,
  ui: uiReducer,
  chat: chatReducer
});

// Create the Redux store with thunk middleware
const store = createStore(
  rootReducer,
  applyMiddleware(thunk)
);

export default store; 