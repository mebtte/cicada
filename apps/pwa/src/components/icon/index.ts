export { default as Icon } from './base';
export type { IconProps } from './base';

// ── 命名约定 ───────────────────────────────────────────────────────────────────
// 组件名: PascalSemanticName, 例: Close, PlayArrow, MusicNote
// 文件名: kebab-semantic-name.tsx, 例: close.tsx, play-arrow.tsx, music-note.tsx
// 语义优先, 不带样式后缀 (不要 Outline / Filled / Alt 等), 同语义只保留一个版本。
//   旧名 (react-icons)                → 新名
//   MdClose, MdOutlineClose           → Close
//   MdDelete, MdDeleteOutline         → Delete
//   MdAdd                             → Add
//   MdOutlineAddBox, MdAddBox         → AddBox
//   MdSearch                          → Search
//   MdRefresh                         → Refresh
//   MdPlaylistAdd                     → PlaylistAdd
//   MdOutlinePostAdd, MdPostAdd       → PostAdd
//   MdDragIndicator                   → DragIndicator
//   MdReadMore                        → ReadMore
//   play-next queue insertion         → QueueInsert
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

export { default as List }          from './icons/list';
export { default as PlayQueue }     from './icons/play-queue';
export { default as Edit }          from './icons/edit';
export { default as ExternalLink }  from './icons/external-link';
export { default as Export }        from './icons/export';
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
export { default as ReadMore }      from './icons/read-more';
