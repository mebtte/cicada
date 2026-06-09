import { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components';
import { SHARED_MUSICBILL_INVITATION_MINIMAL_TTL } from '@/constants/musicbill';
import { CSSVariable } from '@/global_style';
import Spinner from '@/components/spinner';
import Empty from '@/components/empty';
import ErrorCard from '@/components/error_card';
import { Help } from '@/components/icon';
import { t } from '@/i18n';
import autoScrollbar from '@/style/auto_scrollbar';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import useDynamicZIndex from '../../use_dynamic_z_index';
import playerEventemitter, { EventType } from '../../eventemitter';
import useData from './use_data';
import Invitation from './invitation';

const TTL_DAY = SHARED_MUSICBILL_INVITATION_MINIMAL_TTL / (1000 * 60 * 60 * 24);
const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

const Root = styled.div`
  isolation: isolate;
  height: 100%;
  min-height: 0;

  display: flex;
  flex-direction: column;
`;
const Header = styled(DrawerHeader)`
  position: relative;
  z-index: 3;
  padding: 20px 18px 16px;

  background: #fff;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};
`;
const Body = styled.div`
  position: relative;
  z-index: 0;
  flex: 1;
  min-height: 0;
  padding: 16px 16px max(22px, env(safe-area-inset-bottom, 22px));
  overflow: auto;
  ${autoScrollbar}
`;
const StateBody = styled(Body)`
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ListBody = styled(Body)``;
const Hint = styled.div`
  margin-bottom: 16px;
  padding: 12px 12px 14px;

  display: flex;
  align-items: flex-start;
  gap: 10px;

  color: rgb(88 88 88);
  font-family: ${FONT};
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  font-weight: 800;
  line-height: 1.45;
  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};

  > svg {
    flex: 0 0 auto;
    margin-top: 1px;
    color: ${CSSVariable.COLOR_PRIMARY};
    font-size: 18px;
  }
`;
const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;
const Center = styled.div`
  width: 100%;
  min-height: 0;

  display: flex;
  align-items: center;
  justify-content: center;
`;

function SharedMusicbillInvitationDrawer() {
  const [open, setOpen] = useState(false);
  const zIndex = useDynamicZIndex(
    EventType.OPEN_SHARED_MUSICBILL_INVITATION_DRAWER,
  );
  const { top: titlebarTop } = useTitlebarOverlayInsets();
  const { data, reload } = useData(open);

  useEffect(() => {
    return playerEventemitter.listen(
      EventType.OPEN_SHARED_MUSICBILL_INVITATION_DRAWER,
      () => setOpen(true),
    );
  }, []);

  const onClose = () => setOpen(false);

  return (
    <Drawer open={open} onOpenChange={(value) => !value && onClose()}>
      <DrawerContent
        side="right"
        accessibleTitle={t('shared_musicbill_invitation')}
        style={{
          width: 'min(380px, calc(100vw - 20px))',
          paddingTop: titlebarTop,
        }}
        zIndex={zIndex}
      >
        <Root>
          <Header>
            <DrawerTitle>{t('shared_musicbill_invitation')}</DrawerTitle>
          </Header>
          {data.loading ? (
            <StateBody>
              <Center>
                <Spinner />
              </Center>
            </StateBody>
          ) : data.error ? (
            <StateBody>
              <Center>
                <ErrorCard errorMessage={data.error.message} retry={reload} />
              </Center>
            </StateBody>
          ) : data.value.length ? (
            <ListBody>
              <>
                <Hint>
                  <Help />
                  <span>
                    {t(
                      'invitation_will_be_canceled_automatically_after_days',
                      `${TTL_DAY}-${TTL_DAY + 1}`,
                    )}
                  </span>
                </Hint>
                <List>
                  {data.value.map((invitation) => (
                    <Invitation
                      key={invitation.id}
                      invitation={invitation}
                      onAccepted={onClose}
                    />
                  ))}
                </List>
              </>
            </ListBody>
          ) : (
            <StateBody>
              <Center>
                <Empty
                  description={t('no_shared_musicbill_invitation')}
                  aria-live="polite"
                />
              </Center>
            </StateBody>
          )}
        </Root>
      </DrawerContent>
    </Drawer>
  );
}

export default SharedMusicbillInvitationDrawer;
