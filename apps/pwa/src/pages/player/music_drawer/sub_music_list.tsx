import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import getResizedImage from '@/server/asset/get_resized_image';
import { Music } from '../constants';
import MusicInfo from '../components/music_info';
import capitalize from '@/style/capitalize';

const Style = styled.div`
  margin: 22px 20px;

  > .label {
    margin-bottom: 10px;

    color: rgb(75 75 75);
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    line-height: 1.2;
    ${capitalize}
  }

  > .list {
    display: flex;
    flex-direction: column;
    gap: 10px;

    > .item {
      min-height: 64px;
      padding: 8px 10px 12px;

      background: #fff;
      border: 2px solid rgb(229 229 229);
      border-radius: 14px;
      box-shadow: 0 4px 0 rgb(229 229 229);
      transition:
        transform 120ms ease-out,
        box-shadow 120ms ease-out,
        filter 120ms ease-out;

      &:hover {
        filter: brightness(1.03);
      }

      &:active {
        transform: translateY(4px);
        box-shadow: none;
      }
    }
  }
`;

function SubMusicList({
  musicList,
  label,
}: {
  musicList: Omit<Music, 'asset' | 'type' | 'aliases'>[];
  label: string;
}) {
  return (
    <Style>
      <div className="label">{label}</div>
      <div className="list">
        {musicList.map((music) => (
          <MusicInfo
            key={music.id}
            className="item"
            musicId={music.id}
            musicName={music.name}
            musicCover={getResizedImage({ url: music.cover, size: 80 })}
            singers={music.singers}
          />
        ))}
      </div>
    </Style>
  );
}

export default SubMusicList;
