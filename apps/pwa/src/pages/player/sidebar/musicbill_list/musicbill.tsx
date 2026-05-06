import styled from 'styled-components';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { NavLink } from 'react-router-dom';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import getResizedImage from '@/server/asset/get_resized_image';
import { Musicbill as MusicbillType } from '../../constants';
import MusicbillCover from '../../components/musicbill_cover';
import { CSS_VAR } from '@/components/theme';

const COVER_SIZE = 26;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;

const Style = styled(NavLink)`
  min-height: 40px;
  padding: 0 12px 4px;
  margin: 0 12px;

  display: flex;
  align-items: center;
  gap: 10px;

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  text-decoration: none;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  background: transparent;
  border: 2px solid transparent;
  border-radius: 15px;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out,
    background 150ms ease-out,
    color 150ms ease-out,
    filter 120ms ease-out;

  > .name {
    flex: 1;
    min-width: 0;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    letter-spacing: 0;
    ${ellipsis}
  }

  &:hover {
    color: ${PRIMARY};
    background: #fff;
    border-color: ${CSSVariable.COLOR_BORDER};
    box-shadow: 0 3px 0 rgb(232 232 232);
  }

  &:active {
    transform: translateY(3px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }

  &.active {
    color: #fff;
    background: ${PRIMARY};
    border-color: ${PRIMARY_SHADOW};
    box-shadow: 0 4px 0 ${PRIMARY_SHADOW};
  }

  &.active:hover {
    color: #fff;
    background: ${PRIMARY};
    border-color: ${PRIMARY_SHADOW};
    box-shadow: 0 4px 0 ${PRIMARY_SHADOW};
    filter: brightness(1.04);
  }

  &.active:active {
    box-shadow: none;
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
      <MusicbillCover
        size={COVER_SIZE}
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
        publiz={musicbill.public}
        shared={musicbill.sharedUserList.length > 0}
      />
      <div className="name">{musicbill.name}</div>
    </Style>
  );
}

export default Musicbill;
