import styled from 'styled-components';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { NavLink } from 'react-router-dom';
import { type MouseEvent } from 'react';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import getResizedImage from '@/server/asset/get_resized_image';
import Cover from '@/components/cover';
import { Musicbill as MusicbillType } from '../../constants';
import { CSS_VAR } from '@/components/theme';
import useSidebarNavigate from '../use_sidebar_navigate';

const COVER_SIZE = 26;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const PUBLIC = '#63d1fa';
const PUBLIC_SHADOW = 'rgb(72 179 220)';
const NEUTRAL_SHADOW = CSSVariable.COLOR_NEUTRAL_SHADOW;

const Style = styled(NavLink)`
  min-height: 40px;
  padding: 0 12px;
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

  &:not(.active) {
    background: #fff;
    border-color: ${CSSVariable.COLOR_BORDER};
    box-shadow: 0 3px 0 ${NEUTRAL_SHADOW};
  }

  &:not(.active):hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 0 ${NEUTRAL_SHADOW};
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
    transform: translateY(-2px);
    box-shadow: 0 6px 0 ${PRIMARY_SHADOW};
  }

  &.active:active {
    box-shadow: none;
  }
`;
const CoverArt = styled(Cover)<{ $public: boolean }>`
  flex: 0 0 auto;
  box-sizing: border-box;
  overflow: hidden;

  background: #fff;
  border: 2px solid
    ${({ $public }) => ($public ? PUBLIC : CSSVariable.COLOR_BORDER)};
  border-radius: 9px;
  box-shadow: 0 3px 0
    ${({ $public }) => ($public ? PUBLIC_SHADOW : NEUTRAL_SHADOW)};
`;

function shouldUseBrowserNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  );
}

function Musicbill({ musicbill }: { musicbill: MusicbillType }) {
  const navigate = useSidebarNavigate();
  const to = `${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSICBILL.replace(
    ':id',
    musicbill.id,
  )}`;

  return (
    <Style
      to={to}
      onClick={(event) => {
        if (shouldUseBrowserNavigation(event)) {
          return;
        }

        event.preventDefault();
        navigate(to);
      }}
    >
      <CoverArt
        $public={musicbill.public}
        size={COVER_SIZE}
        src={getResizedImage({ url: musicbill.cover, size: COVER_SIZE * 2 })}
      />
      <div className="name">{musicbill.name}</div>
    </Style>
  );
}

export default Musicbill;
