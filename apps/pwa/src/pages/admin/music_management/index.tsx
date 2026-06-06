import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useMusicImport } from '@/global_states/music_import';
import useQuery from '@/utils/use_query';
import useNavigate from '@/utils/use_navigate';
import MusicList from './music_list';
import MusicEditDrawer from './music_edit_drawer';
import ArtistEditDrawer from '../components/artist_edit/drawer';

// 外部入口(例如 player music drawer 的编辑按钮)通过该 query 直接打开音乐编辑 drawer
const EDIT_MUSIC_ID_QUERY = 'edit_music_id';

const ScrollArea = styled.div`
  height: 100%;
  overflow: hidden;
`;

function MusicManagement() {
  const [editMusicId, setEditMusicId] = useState<string | null>(null);
  const [editArtistId, setEditArtistId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const importReloadToken = useMusicImport((s) => s.reloadToken);
  const query = useQuery<typeof EDIT_MUSIC_ID_QUERY>();
  const navigate = useNavigate();
  const externalEditMusicId = query[EDIT_MUSIC_ID_QUERY];

  // 外部携带 edit_music_id 进入时, 打开对应音乐的编辑 drawer 并清掉 URL 上的 query,
  // 防止刷新或关闭 drawer 后再次自动打开, 也避免分享链接时夹带音乐 id.
  useEffect(() => {
    if (!externalEditMusicId) return;
    setEditMusicId(externalEditMusicId);
    navigate({
      query: { [EDIT_MUSIC_ID_QUERY]: undefined },
      replace: true,
    });
  }, [externalEditMusicId, navigate]);

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
        onArtistEdit={setEditArtistId}
      />
      <MusicEditDrawer
        open={editMusicId !== null}
        musicId={editMusicId}
        onClose={() => setEditMusicId(null)}
        onSaved={reload}
      />
      <ArtistEditDrawer
        open={editArtistId !== null}
        artistId={editArtistId}
        onClose={() => setEditArtistId(null)}
        onSaved={reload}
      />
    </ScrollArea>
  );
}

export default MusicManagement;
