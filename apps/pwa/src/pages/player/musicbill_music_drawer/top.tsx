import styled from 'styled-components';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { CSSVariable } from '@/global_style';
import IconButton from '@/components/icon_button';
import { MdOutlineAddBox } from 'react-icons/md';
import getResizedImage from '@/server/asset/get_resized_image';
import { Music } from '../constants';
import MusicInfo from '../components/music_info';
import { openCreateMusicbillDialog } from '../utils';

const Style = styled.div`
  z-index: 1;

  position: sticky;
  top: 0;

  backdrop-filter: blur(5px);
  background-color: rgb(255 255 255 / 0.5);

  display: flex;
  flex-direction: column;
  gap: 10px;

  > .header {
    margin: 0 20px;

    display: flex;
    align-items: center;

    > .title {
      flex: 1;
      min-width: 0;

      font-size: 18px;
      font-weight: bold;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }
  }
`;

function Top({ music }: { music: Music }) {
  const { height } = useTitlebarArea();

  return (
    <Style
      style={{
        padding: `${height}px 0 10px 0`,
      }}
    >
      <MusicInfo
        musicId={music.id}
        musicName={music.name}
        musicCover={getResizedImage({ url: music.cover, size: 80 })}
        singers={music.singers}
      />
      <div className="header">
        <div className="title">添加到乐单</div>
        <IconButton onClick={openCreateMusicbillDialog}>
          <MdOutlineAddBox />
        </IconButton>
      </div>
    </Style>
  );
}

export default Top;
