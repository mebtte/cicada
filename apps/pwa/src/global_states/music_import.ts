import { create } from 'zustand';
import { MusicType } from '@/constants/music';
import type { ChunkedUploadResumeMeta, UploadPhase } from '@/server/form/upload_asset_chunked';

export type ImportPhase =
  | 'editing'
  | 'queued'
  | UploadPhase
  | 'creating'
  | 'success'
  | 'failed'
  | 'paused'
  | 'canceled';

export interface ImportTaskSinger {
  id: string;
  name: string;
}

export interface ImportTaskParsedMetadata {
  title?: string;
  artist?: string;
  year?: number;
  pictureDataURI?: string;
}

export interface ImportTask {
  id: string;
  /** Stays in memory only — never persisted to storage. */
  file: File;
  fileName: string;
  fileSize: number;
  parsed: ImportTaskParsedMetadata;
  // user-editable fields
  name: string;
  singers: ImportTaskSinger[];
  type: MusicType;
  // runtime
  phase: ImportPhase;
  uploadedBytes: number;
  totalBytes: number;
  speedBps: number;
  errorMessage?: string;
  /** Issued by upload client; survives across UploadManager restarts. */
  resumeMeta?: ChunkedUploadResumeMeta;
  /** Final created music id, set after creating. */
  musicId?: string;
  createdAt: number;
}

export interface WindowPosition {
  x: number;
  y: number;
}

interface MusicImportState {
  tasks: ImportTask[];
  /** Token bumped on success so MusicList can react and reload. */
  reloadToken: number;
  /** Visibility of the global upload window. Lives here so it survives admin
   *  menu switches and can be toggled from any page. */
  windowOpen: boolean;
  /** Whether the upload window body is collapsed to the summary strip. */
  windowMinimized: boolean;
  /** Last user-chosen position. null means "use the default bottom-right
   *  anchor"; stored only for the lifetime of the tab. */
  windowPosition: WindowPosition | null;
}

export const useMusicImport = create<MusicImportState>(() => ({
  tasks: [],
  reloadToken: 0,
  windowOpen: false,
  windowMinimized: false,
  windowPosition: null,
}));

export function setWindowOpen(open: boolean) {
  useMusicImport.setState({ windowOpen: open });
}

export function toggleWindow() {
  useMusicImport.setState((s) => ({ windowOpen: !s.windowOpen }));
}

export function setWindowMinimized(minimized: boolean) {
  useMusicImport.setState({ windowMinimized: minimized });
}

export function toggleMinimized() {
  useMusicImport.setState((s) => ({ windowMinimized: !s.windowMinimized }));
}

export function setWindowPosition(position: WindowPosition | null) {
  useMusicImport.setState({ windowPosition: position });
}

export function getTask(id: string): ImportTask | undefined {
  return useMusicImport.getState().tasks.find((t) => t.id === id);
}

export function addTasks(newTasks: ImportTask[]) {
  useMusicImport.setState((s) => ({ tasks: [...s.tasks, ...newTasks] }));
}

export function updateTask(id: string, patch: Partial<ImportTask>) {
  useMusicImport.setState((s) => ({
    tasks: s.tasks.map((task) =>
      task.id === id ? { ...task, ...patch } : task,
    ),
  }));
}

export function removeTask(id: string) {
  useMusicImport.setState((s) => ({
    tasks: s.tasks.filter((task) => task.id !== id),
  }));
}

export function clearFinished() {
  useMusicImport.setState((s) => ({
    tasks: s.tasks.filter(
      (task) => task.phase !== 'success' && task.phase !== 'canceled',
    ),
  }));
}

export function bumpReloadToken() {
  useMusicImport.setState((s) => ({ reloadToken: s.reloadToken + 1 }));
}

/** True when at least one task is in a non-terminal upload phase. */
export function hasActiveTasks(state = useMusicImport.getState()): boolean {
  return state.tasks.some(
    (t) =>
      t.phase === 'queued' ||
      t.phase === 'hashing' ||
      t.phase === 'initializing' ||
      t.phase === 'uploading' ||
      t.phase === 'completing' ||
      t.phase === 'creating',
  );
}
