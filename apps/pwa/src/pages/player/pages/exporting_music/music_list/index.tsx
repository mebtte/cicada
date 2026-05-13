import styled, { css } from 'styled-components';
import {
  ExportingMusic,
  ExportStatus as ExportStatusType,
  FLOATING_CONTROLLER_SCROLL_SPACE,
} from '../../../constants';
import MusicBase from '../../../components/music_base';
import {
  MdAccessTime,
  MdClose,
  MdOutlineRestartAlt,
} from 'react-icons/md';
import { IconCheckCircle } from '@/components/icon';
import {
  CSSProperties,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { animated, useTransition } from 'react-spring';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '@/components/theme';
import Spinner from '@/components/spinner';
import autoScrollbar from '@/style/auto_scrollbar';
import context from '@/pages/player/context';
import Empty from '@/components/empty';
import Button from '@/components/button';
import eventemitter, { EventType } from '@/pages/player/eventemitter';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const BOTTOM_SCROLL_SPACE = `calc(${FLOATING_CONTROLLER_SCROLL_SPACE} + 16px)`;

const LineAfter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
const Style = styled.div`
  flex: 1;
  min-height: 0;

  position: relative;

  display: flex;
  flex-direction: column;

  overflow: hidden;
`;
const Summary = styled.div`
  z-index: 2;

  position: relative;
  flex: 0 0 auto;
  padding: 16px 16px 14px;

  background: #fff;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 4px 0 rgb(232 232 232);
`;
const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;
const statToneStyle = {
  total: css`
    --stat-color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    --stat-face: #fff;
    --stat-shadow: rgb(232 232 232);
  `,
  active: css`
    --stat-color: ${PRIMARY};
    --stat-face: rgb(232 255 218);
    --stat-shadow: ${PRIMARY_SHADOW};
  `,
  success: css`
    --stat-color: ${PRIMARY};
    --stat-face: #fff;
    --stat-shadow: rgb(184 220 167);
  `,
  failed: css`
    --stat-color: ${CSSVariable.COLOR_DANGEROUS};
    --stat-face: rgb(255 239 237);
    --stat-shadow: rgb(222 145 137);
  `,
};
const statCardStyle = css<{
  $tone: keyof typeof statToneStyle;
  $interactive?: boolean;
}>`
  min-width: 0;
  min-height: 66px;
  padding: 9px 12px 12px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;

  background: var(--stat-face);
  border: 2px solid var(--stat-shadow);
  border-radius: 16px;
  box-shadow: 0 4px 0 var(--stat-shadow);

  appearance: none;
  text-align: left;
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;

  ${({ $tone }) => statToneStyle[$tone]}

  > .value {
    color: var(--stat-color);
    font-size: 22px;
    font-weight: 900;
    line-height: 1.1;
  }

  > .label {
    display: flex;
    align-items: center;
    gap: 5px;

    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 800;
    line-height: 1.2;
    text-transform: capitalize;
    overflow-wrap: anywhere;

    > svg {
      flex: 0 0 auto;
      font-size: 16px;
      color: var(--stat-color);
    }
  }

  > .content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  > .content > .main {
    min-width: 0;

    > .value {
      color: var(--stat-color);
      font-size: 22px;
      font-weight: 900;
      line-height: 1.1;
    }

    > .label {
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      font-size: ${CSSVariable.TEXT_SIZE_SMALL};
      font-weight: 800;
      line-height: 1.2;
      text-transform: capitalize;
      overflow-wrap: anywhere;
    }
  }

  ${({ $interactive }) =>
    $interactive &&
    css`
      cursor: pointer;
      transition:
        transform 150ms ease-out,
        box-shadow 150ms ease-out,
        filter 120ms ease-out;

      &:not(:disabled):hover {
        filter: brightness(1.04);
      }

      &:not(:disabled):active {
        transform: translateY(4px);
        box-shadow: none;
        transition:
          transform 60ms ease-in,
          box-shadow 60ms ease-in,
          filter 60ms ease-in;
      }

      &:focus-visible {
        outline: 3px solid var(--stat-color);
        outline-offset: 3px;
      }

      &:disabled {
        cursor: not-allowed;
        filter: saturate(0.45);
        opacity: 0.65;
      }
    `}
`;
const StatCard = styled.div<{
  $tone: keyof typeof statToneStyle;
}>`
  ${statCardStyle}
`;
const EmptyState = styled.div`
  flex: 1;
  min-height: 0;
  padding-bottom: ${BOTTOM_SCROLL_SPACE};

  display: flex;
  align-items: center;
  justify-content: center;
`;
const Queue = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px 16px 0;

  ${autoScrollbar}
  overflow: auto;

  &::after {
    content: '';
    display: block;
    height: ${BOTTOM_SCROLL_SPACE};
  }
`;
const QueueItem = styled(animated.div)`
  overflow: hidden;
`;
const statusBadgeStyle = {
  [ExportStatusType.WAITING]: css`
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    background: #fff;
    border-color: rgb(210 210 210);
    box-shadow: 0 3px 0 rgb(185 185 185);
  `,
  [ExportStatusType.EXPORTING]: css`
    color: #fff;
    background: ${PRIMARY};
    border-color: ${PRIMARY_SHADOW};
    box-shadow: 0 3px 0 ${PRIMARY_SHADOW};
  `,
  [ExportStatusType.FAILED]: css`
    color: #fff;
    background: ${CSSVariable.COLOR_DANGEROUS};
    border-color: rgb(190 46 34);
    box-shadow: 0 3px 0 rgb(190 46 34);
  `,
};
const statusBadgeBase = css<{ $status: ExportStatusType }>`
  width: 34px;
  height: 34px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;

  border: 2px solid;
  border-radius: 10px;

  ${({ $status }) => statusBadgeStyle[$status]}

  svg {
    display: block;
  }

  .item {
    background-color: currentColor;
  }
`;
const StatusBadge = styled.span<{ $status: ExportStatusType }>`
  ${statusBadgeBase}
`;
const StatusIcon = styled.span`
  width: 34px;
  height: 34px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;

  color: ${PRIMARY};

  svg {
    display: block;
  }
`;
const StatusButton = styled.button<{ $status: ExportStatusType }>`
  ${statusBadgeBase}

  padding: 0;
  appearance: none;
  cursor: pointer;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms ease-out;

  &:hover {
    filter: brightness(1.05);
  }

  &:active {
    transform: translateY(3px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }

  &:focus-visible {
    outline: 3px solid ${CSSVariable.COLOR_DANGEROUS};
    outline-offset: 3px;
  }
`;
const EXPORT_STATUS_SIZE = 24;
const exportStatusStyle: CSSProperties = {
  fontSize: EXPORT_STATUS_SIZE,
};
const removeStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

function getExportStatusLabel(status: ExportStatusType) {
  switch (status) {
    case ExportStatusType.EXPORTING: {
      return t('export_status_exporting');
    }
    case ExportStatusType.WAITING: {
      return t('export_status_waiting');
    }
    case ExportStatusType.SUCCESSFUL: {
      return t('export_status_successful');
    }
    case ExportStatusType.FAILED: {
      return t('export_status_failed');
    }
    default: {
      return '';
    }
  }
}

function ExportStatus({
  exportingMusic,
}: {
  exportingMusic: ExportingMusic;
}) {
  const { status } = exportingMusic;
  const label = getExportStatusLabel(status);
  const content = (() => {
    switch (status) {
      case ExportStatusType.EXPORTING: {
        return <Spinner size={EXPORT_STATUS_SIZE} />;
      }
      case ExportStatusType.WAITING: {
        return <MdAccessTime style={exportStatusStyle} />;
      }
      case ExportStatusType.SUCCESSFUL: {
        return <IconCheckCircle style={exportStatusStyle} />;
      }
      case ExportStatusType.FAILED: {
        return <MdOutlineRestartAlt style={exportStatusStyle} />;
      }
      default: {
        return null;
      }
    }
  })();

  if (!content) {
    return null;
  }

  if (status === ExportStatusType.SUCCESSFUL) {
    return (
      <StatusIcon title={label} aria-label={label}>
        {content}
      </StatusIcon>
    );
  }

  if (status === ExportStatusType.FAILED) {
    return (
      <StatusButton
        type="button"
        $status={status}
        title={t('retry_failed_item')}
        aria-label={t('retry_failed_item')}
        onClick={(event) => {
          event.stopPropagation();
          eventemitter.emit(EventType.EXPORT_MUSIC_LIST_RETRY_ITEM, {
            id: exportingMusic.id,
          });
        }}
      >
        {content}
      </StatusButton>
    );
  }

  return (
    <StatusBadge $status={status} title={label} aria-label={label}>
      {content}
    </StatusBadge>
  );
}

function SummaryPanel({
  exportingMusicList,
}: {
  exportingMusicList: ExportingMusic[];
}) {
  const summary = useMemo(() => {
    const value = {
      waiting: 0,
      exporting: 0,
      successful: 0,
      failed: 0,
    };
    for (const exportingMusic of exportingMusicList) {
      switch (exportingMusic.status) {
        case ExportStatusType.WAITING: {
          value.waiting += 1;
          break;
        }
        case ExportStatusType.EXPORTING: {
          value.exporting += 1;
          break;
        }
        case ExportStatusType.SUCCESSFUL: {
          value.successful += 1;
          break;
        }
        case ExportStatusType.FAILED: {
          value.failed += 1;
          break;
        }
        default: {
          break;
        }
      }
    }
    return value;
  }, [exportingMusicList]);

  return (
    <Summary>
      <StatGrid>
        <StatCard $tone="total">
          <div className="value">{exportingMusicList.length}</div>
          <div className="label">{t('export_status_total')}</div>
        </StatCard>
        <StatCard $tone="active">
          <div className="value">{summary.exporting + summary.waiting}</div>
          <div className="label">{t('export_status_active')}</div>
        </StatCard>
        <StatCard $tone="success">
          <div className="value">{summary.successful}</div>
          <div className="label">{t('export_status_successful')}</div>
        </StatCard>
        <StatCard $tone="failed">
          <div className="content">
            <div className="main">
              <div className="value">{summary.failed}</div>
              <div className="label">{t('export_status_failed')}</div>
            </div>
            {summary.failed ? (
              <Button
                square
                variant="danger"
                size="sm"
                title={t('retry_failed_items')}
                aria-label={t('retry_failed_items')}
                onClick={() =>
                  eventemitter.emit(
                    EventType.EXPORT_MUSIC_LIST_RETRY_FAILED,
                    null,
                  )
                }
              >
                <MdOutlineRestartAlt />
              </Button>
            ) : null}
          </div>
        </StatCard>
      </StatGrid>
    </Summary>
  );
}

function MusicList() {
  const { exportingMusicList } = useContext(context);
  const length = exportingMusicList.length;
  const [showQueue, setShowQueue] = useState(length > 0);
  const shouldShowQueue = length > 0 || showQueue;
  const lengthRef = useRef(length);
  const displayIndexRef = useRef<Map<string, number>>(new Map());
  const displayIndexMap = useMemo(
    () =>
      new Map(
        exportingMusicList.map((exportingMusic, index) => [
          exportingMusic.id,
          length - index,
        ]),
      ),
    [exportingMusicList, length],
  );

  useEffect(() => {
    lengthRef.current = length;

    if (length > 0) {
      setShowQueue(true);
    }

    displayIndexMap.forEach((displayIndex, id) => {
      displayIndexRef.current.set(id, displayIndex);
    });
  }, [displayIndexMap, length]);

  const transitions = useTransition(exportingMusicList, {
    keys: (exportingMusic) => exportingMusic.id,
    from: {
      maxHeight: 0,
      opacity: 0,
      transform: 'translate3d(36px, 0, 0)',
    },
    enter: {
      maxHeight: 112,
      opacity: 1,
      transform: 'translate3d(0, 0, 0)',
    },
    leave: {
      maxHeight: 0,
      opacity: 0,
      transform: 'translate3d(100%, 0, 0)',
    },
    config: {
      tension: 360,
      friction: 32,
    },
    onDestroyed: (exportingMusic) => {
      displayIndexRef.current.delete(exportingMusic.id);

      if (lengthRef.current === 0 && displayIndexRef.current.size === 0) {
        setShowQueue(false);
      }
    },
  });

  return (
    <Style>
      {shouldShowQueue ? (
        <>
          <SummaryPanel exportingMusicList={exportingMusicList} />
          <Queue>
            {transitions((style, exportingMusic, _, index) => (
              <QueueItem style={style}>
                <MusicBase
                  index={
                    displayIndexMap.get(exportingMusic.id) ??
                    displayIndexRef.current.get(exportingMusic.id) ??
                    length - index
                  }
                  music={exportingMusic.music}
                  lineAfter={
                    <LineAfter>
                      <ExportStatus exportingMusic={exportingMusic} />
                      <Button
                        square
                        variant="plain"
                        size="sm"
                        title={t('delete')}
                        aria-label={t('delete')}
                        onClick={(event) => {
                          event.stopPropagation();
                          const removeItem = () =>
                            eventemitter.emit(
                              EventType.EXPORT_MUSIC_LIST_REMOVE_ITEM,
                              {
                                id: exportingMusic.id,
                              },
                            );
                          if (
                            exportingMusic.status ===
                            ExportStatusType.SUCCESSFUL
                          ) {
                            return removeItem();
                          }
                          return dialog.confirm({
                            content: t('remove_export_item_question'),
                            onConfirm: removeItem,
                          });
                        }}
                      >
                        <MdClose style={removeStyle} />
                      </Button>
                    </LineAfter>
                  }
                />
              </QueueItem>
            ))}
          </Queue>
        </>
      ) : (
        <EmptyState>
          <Empty description={t('no_export')} />
        </EmptyState>
      )}
    </Style>
  );
}

export default MusicList;
