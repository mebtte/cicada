import styled from 'styled-components';
import { memo } from 'react';
import { animated, useTransition } from 'react-spring';
import { Drawer, DrawerContent } from '@/components';
import autoScrollbar from '@/style/auto_scrollbar';
import Empty from '@/components/empty';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { QueueMusic } from '@/pages/player/constants';
import { MusicBase } from '@/features/music/components';
import useDynamicZIndex from '@/pages/player/use_dynamic_z_index';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '@/pages/player/eventemitter';

const Content = styled.div`
  position: relative;
  height: 100%;

  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
const ScrollContent = styled.div`
  flex: 1;
  min-height: 0;

  padding: 16px;

  overflow: auto;
  ${autoScrollbar}
`;
const EmptyContent = styled.div`
  flex: 1;
  min-height: 0;

  display: flex;
  align-items: center;
  justify-content: center;
`;
const Section = styled.div`
  margin-bottom: 8px;

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  font-weight: 800;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;
const Row = styled(animated.div)`
  will-change: transform, opacity;
`;

interface RadioQueueDrawerProps {
  open: boolean;
  onClose: () => void;
  queue: QueueMusic[];
  currentIndex: number;
}

function RadioQueueDrawer({
  open,
  onClose,
  queue,
  currentIndex,
}: RadioQueueDrawerProps) {
  // 复用主播放器的 playqueue drawer 事件参与 z-index 分层, 否则后续弹起的
  // MusicDrawer / ArtistDrawer 会被本抽屉遮挡.
  const zIndex = useDynamicZIndex(PlayerEventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER);
  // 与主播放器一致: 逆序展示 (最新预取的在顶部, 当前播放居中, 已播放的在底部).
  const rendered = [...queue].reverse();
  const transitions = useTransition(rendered, {
    keys: (qm: QueueMusic) => qm.pid,
    from: {
      opacity: 0,
      transform: 'translate3d(36px, -16px, 0) scale(0.92)',
      maxHeight: '0px',
    },
    enter: {
      opacity: 1,
      transform: 'translate3d(0px, 0px, 0) scale(1)',
      maxHeight: '160px',
    },
    leave: {
      opacity: 0,
      transform: 'translate3d(36px, 0px, 0) scale(0.95)',
      maxHeight: '0px',
    },
    config: { tension: 240, friction: 26 },
  });
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        side="right"
        style={{ width: 320 }}
        zIndex={zIndex}
        accessibleTitle={t('playqueue')}
      >
        <Content>
          {rendered.length ? (
            <ScrollContent>
              <Section>{t('playqueue')}</Section>
              {transitions((style, qm) => {
                const idx = queue.indexOf(qm);
                return (
                  <Row style={style}>
                    <MusicBase
                      index={idx + 1}
                      music={qm}
                      active={idx === currentIndex}
                      lineAfter={null}
                      onOpenMusic={(music) =>
                        playerEventemitter.emit(
                          PlayerEventType.OPEN_MUSIC_DRAWER,
                          { id: music.id },
                        )
                      }
                      onOpenSinger={(singer) =>
                        playerEventemitter.emit(
                          PlayerEventType.OPEN_ARTIST_DRAWER,
                          { id: singer.id },
                        )
                      }
                    />
                  </Row>
                );
              })}
            </ScrollContent>
          ) : (
            <EmptyContent>
              <Empty description={t('empty_playqueue')} />
            </EmptyContent>
          )}
        </Content>
      </DrawerContent>
    </Drawer>
  );
}

export default memo(RadioQueueDrawer);
