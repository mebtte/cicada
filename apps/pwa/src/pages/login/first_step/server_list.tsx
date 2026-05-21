import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import styled from 'styled-components';
import { useServer } from '@/global_states/server';
import dialog from '@/utils/dialog';
import { Divider } from '@/components';
import { FONT, ServerCardItem } from './server_card';
import definition from '@/definition';
import { isSameMajorVersion } from '@/utils/version';
import { useCallback, useEffect, useRef, useState } from 'react';
import logger from '@/utils/logger';
import { getServerMetadataErrorMessage } from '../utils';

const Style = styled.div`
  > .label {
    font-family: ${FONT};
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: capitalize;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    margin-bottom: 10px;
  }

  > .scroll-shell {
    position: relative;

    > .server-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 216px;
      overflow-y: auto;
      padding-bottom: 4px;

      /* 隐藏原生滚动条, 避免 macOS overlay 滚动条遮挡卡片右侧;
       * 滚动状态由上方 .edge-shadow 渐变遮罩传达 */
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }

    /* 顶部/底部渐变遮罩, 替代硬切的滚动边界, 由 JS 根据滚动位置切换显隐 */
    > .edge-shadow {
      position: absolute;
      left: 0;
      right: 0;
      height: 18px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 160ms ease;
    }
    > .edge-shadow.visible {
      opacity: 1;
    }
    > .edge-shadow.top {
      top: 0;
      background: linear-gradient(
        to bottom,
        rgb(255 255 255 / 0.95),
        rgb(255 255 255 / 0)
      );
    }
    > .edge-shadow.bottom {
      bottom: 0;
      background: linear-gradient(
        to top,
        rgb(255 255 255 / 0.95),
        rgb(255 255 255 / 0)
      );
    }
  }

  > .divider {
    margin-top: 20px;
  }
`;

function ServerList({
  disabled,
  toNext,
}: {
  disabled: boolean;
  toNext: () => void;
}) {
  const { serverList } = useServer();
  const [checkingOrigin, setCheckingOrigin] = useState<string>();

  // 滚动边界遮罩: 通过监听 scrollTop 计算是否在顶/底, 决定上下渐变层是否显示
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setAtTop(scrollTop <= 0);
    // 留 1px 容错, 避免小数像素导致永远到不了"底"
    setAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    // 列表数量或卡片尺寸变化时也需要重新判断边界
    const resizeObserver = new ResizeObserver(updateEdges);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      resizeObserver.disconnect();
    };
  }, [updateEdges, serverList.length]);

  if (!serverList.length) return null;

  return (
    <Style>
      <div className="label">{t('existing_server')}</div>
      <div className="scroll-shell">
        <div
          className={`edge-shadow top${atTop ? '' : ' visible'}`}
          aria-hidden
        />
        <div ref={scrollRef} className="server-items">
        {serverList.map((s) => (
          <ServerCardItem
            key={s.origin}
            hostname={s.hostname}
            version={s.version}
            origin={s.origin}
            users={s.users}
            selectedUserId={s.selectedUserId}
            onClick={async () => {
              if (disabled || checkingOrigin) return;

              setCheckingOrigin(s.origin);
              try {
                const { default: getMetadata } = await import(
                  '@/server/base/get_metadata'
                );
                const metadata = await getMetadata(s.origin);
                if (!isSameMajorVersion(definition.VERSION, metadata.version)) {
                  dialog.alert({
                    content: t(
                      'server_major_version_mismatch',
                      definition.VERSION,
                      metadata.version,
                    ),
                  });
                  return;
                }
                useServer.setState((server) => ({
                  selectedServerOrigin: s.origin,
                  serverList: server.serverList.map((item) =>
                    item.origin === s.origin
                      ? {
                          ...item,
                          version: metadata.version,
                          hostname: metadata.hostname,
                        }
                      : item,
                  ),
                }));
                toNext();
              } catch (error) {
                logger.error(
                  error,
                  `Failed to get origin "${s.origin}" metadata`,
                );
                dialog.alert({ content: getServerMetadataErrorMessage(error) });
              } finally {
                setCheckingOrigin(undefined);
              }
            }}
            onDelete={(e) => {
              e.stopPropagation();
              dialog.confirm({
                content: t('delete_origin_question'),
                confirmVariant: 'danger',
                onConfirm: () =>
                  useServer.setState((server) => ({
                    serverList: server.serverList.filter(
                      (is) => is.origin !== s.origin,
                    ),
                  })),
              });
            }}
          />
        ))}
        </div>
        <div
          className={`edge-shadow bottom${atBottom ? '' : ' visible'}`}
          aria-hidden
        />
      </div>
      <div className="divider">
        <Divider label={t('or')} />
      </div>
    </Style>
  );
}

export default ServerList;
