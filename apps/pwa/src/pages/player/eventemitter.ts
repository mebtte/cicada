import Eventin from 'eventin';
import {
  Music,
  Musicbill,
  MusicWithArtistAliases,
  QueueMusic,
} from './constants';
import { MusicExportQuality } from '@/utils/music_export_asset';

export enum EventType {
  EXPORT_MUSIC_LIST = 'export-music-list',
  EXPORT_MUSIC_LIST_RETRY_FAILED = 'export-music-list-retry-failed',
  EXPORT_MUSIC_LIST_RETRY_ITEM = 'export-music-list-retry-item',
  EXPORT_MUSIC_LIST_REMOVE_ITEM = 'export-music-list-remove-item',

  MINI_MODE_OPEN_SIDEBAR = 'mini_mode_OPEN_sidebar',
  MINI_MODE_CLOSE_SIDEBAR = 'mini_mode_close_sidebar',

  AUDIO_TIME_UPDATED = 'audio_time_updated',

  ACTION_PLAY = 'action_play',
  ACTION_PAUSE = 'action_pause',
  ACTION_SET_TIME = 'action_set_time',
  ACTION_PREVIOUS = 'action_previous',
  ACTION_NEXT = 'action_next',
  ACTION_PLAY_MUSIC = 'action_play_music',
  ACTION_LOCATE_PLAYQUEUE_MUSIC = 'action_locate_playqueue_music',
  ACTION_ADD_MUSIC_LIST_TO_PLAYLIST = 'action_add_music_list_to_playlist',
  ACTION_INSERT_MUSIC_TO_PLAYQUEUE = 'action_insert_music_to_playqueue',
  ACTION_CLEAR_PLAYLIST = 'action_clear_playlist',
  ACTION_REMOVE_PLAYLIST_MUSIC = 'action_remove_playlist_music',
  ACTION_REMOVE_PLAYQUEUE_MUSIC = 'action_remove_playqueue_music',
  ACTION_REORDER_PLAYQUEUE_MUSIC = 'action_reorder_playqueue_music',

  RELOAD_MUSICBILL_LIST = 'reload_musicbill_list',
  RELOAD_MUSICBILL = 'reload_musicbill',
  ADD_MUSIC_TO_MUSICBILL = 'add_music_to_musicbill',
  REMOVE_MUSIC_FROM_MUSICBILL = 'remove_music_from_musicbill',

  TOGGLE_LYRIC_PANEL = 'toggle_lyric_panel',

  OPEN_MUSICBILL_MUSIC_DRAWER = 'open_musicbill_music_drawer',
  OPEN_MUSICBILL_SHARED_USER_DRAWER = 'open_musicbill_shared_user_drawer',
  OPEN_SHARED_MUSICBILL_INVITATION_DRAWER = 'open_shared_musicbill_invitation_drawer',
  OPEN_ARTIST_DRAWER = 'open_artist_drawer',
  OPEN_MUSIC_DRAWER = 'open_music_drawer',
  OPEN_MUSICBILL_ORDER_DRAWER = 'open_musicbill_order_drawer',
  OPEN_PLAYLIST_PLAYQUEUE_DRAWER = 'open_playlist_playqueue_drawer',
  OPEN_USER_DRAWER = 'open_user_drawer',
  OPEN_MUSICBILL_DRAWER = 'open_musicbill_drawer',
  OPEN_PUBLIC_MUSICBILL_COLLECTION_DRAWER = 'open_public_musicbill_collection_drawer',
  OPEN_AUTHORIZED_DEVICE_DRAWER = 'open_authorized_device_drawer',
  OPEN_2FA_DIALOG = 'open_2fa_dialog',

  FOCUS_SEARCH_INPUT = 'focus_search_input',

  MUSICBILL_CREATED = 'musicbill_created',
  MUSICBILL_DELETED = 'musicbill_deleted',

  MUSIC_DETAIL_LOADED = 'music_detail_loaded',

  ARTIST_UPDATED = 'artist_updated',
  ARTIST_DETAIL_LOADED = 'artist_detail_loaded',

  MUSICBILL_COLLECTION_CHANGE = 'musicbill_collection_change',
  CURRENT_MUSIC_CHANGE = 'current_music_change',
}

