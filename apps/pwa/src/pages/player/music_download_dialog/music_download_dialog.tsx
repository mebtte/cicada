import Dialog from '#/components/dialog';
import { CSSProperties } from 'react';
import Button from '#/components/button';
import styled from 'styled-components';
import formatMusicFilename from '#/utils/format_music_filename';
import { saveAs } from 'file-saver';
import { Music } from '../constants';
import MusicInfo from '../components/music_info';

const bodyProps: {
  style: CSSProperties;
} = {
  style: {
    width: 250,
    paddingBottom: 20,
  },
};
const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  > .item {
    margin: 0 20px;
  }
`;

function MusicDownloadDialog({
  zIndex,
  open,
  onClose,
  music,
}: {
  zIndex: number;
  open: boolean;
  onClose: () => void;
  music: Music;
}) {
  const { name, singers, sq, hq, ac } = music;
  const onDownload = (url: string) => {
    const parts = url.split('.');
    saveAs(
      url,
      formatMusicFilename({
        name,
        singerNames: singers.map((s) => s.name),
        ext: `.${parts[parts.length - 1]}`,
      }),
    );
    return onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maskProps={{ style: { zIndex } }}
      bodyProps={bodyProps}
    >
      <StyledContent>
        <MusicInfo className="music-info" music={music} />

        <Button className="item" onClick={() => onDownload(sq)}>
          标准音质
        </Button>
        {hq ? (
          <Button className="item" onClick={() => onDownload(hq)}>
            无损音质
          </Button>
        ) : null}
        {ac ? (
          <Button className="item" onClick={() => onDownload(ac)}>
            伴奏
          </Button>
        ) : null}
      </StyledContent>
    </Dialog>
  );
}

export default MusicDownloadDialog;
