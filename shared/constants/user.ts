export const REMARK_MAX_LENGTH = 256;
export const NICKNAME_MAX_LENGTH = 64;

export enum AllowUpdateKey {
  AVATAR = 'avatar',
  NICKNAME = 'nickname',
  MUSICBILL_ORDERS = 'musicbill_orders',
}

export enum AdminAllowUpdateKey {
  USERNAME = 'username',
  REMARK = 'remark',
  MUSICBILL_MAX_AMOUNT = 'musicbillMaxAmount',
  CREATE_MUSIC_MAX_AMOUNT_PER_DAY = 'createMusicMaxAmountPerDay',
  MUSIC_PLAY_RECORD_INDATE = 'musicPlayRecordIndate',
}

export const USERNAME_MIN_LENGTH = 1;
export const USERNAME_MAX_LENGTH = 16;
