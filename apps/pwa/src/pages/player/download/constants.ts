import { Music } from '../constants';

export enum DownloadStatus {
  WAITING,
  DOWNLOADING,
  FAILED,
  SUCCESSFUL,
}

export interface DownloadingMusic {
  id: string;
  music: Music;
  directoryHandle: FileSystemDirectoryHandle;
  status: DownloadStatus;
}
