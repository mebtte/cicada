import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { Music } from './constants';
import Singer from '../../components/singer';

const Style = styled.div`
  > .name {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    font-weight: 900;
    line-height: 1.3;
    ${ellipsis}
  }

  > .singers {
    margin-top: 2px;

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    line-height: 1.35;
    ${ellipsis}
  }
`;

function MusicInfo({ music }: { music: Music }) {
  return (
    <Style>
      <div className="name">{music.name}</div>
      <div className="singers">
        {music.singers.map((s) => (
          <Singer key={s.id} singer={s} />
        ))}
      </div>
    </Style>
  );
}

export default MusicInfo;
