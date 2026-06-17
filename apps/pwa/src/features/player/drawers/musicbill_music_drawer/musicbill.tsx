import { memo } from 'react';
import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import { Refresh, Check } from '@/components/icon';
import { RequestStatus } from '@/constants';
import Spinner from '@/components/spinner';
import ellipsis from '@/style/ellipsis';
import getResizedImage from '@/server/asset/get_resized_image';
import {
  MusicWithArtistAliases,
  Musicbill as MusicbillType,
} from '../../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import MusicbillCover from '../../components/musicbill_cover';

const ICON_SIZE = 24;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const PUBLIC = '#63d1fa';
const PUBLIC_SHADOW = 'rgb(72 179 220)';
const NEUTRAL_SHADOW = CSSVariable.COLOR_NEUTRAL_SHADOW;
const CONTROL_NEUTRAL = CSSVariable.COLOR_NEUTRAL_SHADOW;
const COVER_SIZE = 28;
const COVER_INNER_SIZE = COVER_SIZE - 4;
const CHECKBOX_SIZE = 24;

const Style = styled.div<{ $public: boolean; $selected: boolean }>`
  min-height: 48px;
  padding: 10px;
  margin: 0 12px 10px;

  display: flex;
  align-items: center;
  gap: 10px;

  cursor: pointer;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  background: ${({ $selected }) => ($selected ? PRIMARY : '#fff')};
  border: 2px solid
    ${({ $selected }) =>
      $selected ? PRIMARY_SHADOW : CSSVariable.COLOR_BORDER};
  border-radius: 14px;
  box-shadow: 0 4px 0
    ${({ $selected }) => ($selected ? PRIMARY_SHADOW : NEUTRAL_SHADOW)};
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out,
    background 150ms ease-out,
    color 150ms ease-out,
    filter 120ms ease-out;

  &:hover {
    filter: brightness(1.04);
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }

  > .icon {
    width: ${ICON_SIZE}px;
    height: ${ICON_SIZE}px;
    flex: 0 0 auto;
    color: ${({ $selected }) =>
      $selected ? '#fff' : CSSVariable.TEXT_COLOR_SECONDARY};
  }

  > .cover {
    flex: 0 0 auto;
    width: ${COVER_SIZE}px;
    height: ${COVER_SIZE}px;
    box-sizing: border-box;

    display: flex;
    align-items: center;
    justify-content: center;

    overflow: hidden;
    background: #fff;
    border: 2px solid
      ${({ $public, $selected }) =>
        $public
          ? PUBLIC
          : $selected
            ? '#fff'
            : CSSVariable.COLOR_BORDER};
    border-radius: 9px;
    box-shadow: 0 3px 0
      ${({ $public, $selected }) =>
        $public
          ? PUBLIC_SHADOW
          : $selected
            ? 'rgb(255 255 255 / 0.42)'
            : NEUTRAL_SHADOW};
  }

  > .name {
    flex: 1;
    min-width: 0;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    letter-spacing: 0;
    color: ${({ $selected }) =>
      $selected ? '#fff' : CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }
`;
const Checkbox = styled.span<{ $checked: boolean }>`
  flex: 0 0 auto;
  width: ${CHECKBOX_SIZE}px;
  height: ${CHECKBOX_SIZE}px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #fff;
  background: ${({ $checked }) => ($checked ? PRIMARY : '#fff')};
  border: 2px solid
    ${({ $checked }) => ($checked ? PRIMARY_SHADOW : CONTROL_NEUTRAL)};
  border-radius: 8px;
  box-shadow: 0 3px 0
    ${({ $checked }) => ($checked ? PRIMARY_SHADOW : CONTROL_NEUTRAL)};
  transition:
    background 150ms ease-out,
    border-color 150ms ease-out,
    box-shadow 150ms ease-out,
    transform 150ms ease-out;

  > svg {
    width: 16px;
    height: 16px;
    opacity: 1;
    transform: scale(${({ $checked }) => ($checked ? 1 : 0.72)});
    transition:
      opacity 120ms ease-out,
      transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  > .empty-check {
    opacity: 0;
  }

  > .refresh-icon {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    transform: scale(1);
  }
`;

function Musicbill({
  musicbill,
  music,
}: {
  musicbill: MusicbillType;
  music: MusicWithArtistAliases;
}) {
  const { id, status, musicList } = musicbill;
  const selected =
    status === RequestStatus.SUCCESS &&
    musicList.some((m) => m.id === music.id);

  return (
    <Style
      $public={musicbill.public}
      $selected={selected}
      onClick={() => {
        if (status === RequestStatus.SUCCESS) {
          if (selected) {
            return playerEventemitter.emit(
              PlayerEventType.REMOVE_MUSIC_FROM_MUSICBILL,
              { musicbill, music },
            );
          }
          return playerEventemitter.emit(
            PlayerEventType.ADD_MUSIC_TO_MUSICBILL,
            {
              musicbill,
              music,
            },
          );
        }
        if (status === RequestStatus.LOADING) {
          return;
        }
        return playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
          id,
          silence: false,
        });
      }}
    >
      {status === RequestStatus.SUCCESS ? (
        <Checkbox $checked={selected}>
          <Check className={selected ? undefined : 'empty-check'} />
        </Checkbox>
      ) : status === RequestStatus.LOADING ? (
        <Checkbox $checked={false}>
          <Spinner size={16} />
        </Checkbox>
      ) : (
        <Checkbox $checked={false}>
          <Refresh className="refresh-icon" />
        </Checkbox>
      )}
      <MusicbillCover
        className="cover"
        size={COVER_INNER_SIZE}
        src={getResizedImage({
          url: musicbill.cover,
          size: Math.ceil(COVER_INNER_SIZE * window.devicePixelRatio),
        })}
        publiz={false}
        shared={false}
      />
      <div className="name">{musicbill.name}</div>
    </Style>
  );
}

export default memo(Musicbill);
