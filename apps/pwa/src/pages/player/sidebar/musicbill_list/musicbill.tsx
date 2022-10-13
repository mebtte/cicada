import styled from 'styled-components';
import Cover from '#/components/cover';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { NavLink } from 'react-router-dom';
import { CSSVariable } from '#/global_style';
import ellipsis from '#/style/ellipsis';
import { Musicbill as MusicbillType } from '../../constants';

const Style = styled(NavLink)`
  padding: 5px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  user-select: none;
  text-decoration: none;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  background-color: transparent;
  transition: 300ms;

  > .name {
    flex: 1;
    min-width: 0;

    font-size: 14px;
    ${ellipsis}
  }

  &:hover {
    background-color: rgb(0 0 0 / 0.05);
  }

  &.active {
    color: #fff;
    background-color: ${CSSVariable.COLOR_PRIMARY} !important;
  }
`;

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  return (
    <Style
      to={`${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSICBILL.replace(
        ':id',
        musicbill.id,
      )}`}
    >
      <Cover size={28} src={musicbill.cover} />
      <div className="name">{musicbill.name}</div>
    </Style>
  );
}

export default Musicbill;
