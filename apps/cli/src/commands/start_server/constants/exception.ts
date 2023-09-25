import { ExceptionCode } from '#/constants/exception';
import { Key } from '@/i18n';

export const EXCEPTION_CODE_MAP_KEY: Record<ExceptionCode, Key> = {
  [ExceptionCode.SUCCESS]: 'success',
  [ExceptionCode.SERVER_ERROR]: 'server_error',
  [ExceptionCode.PARAMETER_ERROR]: 'parameter_error',
  [ExceptionCode.CAPTCHA_ERROR]: 'captcha_error',
  [ExceptionCode.NOT_AUTHORIZED]: 'not_authorized',
  [ExceptionCode.NOT_AUTHORIZED_FOR_ADMIN]: 'not_authorized_for_admin',
  [ExceptionCode.USERNAME_ALREADY_REGISTERED]: 'username_already_registered',
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
  [ExceptionCode.ALIAS_OVER_MAX_LENGTH]: 'alias_over_max_length',
  [ExceptionCode.REPEATED_ALIAS]: 'repeated_alias',
  [ExceptionCode.NICKNAME_HAS_USED_BY_OTHERS]: 'nickname_has_used_by_others',
  [ExceptionCode.USER_NOT_EXISTED]: 'user_not_existed',
  [ExceptionCode.MUSIC_FORKED_BY_OTHER_CAN_NOT_BE_DELETED]:
    'music_forked_by_other_can_not_be_deleted',
  [ExceptionCode.CAN_NOT_COLLECT_MUSICBILL_REPEATLY]:
    'can_not_collect_musicbill_repeatly',
  [ExceptionCode.MUSICBILL_NOT_COLLECTED]: 'musicbill_not_collected',
  [ExceptionCode.OVER_USER_MUSICBILL_MAX_AMOUNT]:
    'over_user_musicbill_max_amount',
  [ExceptionCode.CAN_NOT_DELETE_ADMIN]: 'can_not_delete_admin',
  [ExceptionCode.USER_IS_ADMIN_ALREADY]: 'user_is_admin_already',
  [ExceptionCode.MUSIC_PLAY_RECORD_NOT_EXISTED]:
    'music_play_record_not_existed',
  [ExceptionCode.CAN_NOT_INVITE_MUSICBILL_OWNER]:
    'can_not_invite_musicbill_owner',
  [ExceptionCode.REPEATED_SHARED_MUSICBILL_INVITATION]:
    'repeated_shared_musicbill_invitation',
  [ExceptionCode.NO_PERMISSION_TO_DELETE_MUSICBILL_SHARED_USER]:
    'no_permission_to_delete_musicbill_shared_user',
  [ExceptionCode.SHARED_MUSICBILL_INVITATION_NOT_EXISTED]:
    'shared_musicbill_invitation_not_existed',
  [ExceptionCode.WRONG_USERNAME_OR_PASSWORD]: 'wrong_username_or_password',
};
