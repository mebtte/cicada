import styled from 'styled-components';
import Cover from '@/components/cover';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { NavLink } from 'react-router-dom';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import classnames from 'classnames';
import { MusicbillShareStatus } from '#/constants';
import absoluteFullSize from '@/style/absolute_full_size';
import { Musicbill as MusicbillType } from '../../constants';

const Style = styled(NavLink)`
  padding: 5px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  text-decoration: none;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  background-color: transparent;
  transition: 300ms;

  > .cover-box {
    font-size: 0;
  }

  > .name {
    flex: 1;
    min-width: 0;

    font-size: 14px;
    ${ellipsis}
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }

  &.public {
    > .cover-box {
      outline: 2px solid #63d1fa;
    }
  }

  &.shared {
    > .cover-box {
      position: relative;

      &::after {
        content: '';

        box-shadow: inset 0 0 0 2px #eabec8;

        ${absoluteFullSize}
      }
    }
  }

  &.active {
    color: #fff;
    background-color: ${CSSVariable.COLOR_PRIMARY} !important;

    > .cover {
      outline-color: #fff;
    }
  }
`;

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  return (
    <Style
      className={classnames({
        public: musicbill.public,
        shared: musicbill.shareStatus !== MusicbillShareStatus.NOT_SHARE,
      })}
      to={`${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSICBILL.replace(
        ':id',
        musicbill.id,
      )}`}
    >
      <div className="cover-box">
        <Cover size={28} src={musicbill.cover} className="cover" />
      </div>
      <div className="name">{musicbill.name}</div>
    </Style>
  );
}

export default Musicbill;
