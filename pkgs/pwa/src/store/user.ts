import day from '@/utils/day';
import getRandomCover from '@/utils/get_random_cover';
import { USER } from '../constants/storage_key';
import * as TYPE from './action_type';
import { getToken, clearToken } from '../platform/token';
import { User } from '../constants/user';
import getUser from '../server/get_user';
import logger from '../platform/logger';
import dialog from '../platform/dialog';

type ApiUser = AsyncReturnType<typeof getUser>;

export const setUser = (apiUser: ApiUser) => (dispatch) => {
  const joinTime = new Date(apiUser.join_time);
  const user: User = {
    id: apiUser.id,
    email: apiUser.email,
    avatar: apiUser.avatar || getRandomCover(),
    nickname: apiUser.nickname,
    condition: apiUser.condition,
    cms: !!apiUser.cms,
    joinTime,
    joinTimeString: day(joinTime).format('YYYY-MM-DD HH:mm'),
  };
  localStorage.setItem(USER, JSON.stringify(user));
  dispatch({
    type: TYPE.SET_USER,
    payload: user,
  });
};

export const reloadUser = () => async (dispatch) =>
  getUser()
    .then((user) => dispatch(setUser(user)))
    .catch((error) => {
      logger.error(error, {
        description: '加载用户信息失败',
        report: true,
      });
      dialog.alert({
        title: '加载用户信息失败',
        content: error.message,
      });
    });

export const clearUser = () => (dispatch) => {
  clearToken();
  return dispatch({
    type: TYPE.CLEAR_USER,
  });
};

const token = getToken();
let user: User | null = null;
if (token) {
  try {
    user = JSON.parse(localStorage.getItem(USER));
    user.joinTime = new Date(user.joinTime);
  } catch (error) {
    logger.error(error, {
      description: '解析本地用户信息失败',
    });
  }
}

export default (state: User | null = user, { type, payload }): User | null => {
  switch (type) {
    case TYPE.SET_USER:
      return payload;
    case TYPE.CLEAR_USER:
      return null;
    default:
      return state;
  }
};
