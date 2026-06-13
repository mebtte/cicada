import styled, { css } from 'styled-components';
import {
  ExportingMusic,
  ExportStatus as ExportStatusType,
  FLOATING_CONTROLLER_SCROLL_SPACE,
} from '../../../constants';
import MusicBase from '../../../components/music_base';
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
import { MusicExportQuality } from '@/utils/music_export_asset';
import { PAGE_HORIZONTAL_PADDING } from '../../page';
import { Close, Restart } from '@/components/icon';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const SUMMARY_FLOATING_GAP = 12;
const SUMMARY_STAT_CARD_HEIGHT = 44;
const SUMMARY_GRID_GAP = 6;
const SUMMARY_PADDING_TOP = 8;
const SUMMARY_PADDING_BOTTOM = 10;
const SUMMARY_VERTICAL_BORDER = 4;
const SUMMARY_SHADOW_HEIGHT = 4;
const SUMMARY_HEIGHT =
  SUMMARY_PADDING_TOP +
  SUMMARY_STAT_CARD_HEIGHT +
  SUMMARY_PADDING_BOTTOM +
  SUMMARY_VERTICAL_BORDER +
  SUMMARY_SHADOW_HEIGHT;
const SUMMARY_RESERVED_SPACE = SUMMARY_FLOATING_GAP * 2 + SUMMARY_HEIGHT;

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

  position: absolute;
  left: 36px;
  right: 36px;
  top: ${SUMMARY_FLOATING_GAP}px;
  padding: ${SUMMARY_PADDING_TOP}px 10px ${SUMMARY_PADDING_BOTTOM}px;

  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 14px;
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};

  @media (max-width: 680px) {
    left: 24px;
    right: 24px;
  }

  @media (max-width: 420px) {
    left: 18px;
    right: 18px;
  }
