export enum ExceptionCode {
  SUCCESS,
  SERVER_ERROR,
  PARAMETER_ERROR,
  CAPTCHA_ERROR,
  GET_EMAIL_CODE_TOO_FREQUENT,
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
  [ExceptionCode.GET_EMAIL_CODE_TOO_FREQUENT]: {
    description: '获取邮箱验证码过于频繁',
  },
};
