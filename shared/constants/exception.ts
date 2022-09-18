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
  ASSET_NOT_EXIST,
  FORBID_EXPORT_EMPTY_MUSICBILL,
  OVER_EXPORT_MUSICBILL_TIMES_PER_DAY,
  SINGER_NOT_EXIST,
  OVER_UPLOAD_MUSIC_TIMES_PER_DAY,
  INSTRUMENT_NO_LYRIC,
  SINGER_EXIST,
  NO_NEED_TO_UPDATE,
  ALIAS_OVER_MAX_LENGTH,
  REPEATED_ALIAS,
  NICKNAME_EXIST,
  USER_NOT_EXIST,
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
    description: '乐单不存在',
  },
  [ExceptionCode.MUSIC_NOT_EXIST]: {
    description: '音乐不存在',
  },
  [ExceptionCode.MUSIC_IN_MUSICBILL_ALREADY]: {
    description: '音乐已在乐单中',
  },
  [ExceptionCode.MUSIC_NOT_IN_MUSICBILL]: {
    description: '音乐不存在乐单中',
  },
  [ExceptionCode.ASSET_OVER_MAX_SIZE]: {
    description: '资源过大',
  },
  [ExceptionCode.WRONG_ASSET_ACCEPT_TYPES]: {
    description: '错误的资源类型',
  },
  [ExceptionCode.ASSET_NOT_EXIST]: {
    description: '资源不存在',
  },
  [ExceptionCode.FORBID_EXPORT_EMPTY_MUSICBILL]: {
    description: '无法导出空的乐单',
  },
  [ExceptionCode.OVER_EXPORT_MUSICBILL_TIMES_PER_DAY]: {
    description: '超出每天导出乐单最大次数',
  },
  [ExceptionCode.SINGER_NOT_EXIST]: {
    description: '歌手不存在',
  },
  [ExceptionCode.OVER_UPLOAD_MUSIC_TIMES_PER_DAY]: {
    description: '超出每天上传音乐最大次数',
  },
  [ExceptionCode.INSTRUMENT_NO_LYRIC]: {
    description: '乐曲没有歌词',
  },
  [ExceptionCode.SINGER_EXIST]: {
    description: '歌手已存在',
  },
  [ExceptionCode.NO_NEED_TO_UPDATE]: {
    description: '无需更新',
  },
  [ExceptionCode.ALIAS_OVER_MAX_LENGTH]: {
    description: '别名超过最大长度',
  },
  [ExceptionCode.REPEATED_ALIAS]: {
    description: '重复的别名',
  },
  [ExceptionCode.NICKNAME_EXIST]: {
    description: '昵称已被占用',
  },
  [ExceptionCode.USER_NOT_EXIST]: {
    description: '用户不存在',
  },
};
