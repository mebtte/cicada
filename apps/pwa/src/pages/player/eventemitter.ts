import { Option } from '#/components/multiple_select';
import Eventin from 'eventin';
import {
  Music,
  Musicbill,
  MusicWithIndex,
  PlayMode,
  QueueMusic,
} from './constants';

export enum EditDialogType {
  INPUT,
  COVER,
  INPUT_LIST,
  TEXTAREA_LIST,
  FILE,
  MULTIPLE_SELECT,
}
export type EditDialogData = {
  title: string;
  onSubmit: (value: unknown | undefined) => void | Promise<void>;
} & (
  | {
      type: EditDialogType.INPUT;
      label: string;
      initialValue?: string;
    }
  | {
      type: EditDialogType.COVER;
    }
  | {
      type: EditDialogType.TEXTAREA_LIST;
      label: string;
      initialValue?: string[];
      max?: number;
      maxLength?: number;
      placeholder?: string;
    }
  | {
      type: EditDialogType.INPUT_LIST;
      label: string;
      initialValue?: string[];
      max?: number;
      maxLength?: number;
    }
  | {
      type: EditDialogType.FILE;
      label: string;
      acceptTypes: string[];
      placeholder: string;
    }
  | {
      type: EditDialogType.MULTIPLE_SELECT;
      initialValue: Option<unknown>[];
      label: string;
      dataGetter: (
        keyword: string,
      ) => Option<unknown>[] | Promise<Option<unknown>[]>;
    }
);

export enum EventType {
  MINI_MODE_OPEN_SIDEBAR = 'mini_mode_OPEN_sidebar',
  MINI_MODE_CLOSE_SIDEBAR = 'mini_mode_close_sidebar',

  AUDIO_WAITING = 'audio_waiting',
  AUDIO_CAN_PLAY_THROUGH = 'audio_can_play_through',
  AUDIO_PLAY = 'audio_play',
  AUDIO_PAUSE = 'audio_pause',
  AUDIO_TIME_UPDATED = 'audio_time_updated',
  AUDIO_ERROR = 'audio_error',

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
  FETCH_MUSICBILL = 'fetch_musicbill',
  ADD_MUSIC_TO_MUSICBILL = 'add_music_to_musicbill',
  REMOVE_MUSIC_FROM_MUSICBILL = 'remove_music_from_musicbill',

  CHANGE_PLAY_MODE = 'change_play_mode',

  TOGGEL_LYRIC = 'toggle_lyric',
  CLOSE_LYRIC = 'close_lyric',

  OPEN_MUSIC_OPERATE_POPUP = 'open_music_operate_popup',
  OPEN_MUSICBILL_LIST_DRAWER = 'open_musicbill_list_drawer',
  OPEN_SINGER_DRAWER = 'open_singer_drawer',
  OPEN_MUSIC_DRAWER = 'open_music_drawer',
  OPEN_ORIGINAL_MUSIC_DIALOG = 'open_original_music_dialog',
  OPEN_MUSICBILL_ORDER_DRAWER = 'open_musicbill_order_drawer',
  OPEN_PLAYLIST_PLAYQUEUE_DRAWER = 'open_playlist_playqueue_drawer',
  TOGGLE_PLAYLIST_PLAYQUEUE_DRAWER = 'toggle_playlist_playqueue_drawer',
  OPEN_MUSIC_DOWNLOAD_DIALOG = 'open_music_download_dialog',
  OPEN_EDIT_DIALOG = 'open_music_edit_dialog',

  FOCUS_SEARCH_INPUT = 'focus_search_input',

  MUSIC_UPDATED = 'music_updated',
  MUSIC_DELETED = 'music_deleted',
}

export default new Eventin<
  EventType,
  {
    [EventType.MINI_MODE_OPEN_SIDEBAR]: null;
    [EventType.MINI_MODE_CLOSE_SIDEBAR]: null;

    [EventType.AUDIO_WAITING]: null;
    [EventType.AUDIO_CAN_PLAY_THROUGH]: { duration: number };
    [EventType.AUDIO_PLAY]: null;
    [EventType.AUDIO_PAUSE]: null;
    [EventType.AUDIO_TIME_UPDATED]: { currentMillisecond: number };
    [EventType.AUDIO_ERROR]: null;

    [EventType.ACTION_TOGGLE_PLAY]: null;
    [EventType.ACTION_PLAY]: null;
    [EventType.ACTION_PAUSE]: null;
    [EventType.ACTION_SET_TIME]: { second: number };
    [EventType.ACTION_PREVIOUS]: null;
    [EventType.ACTION_NEXT]: null;
    [EventType.ACTION_PLAY_MUSIC]: { music: Music };
    [EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST]: { musicList: Music[] };
    [EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE]: { music: Music };
    [EventType.ACTION_PLAY_PLAYQUEUE_INDEX]: { index: number };
    [EventType.ACTION_CLEAR_PLAYLIST]: null;
    [EventType.ACTION_REMOVE_PLAYLIST_MUSIC]: { listMusic: MusicWithIndex };
    [EventType.ACTION_REMOVE_PLAYQUEUE_MUSIC]: { queueMusic: QueueMusic };
    [EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_LATER]: { queueMusic: QueueMusic };
    [EventType.ACTION_MOVE_PLAYQUEUE_MUSIC_EARLY]: { queueMusic: QueueMusic };

    [EventType.RELOAD_MUSICBILL_LIST]: null;
    [EventType.FETCH_MUSICBILL]: { id: string };
    [EventType.ADD_MUSIC_TO_MUSICBILL]: { musicbill: Musicbill; music: Music };
    [EventType.REMOVE_MUSIC_FROM_MUSICBILL]: {
      musicbill: Musicbill;
      music: Music;
    };

    [EventType.CHANGE_PLAY_MODE]: { playMode: PlayMode };

    [EventType.TOGGEL_LYRIC]: null;
    [EventType.CLOSE_LYRIC]: null;

    [EventType.OPEN_MUSIC_OPERATE_POPUP]: { music: Music };
    [EventType.OPEN_MUSICBILL_LIST_DRAWER]: { music: Music };
    [EventType.OPEN_SINGER_DRAWER]: { id: string };
    [EventType.OPEN_MUSIC_DRAWER]: { id: string };
    [EventType.OPEN_ORIGINAL_MUSIC_DIALOG]: null;
    [EventType.OPEN_MUSICBILL_ORDER_DRAWER]: null;
    [EventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER]: null;
    [EventType.TOGGLE_PLAYLIST_PLAYQUEUE_DRAWER]: null;
    [EventType.OPEN_MUSIC_DOWNLOAD_DIALOG]: { music: Music };
    [EventType.OPEN_EDIT_DIALOG]: EditDialogData;

    [EventType.FOCUS_SEARCH_INPUT]: null;

    [EventType.MUSIC_UPDATED]: { music: Music };
    [EventType.MUSIC_DELETED]: { id: string };
  }
>();
