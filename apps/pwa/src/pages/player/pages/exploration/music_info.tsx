import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { Music } from './constants';
import Singer from '../../components/singer';

const Style = styled.div`
  > .name {
    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  > .singers {
    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
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
