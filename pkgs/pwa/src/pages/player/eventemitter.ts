import Eventemitter from 'eventemitter3';

export enum EventType {
  AUDIO_WAITING = 'audio_waiting', // 音频加载中
  AUDIO_CAN_PLAY_THROUGH = 'audio_can_play_through', // 音频可以播放
  AUDIO_PLAY = 'audio_play', // 音频播放
  AUDIO_PAUSE = 'audio_pause', // 音频暂停
  AUDIO_TIME_UPDATED = 'audio_time_updated', // 音频当前时间更新 { currentMillisecond: number }
  AUDIO_ERROR = 'audio_error', // 音频发生错误

  ACTION_TOGGLE_PLAY = 'action_toggle_play', // 播放/暂停, { }
  ACTION_PLAY = 'action_play', // 播放, { }
  ACTION_PAUSE = 'action_pause', // 暂停, { }
  ACTION_SET_TIME = 'action_set_time', // 跳转时间, { second: number }
  ACTION_PREVIOUS = 'action_previous', // 上一首
  ACTION_NEXT = 'action_next', // 下一首
  ACTION_PLAY_MUSIC = 'action_play_music', // 播放指定音乐
  ACTION_ADD_MUSIC_LIST_TO_PLAYLIST = 'action_add_music_list_to_playlist', // 添加音乐列表到播放列表, { musicList: Music[] }
  ACTION_INSERT_MUSIC_TO_PLAYQUEUE = 'action_insert_music_to_playqueue',
  ACTION_PLAY_PLAYQUEUE_INDEX = 'action_playqueue_index',
  ACTION_CLEAR_PLAYLIST = 'action_clear_playlist',
  ACTION_REMOVE_PLAYLIST_MUSIC = 'action_remove_playlist_music',
  ACTION_REMOVE_PLAYQUEUE_MUSIC = 'action_remove_playqueue_music',
  ACTION_MOVE_PLAYQUEUE_MUSIC_LATER = 'action_move_playqueue_music_LATER',
  ACTION_MOVE_PLAYQUEUE_MUSIC_EARLY = 'action_move_playqueue_music_EARLY',

  ACTION_UPDATE_VOLUME = 'action_update_volume', // 调整音量

  RELOAD_MUSICBILL_LIST = 'update_musicbill_list', // 重新获取歌单列表, { }
  FETCH_MUSICBILL = 'fetch_musicbill', // 获取歌单 { id: string }
  ADD_MUSIC_TO_MUSICBILL = 'add_music_to_musicbill', // 添加音乐到歌单
  REMOVE_MUSIC_FROM_MUSICBILL = 'remove_music_from_musicbill', // 从歌单移除音乐

  CHANGE_PLAY_MODE = 'change_play_mode', // 更换播放模式

  TOGGEL_LYRIC = 'toggle_lyric', // 打开/关闭歌词, { }
  CLOSE_LYRIC = 'close_lyric', // 关闭歌词, { }

  OPEN_CREATE_MUSICBILL_DIALOG = 'open_create_musicbill_dialog',
  OPEN_MUSIC_OPERATE_POPUP = 'open_music_operate_popup',
  OPEN_MUSICBILL_LIST_DRAWER = 'open_musicbill_list_drawer',
  OPEN_SINGER_DRAWER = 'open_singer_drawer', // 打开歌手面板, { id: string }
  OPEN_MUSIC_DRAWER = 'open_music_drawer', // 打开音乐面板, { id: string }
  OPEN_USER_DRAWER = 'open_user_drawer', // 打开用户面板, { id: string }
  OPEN_ORIGINAL_MUSIC_DIALOG = 'open_original_music_dialog',
  OPEN_MUSICBILL_ORDER_DRAWER = 'open_musicbill_order_drawer',
  OPEN_PLAYLIST_PLAYQUEUE_DRAWER = 'open_playlist_playqueue_drawer',
  TOGGLE_PLAYLIST_PLAYQUEUE_DRAWER = 'toggle_playlist_playqueue_drawer',

  MUSICBILL_CREATED = 'musicbill_created', // 歌单已创建, { id: string }
  MUSICBILL_UPDATED = 'musicbill_updated', // 歌单已更新, { id: string }
  MUSICBILL_DELETED = 'musicbill_deleted', // 歌单已删除, { id: string }
}

export default new Eventemitter();
