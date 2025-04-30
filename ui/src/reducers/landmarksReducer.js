// Action types
const FETCH_LANDMARKS_REQUEST = 'FETCH_LANDMARKS_REQUEST';
const FETCH_LANDMARKS_SUCCESS = 'FETCH_LANDMARKS_SUCCESS';
const FETCH_LANDMARKS_FAILURE = 'FETCH_LANDMARKS_FAILURE';
const SET_ACTIVE_LANDMARK = 'SET_ACTIVE_LANDMARK';
const SET_LANDMARK_FILTER = 'SET_LANDMARK_FILTER';
const SET_BBOX_FILTER = 'SET_BBOX_FILTER';

// Initial state
const initialState = {
  loading: false,
  data: [],
  error: null,
  activeLandmark: null,
  filter: {
    geoType: null,
    category: null,
    minScore: 0
  },
  bbox: null
};

// Landmarks reducer
export default function landmarksReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_LANDMARKS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case FETCH_LANDMARKS_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null
      };
    
    case FETCH_LANDMARKS_FAILURE:
      return {
        ...state,
        loading: false,
        data: [],
        error: action.payload
      };
    
    case SET_ACTIVE_LANDMARK:
      return {
        ...state,
        activeLandmark: action.payload
      };
    
    case SET_LANDMARK_FILTER:
      return {
        ...state,
        filter: {
          ...state.filter,
          ...action.payload
        }
      };
    
    case SET_BBOX_FILTER:
      return {
        ...state,
        bbox: action.payload
      };
    
    default:
      return state;
  }
}

// Action creators
export const fetchLandmarksRequest = () => ({
  type: FETCH_LANDMARKS_REQUEST
});

export const fetchLandmarksSuccess = (landmarks) => ({
  type: FETCH_LANDMARKS_SUCCESS,
  payload: landmarks
});

export const fetchLandmarksFailure = (error) => ({
  type: FETCH_LANDMARKS_FAILURE,
  payload: error
});

export const setActiveLandmark = (landmark) => ({
  type: SET_ACTIVE_LANDMARK,
  payload: landmark
});

export const setLandmarkFilter = (filter) => ({
  type: SET_LANDMARK_FILTER,
  payload: filter
});

export const setBboxFilter = (bbox) => ({
  type: SET_BBOX_FILTER,
  payload: bbox
}); 