import {
  CHAT_SEND_MESSAGE,
  CHAT_RECEIVE_MESSAGE,
  CHAT_SET_HISTORY,
  CHAT_CLEAR_HISTORY,
  CHAT_SET_LOADING,
  CHAT_SET_ERROR,
  CHAT_SET_VISUALIZATION
} from '../actions/chatActions';

// Initial state
const initialState = {
  history: [],
  loading: false,
  error: null,
  visualization: null
};

// Chat reducer
export default function chatReducer(state = initialState, action) {
  switch (action.type) {
    case CHAT_SEND_MESSAGE:
      return {
        ...state,
        history: [...state.history, action.payload]
      };
    
    case CHAT_RECEIVE_MESSAGE:
      return {
        ...state,
        history: [...state.history, action.payload]
      };
    
    case CHAT_SET_HISTORY:
      return {
        ...state,
        history: action.payload
      };
    
    case CHAT_CLEAR_HISTORY:
      return {
        ...state,
        history: [],
        visualization: null
      };
    
    case CHAT_SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case CHAT_SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
    
    case CHAT_SET_VISUALIZATION:
      return {
        ...state,
        visualization: action.payload
      };
    
    default:
      return state;
  }
} 