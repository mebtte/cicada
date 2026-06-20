export { default as Icon } from './base';
export type { IconProps } from './base';

// ── 命名约定 ───────────────────────────────────────────────────────────────────
// 组件名: PascalSemanticName, 例: Close, PlayArrow, MusicNote
// 文件名: kebab-semantic-name.tsx, 例: close.tsx, play-arrow.tsx, music-note.tsx
// 语义优先, 不带样式后缀 (不要 Outline / Filled / Alt 等), 同语义只保留一个版本。
//   旧第三方图标名                    → 新名
//   MdClose, MdOutlineClose           → Close
//   MdDelete, MdDeleteOutline         → Delete
//   MdAdd                             → Add
//   MdOutlineAddBox, MdAddBox         → AddBox
//   MdKeyboardArrowLeft               → ChevronLeft
//   MdKeyboardArrowRight              → ChevronRight
//   MdSearch                          → Search
//   MdRefresh                         → Refresh
//   MdPlaylistAdd                     → PlaylistAdd
//   MdOutlinePostAdd, MdPostAdd       → PostAdd
//   MdDragIndicator                   → DragIndicator
//   play-next queue insertion         → QueueInsert
//   downward arrow to a target dot    → Locate
//   MdInfoOutline                     → Info
//   MdErrorOutline                    → Error
//   MdHelpOutline                     → Help
// 仅当 "填充版" 和 "描边版" 同时表达不同语义状态时才区分:
//   MdStar (已收藏)           → StarFilled
//   MdStarOutline (未收藏)    → Star
// 使用方: import { Close } from '@/components/icon'。
// 跟同名变量冲突时用 import 别名: import { Close as CloseIcon } from ...
// ── 视觉规范 ───────────────────────────────────────────────────────────────────
// viewBox 24x24, 主体艺术稿落在 4..20 keyline 内, 视觉框目标 ~16x16。
// 默认 strokeWidth 2.2, round caps/joins, 颜色走 currentColor。
// 允许 fill="currentColor" 做强调 (音符头/三角箭头/列表圆点)。
// 新增 icon: 在 icons/ 下建文件, 此处加一行 export, 再加到 icon.stories.tsx 的 ALL_ICONS。
// ─────────────────────────────────────────────────────────────────────────────

export { default as Edit }          from './icons/edit';
export { default as ExternalLink }  from './icons/external-link';
export { default as CheckCircle }   from './icons/check-circle';
export { default as Close }         from './icons/close';
export { default as PlayArrow }     from './icons/play-arrow';
export { default as MusicNote }     from './icons/music-note';
export { default as Add }           from './icons/add';
export { default as AddBox }        from './icons/add-box';
export { default as Search }        from './icons/search';
export { default as Delete }        from './icons/delete';
export { default as Refresh }       from './icons/refresh';
export { default as PlaylistAdd }   from './icons/playlist-add';
export { default as QueueInsert }   from './icons/queue-insert';
export { default as Help }          from './icons/help';
export { default as PostAdd }       from './icons/post-add';
export { default as DragIndicator } from './icons/drag-indicator';
export { default as AdminPanel }    from './icons/admin-panel';
export { default as ArrowBack }     from './icons/arrow-back';
export { default as ArrowDown }     from './icons/arrow-down';
export { default as ArrowUp }       from './icons/arrow-up';
export { default as Check }         from './icons/check';
export { default as ChevronDown }   from './icons/chevron-down';
export { default as ChevronLeft }   from './icons/chevron-left';
export { default as ChevronRight }  from './icons/chevron-right';
export { default as ChevronUp }     from './icons/chevron-up';
export { default as CloudOff }      from './icons/cloud-off';
export { default as CloudUpload }   from './icons/cloud-upload';
export { default as Dashboard }     from './icons/dashboard';
export { default as DeleteSweep }   from './icons/delete-sweep';
export { default as Devices }       from './icons/devices';
export { default as Error }         from './icons/error';
export { default as Exit }          from './icons/exit';
export { default as Expand }        from './icons/expand';
export { default as Explore }       from './icons/explore';
export { default as File }          from './icons/file';
export { default as FileDownload }  from './icons/file-download';
export { default as Headphones }    from './icons/headphones';
export { default as HighQuality }   from './icons/high-quality';
export { default as History }       from './icons/history';
export { default as Image }         from './icons/image';
export { default as Info }          from './icons/info';
export { default as Key }           from './icons/key';
export { default as LibraryMusic }  from './icons/library-music';
export { default as Locate }        from './icons/locate';
export { default as Logout }        from './icons/logout';
export { default as Menu }          from './icons/menu';
export { default as Microphone }    from './icons/microphone';
export { default as MoreHorizontal } from './icons/more-horizontal';
export { default as MoreVertical }  from './icons/more-vertical';
export { default as MusicNotes }    from './icons/music-notes';
export { default as OfflineDownload } from './icons/offline-download';
export { default as Password }      from './icons/password';
export { default as Pause }         from './icons/pause';
export { default as People }        from './icons/people';
export { default as PersonAdd }     from './icons/person-add';
export { default as PersonStar }    from './icons/person-star';
export { default as PhotoAdd }      from './icons/photo-add';
export { default as PlayCircle }    from './icons/play-circle';
export { default as PlaylistPlay }  from './icons/playlist-play';
export { default as PlaylistRemove } from './icons/playlist-remove';
export { default as QueueMusic }    from './icons/queue-music';
export { default as Radio }         from './icons/radio';
export { default as Remove }        from './icons/remove';
export { default as Restart }       from './icons/restart';
export { default as Save }          from './icons/save';
export { default as Schedule }      from './icons/schedule';
export { default as Security }      from './icons/security';
export { default as Settings }      from './icons/settings';
export { default as Shuffle }       from './icons/shuffle';
export { default as SkipNext }      from './icons/skip-next';
export { default as SkipPrevious }  from './icons/skip-previous';
export { default as Sort }          from './icons/sort';
export { default as Sparkles }      from './icons/sparkles';
export { default as Speed }         from './icons/speed';
export { default as Star }          from './icons/star';
export { default as StarFilled }    from './icons/star-filled';
export { default as SwitchAccount } from './icons/switch-account';
export { default as Timer }         from './icons/timer';
export { default as UnfoldLess }    from './icons/unfold-less';
export { default as UnfoldMore }    from './icons/unfold-more';
export { default as UploadFile }    from './icons/upload-file';
export { default as Voice }         from './icons/voice';
