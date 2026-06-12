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

export interface ImportTaskPerformer {
  id: string;
  name: string;
}

export interface ImportTaskParsedMetadata {
  title?: string;
  artist?: string;
  year?: number;
  pictureDataURI?: string;
  durationMs?: number;
  codec?: string;
  bitRate?: number;
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
  performers: ImportTaskPerformer[];
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

export interface MusicImportSummary {
  startedCount: number;
  activeCount: number;
  finishedCount: number;
  totalBytes: number;
  uploadedBytes: number;
  pct: number;
  allDone: boolean;
}

interface MusicImportState {
  tasks: ImportTask[];
  /** Token bumped on success so MusicList can react and reload. */
  reloadToken: number;
  /** Visibility of the global upload sidebar. Lives here so it survives admin
   *  menu switches and can be toggled from any page. */
  windowOpen: boolean;
}

export const useMusicImport = create<MusicImportState>(() => ({
  tasks: [],
  reloadToken: 0,
  windowOpen: false,
}));

export function setWindowOpen(open: boolean) {
  useMusicImport.setState({ windowOpen: open });
}

export function toggleWindow() {
  useMusicImport.setState((s) => ({ windowOpen: !s.windowOpen }));
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

export function isActiveImportPhase(phase: ImportPhase): boolean {
  return (
    phase === 'queued' ||
    phase === 'hashing' ||
    phase === 'initializing' ||
    phase === 'uploading' ||
    phase === 'completing' ||
    phase === 'creating'
  );
}

export function isFinishedImportPhase(phase: ImportPhase): boolean {
  return phase === 'success' || phase === 'failed' || phase === 'canceled';
}

export function getMusicImportSummary(
  tasks = useMusicImport.getState().tasks,
): MusicImportSummary {
  const totalBytes = tasks.reduce(
    (sum, task) => sum + task.totalBytes,
    0,
  );
  const uploadedBytes = tasks.reduce(
    (sum, task) =>
      sum + (task.phase === 'success' ? task.totalBytes : task.uploadedBytes),
    0,
  );
  const activeCount = tasks.filter((task) =>
    isActiveImportPhase(task.phase),
  ).length;
  const finishedCount = tasks.filter((task) =>
    isFinishedImportPhase(task.phase),
  ).length;
  // Global progress is based on every file in the drawer. Drafts that have not
  // started yet contribute their full size to the denominator and 0 uploaded
  // bytes, so the total reflects the whole batch.
  const pct =
    totalBytes > 0
      ? Math.min(100, (uploadedBytes / totalBytes) * 100)
      : 0;

  return {
    startedCount: tasks.length,
    activeCount,
    finishedCount,
    totalBytes,
    uploadedBytes,
    pct,
    allDone: tasks.length > 0 && finishedCount === tasks.length,
  };
}

/** True when at least one task is in a non-terminal upload phase. */
export function hasActiveTasks(state = useMusicImport.getState()): boolean {
  return state.tasks.some((task) => isActiveImportPhase(task.phase));
}
