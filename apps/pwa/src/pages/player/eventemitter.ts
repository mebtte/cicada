import Eventin from 'eventin';
import { Musicbill, MusicWithSingerAliases, QueueMusic } from './constants';

export enum EventType {
  MINI_MODE_OPEN_SIDEBAR = 'mini_mode_OPEN_sidebar',
  MINI_MODE_CLOSE_SIDEBAR = 'mini_mode_close_sidebar',

  AUDIO_TIME_UPDATED = 'audio_time_updated',

  ACTION_TOGGLE_PLAY = 'action_toggle_play',
  ACTION_PLAY = 'action_play',
  ACTION_PAUSE = 'action_pause',
  ACTION_SET_TIME = 'action_set_time',
  ACTION_PREVIOUS = 'action_previous',
  ACTION_NEXT = 'action_next',
  ACTION_PLAY_MUSIC = 'action_play_music',
  ACTION_ADD_MUSIC_LIST_TO_PLAYLIST = 'action_add_music_list_to_playlist',
  ACTION_INSERT_MUSIC_TO_PLAYQUEUE = 'action_insert_music_to_playqueue',
  ACTION_PLAY_PLAYQUEUE_INDEX = 'action_playqueue_index',
  ACTION_CLEAR_PLAYLIST = 'action_clear_playlist',
  ACTION_REMOVE_PLAYLIST_MUSIC = 'action_remove_playlist_music',
  ACTION_REMOVE_PLAYQUEUE_MUSIC = 'action_remove_playqueue_music',
  ACTION_MOVE_PLAYQUEUE_MUSIC_LATER = 'action_move_playqueue_music_LATER',
  ACTION_MOVE_PLAYQUEUE_MUSIC_EARLY = 'action_move_playqueue_music_EARLY',

  RELOAD_MUSICBILL_LIST = 'reload_musicbill_list',
  RELOAD_MUSICBILL = 'reload_musicbill',
  ADD_MUSIC_TO_MUSICBILL = 'add_music_to_musicbill',
  REMOVE_MUSIC_FROM_MUSICBILL = 'remove_music_from_musicbill',

  TOGGLE_LYRIC_PANEL = 'toggle_lyric_panel',

  OPEN_SINGER_MODIFY_RECORD_DRAWER = 'open_singer_modify_record_drawer',
  OPEN_MUSICBILL_MUSIC_DRAWER = 'open_musicbill_music_drawer',
  OPEN_MUSICBILL_SHARED_USER_DRAWER = 'open_musicbill_shared_user_drawer',
  OPEN_SINGER_DRAWER = 'open_singer_drawer',
  OPEN_MUSIC_DRAWER = 'open_music_drawer',
  OPEN_ORIGINAL_MUSIC_DIALOG = 'open_original_music_dialog',
  OPEN_MUSICBILL_ORDER_DRAWER = 'open_musicbill_order_drawer',
  OPEN_PLAYLIST_PLAYQUEUE_DRAWER = 'open_playlist_playqueue_drawer',
  TOGGLE_PLAYLIST_PLAYQUEUE_DRAWER = 'toggle_playlist_playqueue_drawer',
  OPEN_USER_DRAWER = 'open_user_drawer',
  OPEN_PUBLIC_MUSICBILL_DRAWER = 'open_public_musicbill_drawer',
  OPEN_PROFILE_EDIT_POPUP = 'open_profile_edit_popup',

  FOCUS_SEARCH_INPUT = 'focus_search_input',

  MUSICBILL_CREATED = 'musicbill_created',
  MUSICBILL_DELETED = 'musicbill_deleted',

  MUSIC_UPDATED = 'music_updated',
  MUSIC_DELETED = 'music_deleted',

  SINGER_UPDATED = 'singer_updated',

  MUSICBILL_COLLECTION_CHANGE = 'musicbill_collection_change',
  CURRENT_MUSIC_CHANGE = 'current_music_change',
}

export default new Eventin<
  EventType,
  {
    [EventType.MINI_MODE_OPEN_SIDEBAR]: null;
    [EventType.MINI_MODE_CLOSE_SIDEBAR]: null;

    [EventType.AUDIO_TIME_UPDATED]: { currentMillisecond: number };

    [EventType.ACTION_TOGGLE_PLAY]: null;
    [EventType.ACTION_PLAY]: null;
    [EventType.ACTION_PAUSE]: null;
    [EventType.ACTION_SET_TIME]: { second: number };
    [EventType.ACTION_PREVIOUS]: null;
    [EventType.ACTION_NEXT]: null;
    [EventType.ACTION_PLAY_MUSIC]: { music: MusicWithSingerAliases };
    [EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST]: {
      musicList: MusicWithSingerAliases[];
    };
    [EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE]: {
      music: MusicWithSingerAliases;
    };
    [EventType.ACTION_PLAY_PLAYQUEUE_INDEX]: { index: number };
    [EventType.ACTION_CLEAR_PLAYLIST]: null;
    [EventType.ACTION_REMOVE_PLAYLIST_MUSIC]: { id: string };
    [EventType.ACTION_REMOVE_PLAYQUEUE_MUSIC]: { queueMusic: QueueMusic };
    [EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_LATER]: { queueMusic: QueueMusic };
    [EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_EARLY]: { queueMusic: QueueMusic };

    [EventType.RELOAD_MUSICBILL_LIST]: { silence: boolean };
    [EventType.RELOAD_MUSICBILL]: { id: string; silence: boolean };
    [EventType.ADD_MUSIC_TO_MUSICBILL]: {
      musicbill: Musicbill;
      music: MusicWithSingerAliases;
    };
    [EventType.REMOVE_MUSIC_FROM_MUSICBILL]: {
      musicbill: Musicbill;
      music: MusicWithSingerAliases;
    };

    [EventType.TOGGLE_LYRIC_PANEL]: { open: boolean } | null;

    [EventType.OPEN_SINGER_MODIFY_RECORD_DRAWER]: {
      singer: { id: string; name: string; avatar: string };
    };
    [EventType.OPEN_MUSICBILL_SHARED_USER_DRAWER]: { id: string };
    [EventType.OPEN_MUSICBILL_MUSIC_DRAWER]: {
      music: MusicWithSingerAliases;
    };
    [EventType.OPEN_SINGER_DRAWER]: { id: string };
    [EventType.OPEN_MUSIC_DRAWER]: { id: string };
    [EventType.OPEN_ORIGINAL_MUSIC_DIALOG]: null;
    [EventType.OPEN_MUSICBILL_ORDER_DRAWER]: null;
    [EventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER]: null;
    [EventType.TOGGLE_PLAYLIST_PLAYQUEUE_DRAWER]: null;
    [EventType.OPEN_USER_DRAWER]: { id: string };
    [EventType.OPEN_PUBLIC_MUSICBILL_DRAWER]: { id: string };
    [EventType.OPEN_PROFILE_EDIT_POPUP]: null;

    [EventType.FOCUS_SEARCH_INPUT]: null;

    [EventType.MUSICBILL_CREATED]: { id: string };
    [EventType.MUSICBILL_DELETED]: null;

    [EventType.MUSIC_UPDATED]: { id: string };
    [EventType.MUSIC_DELETED]: { id: string };

    [EventType.SINGER_UPDATED]: { id: string };

    [EventType.MUSICBILL_COLLECTION_CHANGE]: null;
    [EventType.CURRENT_MUSIC_CHANGE]: { queueMusic?: QueueMusic };
  }
>();
