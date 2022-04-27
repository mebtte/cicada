import { State } from './constants';
import {
  GLOBAL_SHORTCUT,
  GLOBAL_SHORTCUT_MAP_STORAGE_KEY,
} from '../../constants/global_shortcut';
import {
  GLOBAL_SHORTCUT_REGISTER_ALL,
  GLOBAL_SHORTCUT_UNREGISTER_ALL,
  GLOBAL_SHORTCUT_SET_KEYS,
} from '../action_type';

export const registerAll = () => ({ type: GLOBAL_SHORTCUT_REGISTER_ALL });

export const unregisterAll = () => ({ type: GLOBAL_SHORTCUT_UNREGISTER_ALL });

export const setShortcutKeys = (
  shortcut: ValueOf<typeof GLOBAL_SHORTCUT>,
  keys: string[],
) => (dispatch) => {
  localStorage.setItem(
    GLOBAL_SHORTCUT_MAP_STORAGE_KEY[shortcut],
    keys.join(','),
  );
  dispatch({
    type: GLOBAL_SHORTCUT_SET_KEYS,
    payload: {
      shortcut,
      keys,
    },
  });
};

const initialState: State = {
  on: true,
};
Object.values(GLOBAL_SHORTCUT).forEach((globalShortcut) => {
  const keys = localStorage.getItem(
    GLOBAL_SHORTCUT_MAP_STORAGE_KEY[globalShortcut],
  );
  initialState[globalShortcut] = keys ? keys.split(',') : [];
});

export default (state: State = initialState, { type, payload }): State => {
  switch (type) {
    case GLOBAL_SHORTCUT_REGISTER_ALL:
      return {
        ...state,
        on: true,
      };
    case GLOBAL_SHORTCUT_UNREGISTER_ALL:
      return {
        ...state,
        on: false,
      };
    case GLOBAL_SHORTCUT_SET_KEYS: {
      const { shortcut, keys } = payload;
      return {
        ...state,
        [shortcut]: keys,
      };
    }
    default:
      return state;
  }
};
