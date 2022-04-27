export enum Tab {
  PLAYLIST,
  PLAYQUEUE,
}

export const TAB_MAP: Record<Tab, { label: string }> = {
  [Tab.PLAYLIST]: { label: '播放列表' },
  [Tab.PLAYQUEUE]: { label: '播放队列' },
};

export const TABS = Object.keys(TAB_MAP).map((t) => Number(t)) as Tab[];

export const ACTION_ICON_STYLE = {
  cursor: 'pointer',
  fontSize: 18,
  margin: '10px 0',
};
