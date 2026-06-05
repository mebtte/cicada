export { default as Icon } from './base';
export type { IconProps } from './base';

// ── 具名 Icon 组件 ─────────────────────────────────────────────────────────────
// 每个 icon 独立文件，未使用的会被 tree-shaking 删除。
// 新增 icon：在 icons/ 目录下新建文件，然后在此处加一行 export。

export { default as IconList }         from './icons/list';
export { default as IconPlayQueue }    from './icons/play-queue';
export { default as IconEdit }         from './icons/edit';
export { default as IconExternalLink } from './icons/external-link';
export { default as IconExport }       from './icons/export';
export { default as IconCheckCircle }  from './icons/check-circle';
export { default as IconClose }        from './icons/close';
export { default as IconPlayArrow }    from './icons/play-arrow';
export { default as IconMusicNote }    from './icons/music-note';
