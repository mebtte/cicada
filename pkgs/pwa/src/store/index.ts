import { createStore, combineReducers, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';

import user from './user';
import globalShortcut from './global_shortcut';

const store = createStore(
  combineReducers({
    user,
    globalShortcut,
  }),
  process.env.NODE_ENV === 'production'
    ? applyMiddleware(thunk)
    : composeWithDevTools(applyMiddleware(thunk)),
);

export default store;
