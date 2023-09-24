import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useEffect,
  useState,
} from 'react';
import Label from '@/components/label';
import styled from 'styled-components';
import notice from '@/utils/notice';
import Input from '@/components/input';
import logger from '@/utils/logger';
import Button, { Variant } from '@/components/button';
import { ORIGIN } from '#/constants/regexp';
import { t } from '@/i18n';
import getMetadata from '@/server/base/get_metadata';
import server, { useServer } from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import Logo from '../logo';
import Paper from '../paper';
import Language from './language';
import ServerList from './server_list';

const Style = styled(Paper)`
  display: flex;
  flex-direction: column;
  gap: 20px;

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
    if (!ORIGIN.test(origin)) {
      return notice.error(t('invalid_origin'));
    }

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
      <ServerList toNext={toNext} />
      <Input
        disabled={loading}
        label={t('origin')}
        inputProps={{
          value: origin,
          onChange: onOriginChange,
          onKeyDown,
          autoFocus: true,
        }}
      />
      <Button
        variant={Variant.PRIMARY}
        onClick={onSaveOrigin}
        disabled={loading || !origin.length}
      >
        {t('add_origin')}
      </Button>
    </Style>
  );
}

export default FirstStep;