export default new Eventin<
  EventType,
  {
    [EventType.EXPORT_MUSIC_LIST]: {
      musicList: Music[];
      directoryHandle: FileSystemDirectoryHandle;
      quality: MusicExportQuality;
    };
    [EventType.EXPORT_MUSIC_LIST_RETRY_FAILED]: null;
    [EventType.EXPORT_MUSIC_LIST_RETRY_ITEM]: { id: string };
    [EventType.EXPORT_MUSIC_LIST_REMOVE_ITEM]: { id: string };

    [EventType.MINI_MODE_OPEN_SIDEBAR]: null;
    [EventType.MINI_MODE_CLOSE_SIDEBAR]: null;

    [EventType.AUDIO_TIME_UPDATED]: { currentMillisecond: number };

    [EventType.ACTION_PLAY]: null;
    [EventType.ACTION_PAUSE]: null;
    [EventType.ACTION_SET_TIME]: { second: number };
    [EventType.ACTION_PREVIOUS]: null;
    [EventType.ACTION_NEXT]: null;
    [EventType.ACTION_PLAY_MUSIC]: { music: MusicWithArtistAliases };
    [EventType.ACTION_LOCATE_PLAYQUEUE_MUSIC]: { pid: string };
    [EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST]: {
      musicList: MusicWithArtistAliases[];
    };
    [EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE]: {
      music: MusicWithArtistAliases;
    };
    [EventType.ACTION_CLEAR_PLAYLIST]: null;
    [EventType.ACTION_REMOVE_PLAYLIST_MUSIC]: { id: string };
    [EventType.ACTION_REMOVE_PLAYQUEUE_MUSIC]: { queueMusic: QueueMusic };
    [EventType.ACTION_REORDER_PLAYQUEUE_MUSIC]: {
      activePid: string;
      overPid: string;
    };

    [EventType.RELOAD_MUSICBILL_LIST]: { silence: boolean };
    [EventType.RELOAD_MUSICBILL]: { id: string; silence: boolean };
    [EventType.ADD_MUSIC_TO_MUSICBILL]: {
      musicbill: Musicbill;
      music: MusicWithArtistAliases;
    };
    [EventType.REMOVE_MUSIC_FROM_MUSICBILL]: {
      musicbill: Musicbill;
      music: MusicWithArtistAliases;
    };

    [EventType.TOGGLE_LYRIC_PANEL]: { open: boolean } | null;

    [EventType.OPEN_MUSICBILL_SHARED_USER_DRAWER]: { id: string };
    [EventType.OPEN_SHARED_MUSICBILL_INVITATION_DRAWER]: null;
    [EventType.OPEN_MUSICBILL_MUSIC_DRAWER]: {
      music: MusicWithArtistAliases;
    };
    [EventType.OPEN_ARTIST_DRAWER]: { id: string };
    [EventType.OPEN_MUSIC_DRAWER]: { id: string };
    [EventType.OPEN_MUSICBILL_ORDER_DRAWER]: null;
    [EventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER]: null;
    [EventType.OPEN_USER_DRAWER]: { id: string };
    [EventType.OPEN_MUSICBILL_DRAWER]: { id: string };
    [EventType.OPEN_PUBLIC_MUSICBILL_COLLECTION_DRAWER]: null;
    [EventType.OPEN_AUTHORIZED_DEVICE_DRAWER]: null;
    [EventType.OPEN_2FA_DIALOG]: null;

    [EventType.FOCUS_SEARCH_INPUT]: null;

    [EventType.MUSICBILL_CREATED]: { id: string };
    [EventType.MUSICBILL_DELETED]: null;

    [EventType.MUSIC_DETAIL_LOADED]: {
      id: string;
      name: string;
      aliases: string[];
      performers: { id: string; name: string }[];
    };

    [EventType.ARTIST_UPDATED]: { id: string };
    [EventType.ARTIST_DETAIL_LOADED]: {
      id: string;
      name: string;
      aliases: string[];
    };

    [EventType.MUSICBILL_COLLECTION_CHANGE]: null;
    [EventType.CURRENT_MUSIC_CHANGE]: { queueMusic?: QueueMusic };
  }
>();
