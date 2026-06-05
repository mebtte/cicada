import { create } from 'zustand';

const useOnlineStore = create<{ online: boolean }>(() => ({
  online: window.navigator.onLine,
}));

window.addEventListener('online', () =>
  useOnlineStore.setState({ online: true }),
);
window.addEventListener('offline', () =>
  useOnlineStore.setState({ online: false }),
);

export function useIsOnline() {
  return useOnlineStore((state) => state.online);
}

export function getIsOnline() {
  return useOnlineStore.getState().online;
}
