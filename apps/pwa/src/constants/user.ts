export const REMARK_MAX_LENGTH = 256;
export const NICKNAME_MAX_LENGTH = 32;
export const USERNAME_MAX_LENGTH = 16;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 32;

export function isPasswordLengthValid(password: string) {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH
  );
}

export enum AllowUpdateKey {
  AVATAR = 'avatar',
  NICKNAME = 'nickname',
  MUSICBILL_ORDERS = 'musicbillOrders',
  PASSWORD = 'password',
}

export enum AdminAllowUpdateKey {
  USERNAME = 'username',
  REMARK = 'remark',
  PASSWORD = 'password',
}
