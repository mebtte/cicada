import {
  CSSProperties,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import { DragIndicator, Close, Shuffle, Locate } from '@/components/icon';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexCenter } from '@/style/flexbox';
import Empty from '@/components/empty';
import VirtualList from '@/components/virtual_list';
import absoluteFullSize from '@/style/absolute_full_size';
import { CSSVariable } from '@/global_style';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { IS_TOUCHABLE } from '@/constants/browser';
import Context from '../context';
import TabContent from './tab_content';
import MusicBase from '../components/music_base';
import { QueueMusic, ZIndex } from '../constants';
import { TAB_LIST_HEIGHT } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import RemovalAnimationItem from './removal_animation_item';
import useRemovalAnimation from './use_removal_animation';

const LIST_BOTTOM_SPACE = TAB_LIST_HEIGHT + 32;
const DRAG_OVERLAY_Z_INDEX = ZIndex.FLOATING;

const shuffleStyle: CSSProperties = {
  width: 24,
  color: CSSVariable.COLOR_PRIMARY,
};
// Tooltip 需要可接收 ref 的元素作为锚点, 这里用 span 保持定位稳定.
const shuffleWrapperStyle: CSSProperties = {
  display: 'inline-flex',
};
const Style = styled(TabContent)`
  > .content {
    ${absoluteFullSize}

    background: rgb(247 247 247);

    &.list {
      overflow: auto;
      padding: 0 16px;
      ${autoScrollbar}
    }

    &.empty {
      ${flexCenter}
    }
  }
`;
const Operation = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;
const SortableItem = styled.div<{ $dragging: boolean }>`
  opacity: ${({ $dragging }) => ($dragging ? 0.42 : 1)};
`;
const DragActivator = styled.span`
  display: inline-flex;
  touch-action: none;

  > button {
    cursor: grab;
  }

  > button:active {
    cursor: grabbing;
  }
`;
const removeStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

function QueueMusicItem({
  active,
  canRemove,
  dragHandle,
  queueMusic,
}: {
  active: boolean;
  canRemove: boolean;
  dragHandle?: ReactNode;
  queueMusic: QueueMusic;
}) {
  return (
    <MusicBase
      index={queueMusic.index}
      music={queueMusic}
      active={active}
      lineAfter={
        <Operation>
          {queueMusic.shuffle ? (
            <Tooltip content={t('shuffle_play')}>
              <span style={shuffleWrapperStyle}>
                <Shuffle style={shuffleStyle} />
              </span>
            </Tooltip>
          ) : null}
          {dragHandle}
          {!active ? (
            <Tooltip content={t('play_from_here')}>
              <Button
                square
                variant="ghost"
                size="sm"
                aria-label={t('play_from_here')}
                onClick={(e) => {
                  e.stopPropagation();
                  return playerEventemitter.emit(
                    PlayerEventType.ACTION_LOCATE_PLAYQUEUE_MUSIC,
                    {
                      pid: queueMusic.pid,
                    },
                  );
                }}
              >
                <Locate />
              </Button>
            </Tooltip>
          ) : null}
          {canRemove ? (
            <Button
              square
              variant="ghost"
              size="sm"
              style={removeStyle}
              onClick={(e) => {
                e.stopPropagation();
                return playerEventemitter.emit(
                  PlayerEventType.ACTION_REMOVE_PLAYQUEUE_MUSIC,
                  {
                    queueMusic,
                  },
                );
              }}
            >
              <Close />
            </Button>
          ) : null}
        </Operation>
      }
    />
  );
}

function SortableQueueMusicItem({
  active,
  canRemove,
  queueMusic,
}: {
  active: boolean;
  canRemove: boolean;
  queueMusic: QueueMusic;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: queueMusic.pid });

  return (
    <SortableItem
      ref={setNodeRef}
      $dragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <QueueMusicItem
        active={active}
        canRemove={canRemove}
        queueMusic={queueMusic}
        dragHandle={
          <DragActivator {...attributes} {...listeners}>
            <Button
              square
              variant="ghost"
              size="sm"
              title={t('sort')}
              aria-label={t('sort')}
              onClick={(e) => e.stopPropagation()}
            >
              <DragIndicator />
            </Button>
          </DragActivator>
        }
      />
    </SortableItem>
  );
}

function PlayqueueDragOverlay({
  activeQueueMusic,
}: {
  activeQueueMusic: QueueMusic | null;
}) {
  if (typeof document === 'undefined') {
    return null;
  }

  // Overlay 脱离抽屉层级, 避免移动端拖拽时被滚动容器或面板裁剪.
  return createPortal(
    <DragOverlay zIndex={DRAG_OVERLAY_Z_INDEX}>
      {activeQueueMusic ? (
        <QueueMusicItem
          active={false}
          canRemove={false}
          queueMusic={activeQueueMusic}
        />
      ) : null}
    </DragOverlay>,
    document.body,
  );
}

