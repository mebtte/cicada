export const REMARK_MAX_LENGTH = 256;
export const NICKNAME_MAX_LENGTH = 64;

export enum AllowUpdateKey {
  AVATAR = 'avatar',
  NICKNAME = 'nickname',
  MUSICBILL_ORDERS = 'musicbill_orders',
}

export enum AdminAllowUpdateKey {
  EMAIL = 'email',
  REMARK = 'remark',
  MUSICBILL_MAX_AMOUNT = 'musicbillMaxAmount',
  CREATE_MUSIC_MAX_AMOUNT_PER_DAY = 'createMusicMaxAmountPerDay',
  MUSIC_PLAY_RECORD_INDATE = 'musicPlayRecordIndate',
}
