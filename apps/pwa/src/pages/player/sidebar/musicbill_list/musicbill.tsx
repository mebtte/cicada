import styled from 'styled-components';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { NavLink } from 'react-router-dom';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import getResizedImage from '@/server/asset/get_resized_image';
import { Musicbill as MusicbillType } from '../../constants';
import MusicbillCover from '../../components/musicbill_cover';

const COVER_SIZE = 26;
const Style = styled(NavLink)`
  padding: 5px 10px;
  margin: 0 10px;

  display: flex;
  align-items: center;
  gap: 10px;

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  text-decoration: none;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  background-color: transparent;
  transition: 300ms;
  border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};

  > .name {
    flex: 1;
    min-width: 0;

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    ${ellipsis}
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
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
