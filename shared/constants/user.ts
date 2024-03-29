export const REMARK_MAX_LENGTH = 256;
export const NICKNAME_MAX_LENGTH = 32;
export const USERNAME_MAX_LENGTH = 16;
export const PASSWORD_MAX_LENGTH = 24;

export enum AllowUpdateKey {
  AVATAR = 'avatar',
  NICKNAME = 'nickname',
  MUSICBILL_ORDERS = 'musicbill_orders',
  PASSWORD = 'password',
}

export enum AdminAllowUpdateKey {
  USERNAME = 'username',
  REMARK = 'remark',
  MUSICBILL_MAX_AMOUNT = 'musicbillMaxAmount',
  CREATE_MUSIC_MAX_AMOUNT_PER_DAY = 'createMusicMaxAmountPerDay',
  MUSIC_PLAY_RECORD_INDATE = 'musicPlayRecordIndate',
  PASSWORD = 'password',
}
