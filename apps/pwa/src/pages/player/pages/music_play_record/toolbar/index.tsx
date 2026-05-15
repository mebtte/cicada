import styled from 'styled-components';
import Button from '@/components/button';
import { MdHelpOutline } from 'react-icons/md';
import dialog from '@/utils/dialog';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { PAGE_HORIZONTAL_PADDING } from '../../page';
import Filter from './filter';
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
        <MdHelpOutline />
      </Button>
      <Filter />
    </Style>
  );
}

export default Toolbar;
