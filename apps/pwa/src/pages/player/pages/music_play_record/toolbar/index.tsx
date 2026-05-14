import styled from 'styled-components';
import Button from '@/components/button';
import { MdHelpOutline } from 'react-icons/md';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../../constants';
import Filter from './filter';
import { TOOLBAR_HEIGHT } from '../constants';

const NEUTRAL_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;

const Style = styled.div`
  z-index: 2;

  position: absolute;
  left: 36px;
  right: 36px;
  bottom: calc(${FLOATING_CONTROLLER_SCROLL_SPACE} + 12px);
  height: ${TOOLBAR_HEIGHT}px;

  padding: 8px 12px 12px;

  display: flex;
  align-items: center;
  gap: 10px;

  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  box-shadow: 0 6px 0 ${NEUTRAL_SHADOW};

  @media (max-width: 680px) {
    left: 24px;
    right: 24px;
  }

  @media (max-width: 420px) {
    left: 18px;
    right: 18px;
    gap: 8px;
    padding-right: 10px;
    padding-left: 10px;
  }
`;

function Toolbar() {
  return (
    <Style>
      <Button
        square
        variant="ghost"
        size="md"
        onClick={() =>
          dialog.alert({
            content: t('music_play_record_browser_limit_instruction'),
            confirmText: t('got_it'),
          })
        }
      >
        <MdHelpOutline />
      </Button>
      <Filter />
    </Style>
  );
}

export default Toolbar;
