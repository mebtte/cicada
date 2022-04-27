import electron from '../platform/electron';

export default (url: string): void =>
  electron ? void electron.shell.openExternal(url) : void window.open(url);
