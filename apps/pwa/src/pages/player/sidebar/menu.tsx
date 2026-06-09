import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { useLocation } from 'react-router-dom';
import { ReactNode, useContext } from 'react';
import { t } from '@/i18n';
import context from '../context';
import { ENABLE_FILE_SYSTEM } from '@/constants/browser';
import ExportTag from './export_tag';
import { useUser } from '@/global_states/server';
import styled, { css } from 'styled-components';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import capitalize from '@/style/capitalize';
import {
  Export,
  ExternalLink,
  Sparkles,
  Settings,
  History,
  AdminPanel,
} from '@/components/icon';
import useSidebarNavigate from './use_sidebar_navigate';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;

const Style = styled.nav`
  padding: 0 12px;

  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.button<{ $active: boolean }>`
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0 12px;

  display: flex;
  align-items: center;
  gap: 10px;

  border: 2px solid transparent;
  border-radius: 15px;
  background: transparent;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: 0;
  text-align: left;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out,
    background 150ms ease-out,
    color 150ms ease-out,
    filter 120ms ease-out;

  > .label {
    flex: 1;
    min-width: 0;

    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    ${capitalize}
  }

  > .suffix {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;

    > svg {
      width: 16px;
      height: 16px;
    }
  }

  > svg {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
  }

  &:focus-visible {
    outline: 3px solid ${PRIMARY};
    outline-offset: 2px;
  }

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: ${({ $active }) =>
      $active
        ? `0 6px 0 ${PRIMARY_SHADOW}`
        : `0 5px 0 ${CSSVariable.COLOR_SURFACE_SHADOW}`};
  }

  ${({ $active }) =>
    !$active &&
    css`
      background: #fff;
      border-color: ${CSSVariable.COLOR_BORDER};
      box-shadow: 0 3px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};

      &:not(:disabled):hover {
        box-shadow: 0 5px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};
      }
    `}

  &:not(:disabled):active {
    transform: translateY(3px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }

  ${({ $active }) =>
    $active &&
    css`
      color: #fff;
      background: ${PRIMARY};
      border-color: ${PRIMARY_SHADOW};
      box-shadow: 0 4px 0 ${PRIMARY_SHADOW};

      &:not(:disabled):hover {
        box-shadow: 0 6px 0 ${PRIMARY_SHADOW};
      }

      &:not(:disabled):active {
        box-shadow: none;
      }
    `}
`;

function SidebarItem({
  active,
  icon,
  label,
  suffix,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  suffix?: ReactNode;
  onClick: () => void;
}) {
  return (
    <Item
      type="button"
      $active={active}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      {icon}
      <span className="label">{label}</span>
      {suffix ? <span className="suffix">{suffix}</span> : null}
    </Item>
  );
}

function Menu() {
  const { pathname } = useLocation();
  const navigate = useSidebarNavigate();
  const user = useUser()!;

  const { exportingMusicList } = useContext(context);
  return (
    <Style aria-label={t('sidebar')}>
      <SidebarItem
        active={
          pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.EXPLORATION}` ||
          pathname === ROOT_PATH.PLAYER
        }
        onClick={() =>
          navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.EXPLORATION}`)
        }
        label={t('exploration')}
        icon={<Sparkles />}
      />
      <SidebarItem
        active={
          pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSIC_PLAY_RECORD}`
        }
        onClick={() =>
          navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSIC_PLAY_RECORD}`)
        }
        label={t('music_play_record_short')}
        icon={<History />}
      />
      <SidebarItem
        active={pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.SETTING}`}
        onClick={() => navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.SETTING}`)}
        label={t('setting')}
        icon={<Settings />}
      />
      {ENABLE_FILE_SYSTEM && exportingMusicList.length ? (
        <SidebarItem
          active={
            pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.EXPORTING_MUSIC}`
          }
          onClick={() =>
            navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.EXPORTING_MUSIC}`)
          }
          label={t('export_music')}
          icon={<Export />}
          suffix={<ExportTag />}
        />
      ) : null}
      {user.admin ? (
        <SidebarItem
          active={false}
          onClick={() =>
            window.open(`#${ROOT_PATH.ADMIN}`, '_blank', 'noopener,noreferrer')
          }
          label={t('admin_panel')}
          icon={<AdminPanel />}
          suffix={<ExternalLink aria-hidden="true" />}
        />
      ) : null}
    </Style>
  );
}

export default Menu;
