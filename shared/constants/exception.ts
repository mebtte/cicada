export enum ExceptionCode {
  SUCCESS = 0,
  SERVER_ERROR = 1000,
  PARAMETER_ERROR,
  CAPTCHA_ERROR,
  HAS_LOGIN_CODE_ALREADY,
  WRONG_LOGIN_CODE,
  NOT_AUTHORIZE,
  NOT_AUTHORIZE_SUPER,
  EMAIL_EXISTED,
  MUSICBILL_NOT_EXIST,
  MUSIC_NOT_EXIST,
  MUSIC_IN_MUSICBILL_ALREADY,
  MUSIC_NOT_IN_MUSICBILL,
  ASSET_OVER_MAX_SIZE,
  WRONG_ASSET_ACCEPT_TYPES,
  MUSIC_LRC_NOT_EXIST,
}

export const EXCEPTION_CODE_MAP: Record<
  ExceptionCode,
  {
    description: string;
  }
> = {
  [ExceptionCode.SUCCESS]: {
    description: '成功',
  },
  [ExceptionCode.SERVER_ERROR]: {
    description: '服务器错误',
  },
  [ExceptionCode.PARAMETER_ERROR]: {
    description: '参数错误',
  },
  [ExceptionCode.CAPTCHA_ERROR]: {
    description: '图形验证码错误',
  },
  [ExceptionCode.HAS_LOGIN_CODE_ALREADY]: {
    description: '已经获取过登录验证码',
  },
  [ExceptionCode.WRONG_LOGIN_CODE]: {
    description: '错误的登录验证码',
  },
  [ExceptionCode.NOT_AUTHORIZE]: {
    description: '未验证权限',
  },
  [ExceptionCode.NOT_AUTHORIZE_SUPER]: {
    description: '未验证超级权限',
  },
  [ExceptionCode.EMAIL_EXISTED]: {
    description: '邮箱已注册',
  },
  [ExceptionCode.MUSICBILL_NOT_EXIST]: {
    description: '歌单不存在',
  },
  [ExceptionCode.MUSIC_NOT_EXIST]: {
    description: '音乐不存在',
  },
  [ExceptionCode.MUSIC_IN_MUSICBILL_ALREADY]: {
    description: '音乐已在歌单中',
  },
  [ExceptionCode.MUSIC_NOT_IN_MUSICBILL]: {
    description: '音乐不存在歌单中',
  },
  [ExceptionCode.ASSET_OVER_MAX_SIZE]: {
    description: '资源过大',
  },
  [ExceptionCode.WRONG_ASSET_ACCEPT_TYPES]: {
    description: '错误的资源类型',
  },
  [ExceptionCode.MUSIC_LRC_NOT_EXIST]: {
    description: '音乐未收录歌词',
  },
};
