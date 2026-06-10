import { ChangeEventHandler, KeyboardEventHandler, useState } from 'react';
import styled from 'styled-components';
import Input from '@/components/input';
import logger from '@/utils/logger';
import Button from '@/components/button';
import { t } from '@/i18n';
import Logo from '../logo';
import Language from './language';
import ServerList from './server_list';
import { useServer } from '@/global_states/server';
import { Divider } from '@/components';
import definition from '@/definition';
import { isSameMajorVersion } from '@/utils/version';
import dialog from '@/utils/dialog';
import { getServerMetadataErrorMessage } from '../utils';
import { isKeyboardEventComposing } from '@/utils/keyboard';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  -webkit-app-region: no-drag;
`;

function FirstStep({
  toNext,
  onManage: _onManage,
}: {
  toNext: () => void;
  onManage: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [checkingOrigin, setCheckingOrigin] = useState<string>();
  const busy = loading || !!checkingOrigin;
  const [origin, setOrigin] = useState(
    () => useServer.getState().selectedServerOrigin || window.location.origin,
  );
  const onOriginChange: ChangeEventHandler<HTMLInputElement> = (event) =>
    setOrigin(event.target.value);

  const onSaveOrigin = async () => {
    if (busy) return;
    setLoading(true);
    try {
      const existedServer = useServer
        .getState()
        .serverList.find((s) => s.origin === origin);
      const { default: getMetadata } = await import(
        '@/server/base/get_metadata'
      );
      const metadata = await getMetadata(origin);
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
      if (existedServer) {
        useServer.setState((server) => ({
          selectedServerOrigin: origin,
          serverList: server.serverList.map((s) =>
            s.origin === origin
              ? {
                  ...s,
                  version: metadata.version,
                  hostname: metadata.hostname,
                  imageFileMaxSize: metadata.imageFileMaxSize,
                  audioFileMaxSize: metadata.audioFileMaxSize,
                  videoFileMaxSize: metadata.videoFileMaxSize,
                }
              : s,
          ),
        }));
      } else {
        useServer.setState((server) => ({
          selectedServerOrigin: origin,
          serverList: [
            ...server.serverList,
            {
              version: metadata.version,
              hostname: metadata.hostname,
              imageFileMaxSize: metadata.imageFileMaxSize,
              audioFileMaxSize: metadata.audioFileMaxSize,
              videoFileMaxSize: metadata.videoFileMaxSize,
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
      dialog.alert({ content: getServerMetadataErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (!isKeyboardEventComposing(event) && event.key === 'Enter') {
      onSaveOrigin();
    }
  };

  return (
    <Style>
      <Logo />
      <Language disabled={busy} />
      <Divider />
      <ServerList
        toNext={toNext}
        disabled={loading}
        checkingOrigin={checkingOrigin}
        onCheckingOriginChange={setCheckingOrigin}
      />
      <Input
        label={t('origin')}
        type="url"
        disabled={busy}
        value={origin}
        onChange={onOriginChange}
        onKeyDown={onKeyDown}
        autoFocus
      />
      <Button
        variant={'primary'}
        onClick={onSaveOrigin}
        disabled={!origin.length || busy}
        loading={loading}
      >
        {t('add_origin')}
      </Button>
    </Style>
  );
}

export default FirstStep;
