import { CSSVariable } from '#/global_style';
import styled from 'styled-components';
import { Music } from '../constants';
import MusicInfo from '../components/music_info';

const Style = styled.div`
  margin: 10px 0;
  padding: 10px 0;

  background-color: rgb(0 0 0 / 0.02);

  > .label {
    margin: 0 20px 10px 20px;

    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }

  > .list {
    display: flex;
    flex-direction: column;
    gap: 10px;

    > .item {
      margin: 0 20px;
    }
  }
`;

function SubMusicList({
  musicList,
  label,
}: {
  musicList: Music[];
  label: string;
}) {
  return (
    <Style>
      <div className="label">{label}</div>
      <div className="list">
        {musicList.map((music) => (
          <MusicInfo key={music.id} music={music} className="item" />
        ))}
      </div>
    </Style>
  );
}

export default SubMusicList;
