import styled from 'styled-components';
import Button from '@/components/button';
import { MdHelpOutline } from 'react-icons/md';
import dialog from '@/utils/dialog';
import { useUser } from '@/global_states/server';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import Filter from './filter';
import { TOOLBAR_HEIGHT } from '../constants';

const Style = styled.div`
  position: relative;
  z-index: 2;

  width: 100%;
  flex: 0 0 ${TOOLBAR_HEIGHT}px;

  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  background: #fff;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 3px 0 rgb(214 214 214);
`;

function Toolbar() {
  const user = useUser()!;
  return (
    <Style>
      <Button
        square
        variant="ghost"
        size="md"
        onClick={() =>
          dialog.alert({
            content: (
              <div>
                <div>
                  {user.musicPlayRecordIndate === 0
                    ? t('music_play_record_indefinite_retention_instruction')
                    : t(
                        'music_play_record_days_retention_instruction',
                        user.musicPlayRecordIndate.toString(),
                      )}
                </div>
                <div>
                  {t('music_play_record_browser_limit_instruction')}
                </div>
              </div>
            ),
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
