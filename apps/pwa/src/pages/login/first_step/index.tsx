import { ChangeEventHandler, KeyboardEventHandler, useState } from 'react';
import styled from 'styled-components';
import notice from '@/utils/notice';
import Input from '@/components/input';
import Label from '@/components/label';
import logger from '@/utils/logger';
import Button, { Variant } from '@/components/button';
import { t } from '@/i18n';
import getMetadata from '@/server/base/get_metadata';
import server from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import Logo from '../logo';
import Language from './language';
import ServerList from './server_list';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  -webkit-app-region: no-drag;

  > .divider {
    height: 1px;
    background-color: ${CSSVariable.COLOR_BORDER};
  }
`;

function FirstStep({ toNext }: { toNext: () => void }) {
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState(
    () => server.get().selectedServerOrigin || window.location.origin,
  );
  const onOriginChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setOrigin(event.target.value);

  const onSaveOrigin = async () => {
    setLoading(true);
    try {
      const existedServer = server
        .get()
        .serverList.find((s) => s.origin === origin);
      if (existedServer) {
        server.set((ss) => ({
          ...ss,
          selectedServerOrigin: origin,
        }));
      } else {
        const metadata = await getMetadata(origin);
        server.set((ss) => ({
          ...ss,
          selectedServerOrigin: origin,
          serverList: [
            ...ss.serverList,
            {
              version: metadata.version,
              hostname: metadata.hostname,
              origin,
              users: [],
              selectedUserId: undefined,
            },
          ],
        }));
      }
      toNext();
    } catch (error) {
      logger.error(error, `Failed to get origin "${origin}" metadata`);
      notice.error(t('failed_to_get_server_metadata'));
    }
    setLoading(false);
  };

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      onSaveOrigin();
    }
  };

  return (
    <Style>
      <Logo />
      <Language disabled={loading} />
      <div className="divider" />
      <ServerList toNext={toNext} disabled={loading} />
      <Label label={t('origin')}>
        <Input
          type="url"
          disabled={loading}
          value={origin}
          onChange={onOriginChange}
          onKeyDown={onKeyDown}
          autoFocus
        />
      </Label>
      <Button
        variant={Variant.PRIMARY}
        onClick={onSaveOrigin}
        disabled={!origin.length}
        loading={loading}
      >
        {t('add_origin')}
      </Button>
    </Style>
  );
}

export default FirstStep;