`;
const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${SUMMARY_GRID_GAP}px;
`;
const statToneStyle = {
  total: css`
    --stat-color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    --stat-face: #fff;
    --stat-shadow: ${CSSVariable.COLOR_SURFACE_SHADOW};
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
  min-height: ${SUMMARY_STAT_CARD_HEIGHT}px;
  padding: 5px 8px 8px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;

  background: var(--stat-face);
  border: 2px solid var(--stat-shadow);
  border-radius: 12px;
  box-shadow: 0 3px 0 var(--stat-shadow);

  appearance: none;
  text-align: left;
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;

  ${({ $tone }) => statToneStyle[$tone]}

  > .value {
    color: var(--stat-color);
    font-size: 18px;
    font-weight: 900;
    line-height: 1;
  }

  > .label {
    display: block;
    min-width: 0;

    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    font-weight: 800;
    line-height: 1;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
        transform: translateY(3px);
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
const StatButton = styled.button<{
  $tone: keyof typeof statToneStyle;
  $interactive?: boolean;
}>`
  width: 100%;
  position: relative;
  ${statCardStyle}
`;
// 失败卡片右上角的重试图标, 提示用户该卡片可点击
const RetryHint = styled.span`
  position: absolute;
  top: 4px;
  right: 5px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  color: var(--stat-color);
  pointer-events: none;

  svg {
    display: block;
  }
`;
const EmptyState = styled.div`
  flex: 1;
  min-height: 0;
  padding-bottom: ${FLOATING_CONTROLLER_SCROLL_SPACE};

  display: flex;
  align-items: center;
  justify-content: center;
`;
const Queue = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  /* 为顶部悬浮状态栏预留空间，确保列表首项不会被遮挡。 */
  padding: ${SUMMARY_RESERVED_SPACE}px ${PAGE_HORIZONTAL_PADDING} 0;

  ${autoScrollbar}
  overflow: auto;

  &::after {
    content: '';
    display: block;
    height: ${FLOATING_CONTROLLER_SCROLL_SPACE};
  }
`;
const QueueItem = styled(animated.div)`
  overflow: hidden;
`;
/* 四种状态共用一颗 24px 高的胶囊 pill, 形状跟旁边的 QualityChip 同构, 仅靠配色 + 文案 + 前导图标区分 */
type StatusTone = 'waiting' | 'exporting' | 'successful' | 'failed';
const statusPillToneStyle: Record<StatusTone, ReturnType<typeof css>> = {
  waiting: css`
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    background: #fff;
    border-color: ${CSSVariable.COLOR_NEUTRAL_SHADOW};
    box-shadow: 0 3px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  `,
  exporting: css`
    color: rgb(58 122 0);
    background: rgb(232 255 218);
    border-color: rgb(184 220 167);
    box-shadow: 0 3px 0 rgb(184 220 167);
  `,
  successful: css`
    color: rgb(58 122 0);
    background: #fff;
    border-color: rgb(184 220 167);
    box-shadow: 0 3px 0 rgb(184 220 167);
  `,
  failed: css`
    /* MusicBase 给 lineAfter 内的 > button 注入了一组灰色基调 (specificity 0,4,2), 这里用 !important 强制覆盖, 避免失败 pill 退化成灰色方块 */
    color: ${CSSVariable.COLOR_DANGEROUS} !important;
    background: #fff !important;
    border-color: rgb(222 145 137) !important;
    box-shadow: 0 3px 0 rgb(222 145 137) !important;
  `,
};
const statusPillBase = css<{ $tone: StatusTone }>`
  height: 24px;
  padding: 0 10px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex: 0 0 auto;

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;

  border: 2px solid;
  border-radius: 999px;

  ${({ $tone }) => statusPillToneStyle[$tone]}

  svg {
    display: block;
    flex: 0 0 auto;
  }
`;
const StatusPill = styled.span<{ $tone: StatusTone }>`
  ${statusPillBase}
`;
const StatusPillButton = styled.button<{ $tone: StatusTone }>`
  ${statusPillBase}

  /* 同样需要强制覆盖 MusicBase 注入的 border-radius: 10px, 保持 pill 弧形 */
  border-radius: 999px !important;

  appearance: none;
  /* MusicBase 的 .Card cursor: pointer 会向下流, 而部分浏览器 button 元素 UA 样式会覆盖, 加 !important 确保失败 pill 上稳定显示手型, 提示用户可点击触发重试 */
  cursor: pointer !important;
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
const STATUS_ICON_SIZE = 12;
const removeStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

// 导出质量徽标的两套配色, 与右侧 StatusPill 同款 24px 胶囊形态, 仅靠配色区分原始/流畅.
const qualityChipStyle = {
  [MusicExportQuality.ORIGINAL]: css`
    color: rgb(44 76 138);
    background: rgb(232 240 255);
    border-color: rgb(170 190 225);
    box-shadow: 0 3px 0 rgb(170 190 225);
  `,
  [MusicExportQuality.SMOOTH]: css`
    color: rgb(20 105 115);
    background: rgb(220 245 247);
    border-color: rgb(140 200 210);
    box-shadow: 0 3px 0 rgb(140 200 210);
  `,
};
const QualityChip = styled.span<{ $quality: MusicExportQuality }>`
  height: 24px;
  padding: 0 9px;

  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
  text-transform: capitalize;

  border: 2px solid;
  border-radius: 999px;

  ${({ $quality }) => qualityChipStyle[$quality]}
`;

function getQualityLabel(quality: MusicExportQuality) {
  switch (quality) {
    case MusicExportQuality.ORIGINAL: {
      return t('music_export_quality_original');
    }
    case MusicExportQuality.SMOOTH: {
      return t('music_playback_quality_smooth');
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
  const { status, loaded, total } = exportingMusic;

  switch (status) {
    case ExportStatusType.WAITING: {
      const label = t('export_status_waiting');
      return (
        <StatusPill $tone="waiting" title={label} aria-label={label}>
          {label}
        </StatusPill>
      );
    }
    case ExportStatusType.EXPORTING: {
      /* Content-Length 已知时把百分比拼进文本; 未知时显示 Spinner 表达不确定态 */
      const hasProgress =
        typeof total === 'number' && total > 0 && typeof loaded === 'number';
      const pct = hasProgress
        ? Math.min(100, Math.round((loaded / total) * 100))
        : undefined;
      const base = t('export_status_exporting');
      const label = pct === undefined ? base : `${base} ${pct}%`;
      return (
        <StatusPill $tone="exporting" title={label} aria-label={label}>
          {label}
          {/* 未知进度时 Spinner 放在文字右侧, 表达"动作仍在持续"的尾随感, 跟左侧前导图标的其它状态作区分 */}
          {pct === undefined ? <Spinner size={STATUS_ICON_SIZE} /> : null}
        </StatusPill>
      );
    }
    case ExportStatusType.SUCCESSFUL: {
      const label = t('export_status_successful');
      return (
        <StatusPill $tone="successful" title={label} aria-label={label}>
          {label}
        </StatusPill>
      );
    }
    case ExportStatusType.FAILED: {
      /* 失败 pill 即操作: 整颗可点触发重试, 危险色文字 + 描边表达"出问题但可点重试" */
      const actionLabel = t('retry_failed_item');
      return (
        <StatusPillButton
          type="button"
          $tone="failed"
          title={actionLabel}
          aria-label={actionLabel}
          onClick={(event) => {
            event.stopPropagation();
            eventemitter.emit(EventType.EXPORT_MUSIC_LIST_RETRY_ITEM, {
              id: exportingMusic.id,
            });
          }}
        >
          {t('export_status_failed')}
          {/* 刷新箭头放在文字右侧, 作为可重试的尾随提示 */}
          <Restart size={STATUS_ICON_SIZE} />
        </StatusPillButton>
      );
    }
    default: {
      return null;
    }
  }
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
        {summary.failed ? (
          <StatButton
            type="button"
            $tone="failed"
            $interactive
            title={t('retry_failed_items')}
            aria-label={t('retry_failed_items')}
            onClick={() =>
              eventemitter.emit(EventType.EXPORT_MUSIC_LIST_RETRY_FAILED, null)
            }
          >
            <RetryHint aria-hidden="true">
              <Restart size={14} />
            </RetryHint>
            <div className="value">{summary.failed}</div>
            <div className="label">{t('export_status_failed')}</div>
          </StatButton>
        ) : (
          <StatCard $tone="failed">
            <div className="value">{summary.failed}</div>
            <div className="label">{t('export_status_failed')}</div>
          </StatCard>
        )}
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
                      {/* 标记此次导出选择的质量 (原始/流畅), 紧贴删除按钮放在右侧作为辅助元数据 */}
                      <QualityChip
                        $quality={exportingMusic.quality}
                        title={getQualityLabel(exportingMusic.quality)}
                        aria-label={getQualityLabel(exportingMusic.quality)}
                      >
                        {getQualityLabel(exportingMusic.quality)}
                      </QualityChip>
                      <Button
                        square
                        variant="ghost"
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
                            /* 移除进行中/等待中/失败的导出项属于破坏性操作, 确认按钮用 danger 变体提示风险 */
                            confirmVariant: 'danger',
                            onConfirm: removeItem,
                          });
                        }}
                      >
                        <Close style={removeStyle} />
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
