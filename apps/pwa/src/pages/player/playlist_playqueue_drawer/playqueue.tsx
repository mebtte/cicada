import {
  CSSProperties,
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import Button from '@/components/button';
import { MdDragIndicator, MdOutlineClose, MdShuffle } from 'react-icons/md';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
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
import absoluteFullSize from '@/style/absolute_full_size';
import { CSSVariable } from '@/global_style';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { IS_TOUCHABLE } from '@/constants/browser';
import Context from '../context';
import TabContent from './tab_content';
import MusicBase from '../components/music_base';
import { QueueMusic } from '../constants';
import { TAB_LIST_HEIGHT } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const ROW_HEIGHT = 82;
const LIST_BOTTOM_SPACE = TAB_LIST_HEIGHT + 32;

const shuffleStyle: CSSProperties = {
  width: 24,
  color: CSSVariable.COLOR_PRIMARY,
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
const VirtualList = styled.div`
  position: relative;
  width: 100%;
`;
const VirtualRow = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
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
  dragHandle,
  queueMusic,
  showActions = true,
}: {
  active: boolean;
  dragHandle?: ReactNode;
  queueMusic: QueueMusic;
  showActions?: boolean;
}) {
  return (
    <MusicBase
      index={queueMusic.index}
      music={queueMusic}
      active={active}
      lineAfter={
        <Operation>
          {queueMusic.shuffle ? (
            <MdShuffle
              style={shuffleStyle}
              title={t('pick_from_playlist_randomly')}
            />
          ) : null}
          {dragHandle}
          {showActions ? (
            <Button
              square
              variant="plain"
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
              <MdOutlineClose />
            </Button>
          ) : null}
        </Operation>
      }
    />
  );
}

function SortableQueueMusicItem({
  active,
  queueMusic,
}: {
  active: boolean;
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
        queueMusic={queueMusic}
        dragHandle={
          <DragActivator {...attributes} {...listeners}>
            <Button
              square
              variant="plain"
              size="sm"
              title={t('sort')}
              aria-label={t('sort')}
              onClick={(e) => e.stopPropagation()}
            >
              <MdDragIndicator />
            </Button>
          </DragActivator>
        }
      />
    </SortableItem>
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

  const { length } = playqueue;
  const renderedPlayqueue = useMemo(() => [...playqueue].reverse(), [playqueue]);
  const sortableIds = useMemo(
    () =>
      renderedPlayqueue
        .filter((queueMusic) => queueMusic.index - 1 > currentPlayqueuePosition)
        .map((queueMusic) => queueMusic.pid),
    [currentPlayqueuePosition, renderedPlayqueue],
  );
  const activeQueueMusic = activePid
    ? playqueue.find((queueMusic) => queueMusic.pid === activePid)
    : null;
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: length,
    estimateSize: () => ROW_HEIGHT,
    getItemKey: (index) => renderedPlayqueue[index]?.pid ?? index,
    getScrollElement: () => listRef.current,
    overscan: 8,
    paddingEnd: LIST_BOTTOM_SPACE,
    paddingStart: titlebarAreaHeight + 12,
    useFlushSync: false,
  });
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
      {playqueue.length ? (
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
              <VirtualList style={{ height: rowVirtualizer.getTotalSize() }}>
                {rowVirtualizer
                  .getVirtualItems()
                  .map((virtualItem: VirtualItem) => {
                    const queueMusic = renderedPlayqueue[virtualItem.index];
                    const actualIndex = queueMusic.index - 1;
                    const sortable = actualIndex > currentPlayqueuePosition;

                    return (
                      <VirtualRow
                        key={virtualItem.key}
                        style={{
                          height: virtualItem.size,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        {sortable ? (
                          <SortableQueueMusicItem
                            active={actualIndex === currentPlayqueuePosition}
                            queueMusic={queueMusic}
                          />
                        ) : (
                          <QueueMusicItem
                            active={actualIndex === currentPlayqueuePosition}
                            queueMusic={queueMusic}
                            showActions={false}
                          />
                        )}
                      </VirtualRow>
                    );
                  })}
              </VirtualList>
            </SortableContext>
            <DragOverlay>
              {activeQueueMusic ? (
                <QueueMusicItem
                  active={false}
                  queueMusic={activeQueueMusic}
                  showActions={false}
                />
              ) : null}
            </DragOverlay>
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
