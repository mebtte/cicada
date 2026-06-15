import { useMemo, type KeyboardEvent } from 'react';
import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import capitalize from '@/style/capitalize';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import { RelatedPublicMusicbill } from './constants';
import { PAGE_HORIZONTAL_PADDING } from '../pages/page';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const RELATED_PUBLIC_MUSICBILL_LIMIT = 5;
const COVER_IMAGE_SIZE = 72;

const Style = styled.section`
  margin: 22px ${PAGE_HORIZONTAL_PADDING} 4px;

  > .label {
    margin-bottom: 10px;

    color: rgb(75 75 75);
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    font-weight: 800;
    line-height: 1.2;
    ${capitalize}
  }

  > .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`;
const Item = styled.div`
  min-height: 72px;
  padding: 8px 10px 12px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  gap: 12px;

  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 14px;
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  cursor: pointer;
  user-select: none;
  transition:
    transform 120ms ease-out,
    box-shadow 120ms ease-out,
    filter 120ms ease-out;

  > .cover-frame {
    flex: 0 0 58px;
    width: 58px;
    height: 58px;
    padding: 2px;
    box-sizing: border-box;

    background: #fff;
    border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
    border-radius: 10px;
    box-shadow: 0 2px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  }

  > .cover-frame > .cover {
    width: 100%;
    height: 100%;
    border-radius: 6px;
  }

  > .info {
    flex: 1;
    min-width: 0;
  }

  > .info > .name {
    color: rgb(55 55 55);
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    font-weight: 800;
    line-height: 1.25;
    ${ellipsis}
  }

  > .info > .owner {
    margin-top: 3px;

    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 800;
    line-height: 1.3;
    ${ellipsis}
  }

  > .info > .owner > button {
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;

    &:hover {
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }
  }

  > .count {
    flex: 0 0 48px;
    min-width: 48px;
    padding-left: 10px;
    box-sizing: border-box;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    border-left: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    line-height: 1.05;
  }

  > .count > .value {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    font-weight: 900;
  }

  > .count > .label {
    margin-top: 3px;

    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 800;
    text-transform: capitalize;
  }

  &:hover {
    background: #fff;
  }

  &:active {
    background: #fff;
    transform: translateY(4px);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 3px solid rgb(255 184 28);
    outline-offset: 3px;
  }
`;

function sampleMusicbillList(musicbillList: RelatedPublicMusicbill[]) {
  if (musicbillList.length <= RELATED_PUBLIC_MUSICBILL_LIMIT) {
    return musicbillList;
  }

  // 后端按 5 个随机抽样返回；这里兜底处理超量数据, 保证 drawer 展示数量稳定。
  const pool = [...musicbillList];
  for (let i = 0; i < RELATED_PUBLIC_MUSICBILL_LIMIT; i += 1) {
    const randomIndex = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[randomIndex]] = [pool[randomIndex], pool[i]];
  }
  return pool.slice(0, RELATED_PUBLIC_MUSICBILL_LIMIT);
}

const openMusicbillDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_DRAWER, { id });

const openUserDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, { id });

function RelatedPublicMusicbillList({
  musicbillList,
}: {
  musicbillList: RelatedPublicMusicbill[];
}) {
  const sampledMusicbillList = useMemo(
    () => sampleMusicbillList(musicbillList),
    [musicbillList],
  );

  if (!sampledMusicbillList.length) {
    return null;
  }

  const handleItemKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    id: string,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openMusicbillDrawer(id);
    }
  };

  return (
    <Style>
      <div className="label">{t('related_public_musicbill')}</div>
      <div className="list">
        {sampledMusicbillList.map((musicbill) => (
          <Item
            key={musicbill.id}
            role="button"
            tabIndex={0}
            aria-label={musicbill.name}
            onClick={() => openMusicbillDrawer(musicbill.id)}
            onKeyDown={(event) => handleItemKeyDown(event, musicbill.id)}
          >
            <div className="cover-frame">
              <Cover
                className="cover"
                shape={Shape.ROUNDED}
                src={getResizedImage({
                  url: musicbill.cover,
                  size: Math.ceil(COVER_IMAGE_SIZE * window.devicePixelRatio),
                })}
                size="100%"
              />
            </div>
            <div className="info">
              <div className="name">{musicbill.name}</div>
              <div className="owner">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openUserDrawer(musicbill.user.id);
                  }}
                >
                  {musicbill.user.nickname}
                </button>
              </div>
            </div>
            <div
              className="count"
              aria-label={t('music_count', musicbill.musicCount.toString())}
            >
              <span className="value">{musicbill.musicCount}</span>
              <span className="label">{t('music')}</span>
            </div>
          </Item>
        ))}
      </div>
    </Style>
  );
}

export default RelatedPublicMusicbillList;
