import styled from 'styled-components';
import Button from '@/components/button';
import { MdHelpOutline } from 'react-icons/md';
import dialog from '@/utils/dialog';
import { useUser } from '@/global_states/server';
import { t } from '@/i18n';
import Filter from './filter';
import { TOOLBAR_HEIGHT } from '../constants';
import { CONTROLLER_FLOATING_RESERVED_HEIGHT } from '../../../constants';

const Style = styled.div`
  position: absolute;
  width: 100%;
  height: ${TOOLBAR_HEIGHT}px;
  left: 0;
  bottom: ${CONTROLLER_FLOATING_RESERVED_HEIGHT};

  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  backdrop-filter: blur(5px);
`;

function Toolbar() {
  const user = useUser()!;
  return (
    <Style>
      <Button
        square
        variant="plain"
        size="sm"
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
