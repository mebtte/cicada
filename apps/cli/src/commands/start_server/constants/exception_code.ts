import { ExceptionCode } from '#/constants/exception';
import { Key } from '@/i18n';

export const EXCEPTION_CODE_MAP_KEY: Record<ExceptionCode, Key> = {
  [ExceptionCode.SUCCESS]: 'success',
  [ExceptionCode.SERVER_ERROR]: 'server_error',
  [ExceptionCode.PARAMETER_ERROR]: 'parameter_error',
  [ExceptionCode.CAPTCHA_ERROR]: 'captcha_error',
  [ExceptionCode.ALREADY_GOT_LOGIN_CODE_BEFORE]:
    'already_got_login_code_before',
  [ExceptionCode.WRONG_LOGIN_CODE]: 'wrong_login_code',
  [ExceptionCode.NOT_AUTHORIZED]: 'not_authorized',
  [ExceptionCode.NOT_AUTHORIZED_FOR_ADMIN]: 'not_authorized_for_admin',
  [ExceptionCode.EMAIL_ALREADY_REGISTERED]: 'email_already_registered',
  [ExceptionCode.MUSICBILL_NOT_EXISTED]: 'musicbill_not_existed',
  [ExceptionCode.MUSIC_NOT_EXISTED]: 'music_not_existed',
  [ExceptionCode.MUSIC_ALREADY_EXISTED_IN_MUSICBILL]:
    'music_already_existed_in_musicbill',
  [ExceptionCode.MUSIC_NOT_EXISTED_IN_MUSICBILL]:
    'music_not_existed_in_musicbill',
  [ExceptionCode.ASSET_OVERSIZE]: 'asset_oversize',
  [ExceptionCode.WRONG_ASSET_TYPE]: 'wrong_asset_type',
  [ExceptionCode.ASSET_NOT_EXISTED]: 'asset_not_existed',
  [ExceptionCode.SINGER_NOT_EXISTED]: 'singer_not_existed',
  [ExceptionCode.OVER_CREATE_MUSIC_TIMES_PER_DAY]:
    'over_create_music_times_per_day',
  [ExceptionCode.INSTRUMENTAL_HAS_NO_LYRIC]: 'instrumental_has_no_lyric',
  [ExceptionCode.SINGER_ALREADY_EXISTED]: 'singer_already_existed',
  [ExceptionCode.NO_NEED_TO_UPDATE]: 'no_need_to_update',
};

//   [ExceptionCode.ALIAS_OVER_MAX_LENGTH]: {
//     description: '别名超过最大长度',
//   },
//   [ExceptionCode.REPEATED_ALIAS]: {
//     description: '重复的别名',
//   },
//   [ExceptionCode.NICKNAME_EXIST]: {
//     description: '昵称已被占用',
//   },
//   [ExceptionCode.USER_NOT_EXIST]: {
//     description: '用户不存在',
//   },
//   [ExceptionCode.MUSIC_HAS_FORK_AND_CAN_NOT_BE_DELETED]: {
//     description: '音乐被二次创作无法被删除',
//   },
//   [ExceptionCode.COLLECT_MUSICBILL_REPEATLY]: {
//     description: '重复收藏乐单',
//   },
//   [ExceptionCode.NOT_COLLECT_MUSICBILL_YET]: {
//     description: '未收藏该乐单',
//   },
//   [ExceptionCode.OVER_USER_MUSICBILL_MAX_AMOUNT]: {
//     description: '超过用户乐单数量最大限制',
//   },
//   [ExceptionCode.MUSIC_COVER_NOT_EXIST]: {
//     description: '音乐封面不存在',
//   },
//   [ExceptionCode.ADMIN_USER_CAN_NOT_BE_DELETED]: {
//     description: '管理员用户无法被删除',
//   },
//   [ExceptionCode.USER_IS_ADMIN_ALREADY]: {
//     description: '用户已经是管理员',
//   },
//   [ExceptionCode.MUSIC_PLAY_RECORD_NOT_EXIST]: {
//     description: '音乐播放记录不存在',
//   },
//   [ExceptionCode.SHARED_MUSICBILL_CAN_NOT_INVITE_OWNER]: {
//     description: '无法邀请乐单拥有者',
//   },
//   [ExceptionCode.SHARED_MUSICBILL_CAN_NOT_INVITE_REPEATLY]: {
//     description: '重复的乐单共享邀请',
//   },
//   [ExceptionCode.NO_PERMISSION_TO_DELETE_MUSICBILL_SHARED_USER]: {
//     description: '没有权限删除乐单共享用户',
//   },
//   [ExceptionCode.SHARED_MUSICBILL_INVITATION_NOT_EXIST]: {
//     description: '共享乐单邀请不存在',
//   },
