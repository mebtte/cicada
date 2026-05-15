import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useMusicImport } from '@/global_states/music_import';
import MusicList from './music_list';
import MusicEditDrawer from './music_edit_drawer';
import SingerEditDrawer from '../components/singer_edit/drawer';

const ScrollArea = styled.div`
  height: 100%;
  overflow: hidden;
`;

function MusicManagement() {
  const [editMusicId, setEditMusicId] = useState<string | null>(null);
  const [editSingerId, setEditSingerId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const importReloadToken = useMusicImport((s) => s.reloadToken);

  // Refresh the music list when an upload completes successfully so the new
  // entry shows up without a manual reload.
  useEffect(() => {
    if (importReloadToken === 0) return;
    setReloadToken((token) => token + 1);
  }, [importReloadToken]);

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return (
    <ScrollArea>
      <MusicList
        reloadToken={reloadToken}
        onEdit={setEditMusicId}
        onSingerEdit={setEditSingerId}
      />
      <MusicEditDrawer
        open={editMusicId !== null}
        musicId={editMusicId}
        onClose={() => setEditMusicId(null)}
        onSaved={reload}
      />
      <SingerEditDrawer
        open={editSingerId !== null}
        singerId={editSingerId}
        onClose={() => setEditSingerId(null)}
        onSaved={reload}
      />
    </ScrollArea>
  );
}

export default MusicManagement;
