// Action types
const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';
const SET_THEME_MODE = 'SET_THEME_MODE';
const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB';
const SET_VISUALIZATION_MODE = 'SET_VISUALIZATION_MODE';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';

// Initial state
const initialState = {
  sidebarOpen: true,
  themeMode: 'dark',
  activeTab: 'map',
  visualizationMode: 'standard', // standard or 3d
  loading: false,
  error: null
};

// UI reducer
export default function uiReducer(state = initialState, action) {
  switch (action.type) {
    case TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: action.payload !== undefined ? action.payload : !state.sidebarOpen
      };
    
    case SET_THEME_MODE:
      return {
        ...state,
        themeMode: action.payload
      };
    
    case SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload
      };
    
    case SET_VISUALIZATION_MODE:
      return {
        ...state,
        visualizationMode: action.payload
      };
    
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    
    default:
      return state;
  }
}

// Action creators
export const toggleSidebar = (isOpen) => ({
  type: TOGGLE_SIDEBAR,
  payload: isOpen
});

export const setThemeMode = (mode) => ({
  type: SET_THEME_MODE,
  payload: mode
});

export const setActiveTab = (tab) => ({
  type: SET_ACTIVE_TAB,
  payload: tab
});

export const setVisualizationMode = (mode) => ({
  type: SET_VISUALIZATION_MODE,
  payload: mode
});

export const setLoading = (isLoading) => ({
  type: SET_LOADING,
  payload: isLoading
});

export const setError = (error) => ({
  type: SET_ERROR,
  payload: error
}); 