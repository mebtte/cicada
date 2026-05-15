import { useEffect } from 'react';
import {
  startUploadManager,
  stopUploadManager,
} from './upload_manager';
import { hasActiveTasks, useMusicImport } from '@/global_states/music_import';
import { t } from '@/i18n';

/**
 * Mounted once near the AdminPage root so the upload driver survives
 * navigation between admin sub-routes. Side effects only — renders nothing.
 */
function UploadManagerHost() {
  useEffect(() => {
    startUploadManager();
    return () => stopUploadManager();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasActiveTasks(useMusicImport.getState())) {
        const message = t('music_import_running_warning');
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return null;
}

export default UploadManagerHost;
