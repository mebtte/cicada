import styled from 'styled-components';
import { useEffect, useState } from 'react';
import Button from '@/components/button';
import { Help, Refresh } from '@/components/icon';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { PAGE_HORIZONTAL_PADDING } from '../../page';
import Filter from './filter';
import e, { EventType } from '../eventemitter';
import { TOOLBAR_FLOATING_GAP, TOOLBAR_HEIGHT } from '../constants';

const NEUTRAL_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const TOOLBAR_HORIZONTAL_INSET = `calc(${PAGE_HORIZONTAL_PADDING} + 8px)`;

const Style = styled.div`
  z-index: 2;

  position: absolute;
  /* Keep the floating toolbar slightly narrower than the list content. */
  left: ${TOOLBAR_HORIZONTAL_INSET};
  right: ${TOOLBAR_HORIZONTAL_INSET};
  top: ${TOOLBAR_FLOATING_GAP}px;
  height: ${TOOLBAR_HEIGHT}px;

  padding: 7px 10px 9px;

  display: flex;
  align-items: center;
  gap: 8px;

  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 14px;
  box-shadow: 0 5px 0 ${NEUTRAL_SHADOW};

  @media (max-width: 420px) {
    gap: 6px;
    padding-right: 8px;
    padding-left: 8px;
  }
`;

function Toolbar() {
  // 跟随列表的加载态, 加载过程中刷新按钮呈现 loading
  const [loading, setLoading] = useState(false);
  useEffect(
    () =>
      e.listen(EventType.LOADING_CHANGE, (payload) =>
        setLoading(payload.loading),
      ),
    [],
  );

  return (
    <Style>
      <Button
        square
        variant="ghost"
        size="sm"
        onClick={() =>
          dialog.alert({
            content: t('music_play_record_browser_limit_instruction'),
            confirmText: t('got_it'),
          })
        }
      >
        <Help />
      </Button>
      {/* 刷新按钮: 点击后通知列表重新拉取当前播放记录 */}
      <Button
        square
        variant="ghost"
        size="sm"
        loading={loading}
        onClick={() => e.emit(EventType.RELOAD, null)}
      >
        <Refresh />
      </Button>
      <Filter />
    </Style>
  );
}

export default Toolbar;