function Playqueue() {
  const { currentPlayqueuePosition, playqueue } = useContext(Context);
  const { height: titlebarAreaHeight } = useTitlebarArea();
  const listRef = useRef<HTMLDivElement>(null);
  const [activePid, setActivePid] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: IS_TOUCHABLE ? 250 : 0, tolerance: 5 },
    }),
  );

  const renderedPlayqueue = useMemo(() => [...playqueue].reverse(), [playqueue]);
  const getPlayqueueItemKey = useCallback(
    (queueMusic: QueueMusic) => queueMusic.pid,
    [],
  );
  const { finishRemoval, renderedItems: animatedPlayqueue } = useRemovalAnimation(
    renderedPlayqueue,
    getPlayqueueItemKey,
  );
  const leavingIndexes = useMemo(
    () =>
      animatedPlayqueue.flatMap((item, index) =>
        item.leaving ? [index] : [],
      ),
    [animatedPlayqueue],
  );
  const activeItemIndex = useMemo(
    () =>
      activePid
        ? animatedPlayqueue.findIndex((item) => item.key === activePid)
        : -1,
    [activePid, animatedPlayqueue],
  );
  const forceRenderIndexes = useMemo(
    () =>
      activeItemIndex >= 0
        ? [...new Set([...leavingIndexes, activeItemIndex])]
        : leavingIndexes,
    [activeItemIndex, leavingIndexes],
  );
  const followingMusicCount = playqueue.length - currentPlayqueuePosition - 1;
  const canReorderFollowingMusic = followingMusicCount > 1;
  const sortableIds = useMemo(
    () =>
      canReorderFollowingMusic
        ? renderedPlayqueue
            .filter(
              (queueMusic) => queueMusic.index - 1 > currentPlayqueuePosition,
            )
            .map((queueMusic) => queueMusic.pid)
        : [],
    [canReorderFollowingMusic, currentPlayqueuePosition, renderedPlayqueue],
  );
  const activeQueueMusic = activePid
    ? (playqueue.find((queueMusic) => queueMusic.pid === activePid) ?? null)
    : null;
  const listTopSpace = titlebarAreaHeight + 12;
  const onDragStart = ({ active }: DragStartEvent) =>
    setActivePid(String(active.id));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActivePid(null);
    if (!over || active.id === over.id) {
      return;
    }

    return playerEventemitter.emit(
      PlayerEventType.ACTION_REORDER_PLAYQUEUE_MUSIC,
      {
        activePid: String(active.id),
        overPid: String(over.id),
      },
    );
  };
  const onDragCancel = () => setActivePid(null);

  return (
    <Style>
      {animatedPlayqueue.length ? (
        <div className="content list" ref={listRef}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <VirtualList
                count={animatedPlayqueue.length}
                // 拖拽时保留源节点, 避免虚拟列表滚动回收后 dnd-kit 失去测量锚点.
                forceRenderIndexes={forceRenderIndexes}
                getItemKey={(index) => animatedPlayqueue[index].key}
                paddingStart={listTopSpace}
                paddingEnd={LIST_BOTTOM_SPACE}
                scrollElementRef={listRef}
                renderItem={(index, _key, { requestMeasure }) => {
                  const animatedQueueMusic = animatedPlayqueue[index];
                  const queueMusic = animatedQueueMusic.item;
                  const actualIndex = queueMusic.index - 1;
                  const active =
                    !animatedQueueMusic.leaving &&
                    actualIndex === currentPlayqueuePosition;
                  const canRemove =
                    !animatedQueueMusic.leaving &&
                    actualIndex > currentPlayqueuePosition;
                  const sortable = canRemove && canReorderFollowingMusic;
                  return (
                    <RemovalAnimationItem
                      itemKey={animatedQueueMusic.key}
                      leaving={animatedQueueMusic.leaving}
                      finishRemoval={finishRemoval}
                      requestMeasure={requestMeasure}
                    >
                      {sortable ? (
                        <SortableQueueMusicItem
                          active={active}
                          canRemove={canRemove}
                          queueMusic={queueMusic}
                        />
                      ) : (
                        <QueueMusicItem
                          active={active}
                          canRemove={canRemove}
                          queueMusic={queueMusic}
                        />
                      )}
                    </RemovalAnimationItem>
                  );
                }}
              />
            </SortableContext>
            <PlayqueueDragOverlay activeQueueMusic={activeQueueMusic} />
          </DndContext>
        </div>
      ) : (
        <div
          className="content empty"
          style={{
            paddingTop: titlebarAreaHeight + 12,
            paddingBottom: LIST_BOTTOM_SPACE,
          }}
        >
          <Empty description={t('empty_playqueue')} />
        </div>
      )}
    </Style>
  );
}

export default Playqueue;
